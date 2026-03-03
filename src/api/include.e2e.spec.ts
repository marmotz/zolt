import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { buildString } from './index';

describe('Include E2E', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zolt-include-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('should include content from another file', async () => {
    const includedFile = path.join(tempDir, 'included.zlt');
    fs.writeFileSync(includedFile, '# Included Content\n\nThis is from the included file.');

    const mainFile = path.join(tempDir, 'main.zlt');
    const mainContent = 'Main Title\n\n:::include included.zlt :::';

    const html = await buildString(mainContent, { filePath: mainFile });

    expect(html).toContain('id="included-content"');
    expect(html).toContain('Included Content');
    expect(html).toContain('<p>This is from the included file.</p>');
  });

  test('should handle recursive inclusions', async () => {
    const file3 = path.join(tempDir, 'file3.zlt');
    fs.writeFileSync(file3, 'Final Content');

    const file2 = path.join(tempDir, 'file2.zlt');
    fs.writeFileSync(file2, ':::include file3.zlt :::');

    const file1 = path.join(tempDir, 'file1.zlt');
    const content1 = 'Start\n\n:::include file2.zlt :::';

    const html = await buildString(content1, { filePath: file1 });

    expect(html).toContain('<p>Start</p>');
    expect(html).toContain('<p>Final Content</p>');
  });

  test('should detect circular inclusions', async () => {
    const fileA = path.join(tempDir, 'fileA.zlt');
    const fileB = path.join(tempDir, 'fileB.zlt');

    fs.writeFileSync(fileA, ':::include fileB.zlt :::');
    fs.writeFileSync(fileB, ':::include fileA.zlt :::');

    const html = await buildString(':::include fileA.zlt :::', { filePath: path.join(tempDir, 'main.zlt') });
    expect(html).toContain('Circular inclusion detected');
  });

  test('should inherit variables from parent', async () => {
    const includedFile = path.join(tempDir, 'vars.zlt');
    fs.writeFileSync(includedFile, 'Hello {$name}!');

    const mainFile = path.join(tempDir, 'main.zlt');
    const mainContent = '$name = "Zolt"\n\n:::include vars.zlt :::';

    const html = await buildString(mainContent, { filePath: mainFile });

    expect(html).toContain('Hello Zolt!');
  });

  test('should include headings from included files in TOC', async () => {
    const includedFile = path.join(tempDir, 'content.zlt');
    fs.writeFileSync(includedFile, '## Section from Include');

    const mainFile = path.join(tempDir, 'main.zlt');
    const mainContent = '[[toc]]\n\n# Main Title\n\n:::include content.zlt :::';

    const html = await buildString(mainContent, { filePath: mainFile });

    expect(html).toContain('Main Title');
    expect(html).toContain('Section from Include');
    expect(html).toContain('class="zolt-toc"');
  });

  test('should handle nested blocks in included files', async () => {
    const includedFile = path.join(tempDir, 'blocks.zlt');
    fs.writeFileSync(includedFile, ':::tabs\n:::tab [Tab 1]\nContent 1\n:::tab [Tab 2]\nContent 2\n:::\n');

    const mainFile = path.join(tempDir, 'main.zlt');
    const mainContent = '# Test\n\n:::include blocks.zlt :::';

    const html = await buildString(mainContent, { filePath: mainFile });

    expect(html).toContain('zolt-tabs');
    expect(html).toContain('Tab 1');
    expect(html).toContain('Content 2');
  });

  test('should handle loops that include files', async () => {
    const itemA = path.join(tempDir, 'itemA.zlt');
    fs.writeFileSync(itemA, 'Content for A');

    const itemB = path.join(tempDir, 'itemB.zlt');
    fs.writeFileSync(itemB, 'Content for B');

    const mainFile = path.join(tempDir, 'main.zlt');
    const mainContent = `
$items = ["itemA.zlt", "itemB.zlt"]
:::foreach {$items as $file}
### File: {$file}
:::include {$file} :::
:::
`;
    // Note: Variable expansion in :::include is supported because SourceEvaluator
    // processes the line before evaluating it if it's not a block.
    // Wait, SourceEvaluator.evaluate currently takes trimmed.substring(10).trim() for path.
    // It doesn't evaluate the path as an expression yet!

    // Let's check SourceEvaluator.ts again.
    // if (trimmed.startsWith(':::include')) { const includePath = trimmed.substring(10).trim(); ... }

    // I should probably improve SourceEvaluator to evaluate the include path too!

    const html = await buildString(mainContent, { filePath: mainFile });

    expect(html).toContain('File: itemA.zlt');
    expect(html).toContain('Content for A');
    expect(html).toContain('File: itemB.zlt');
    expect(html).toContain('Content for B');
  });
});
