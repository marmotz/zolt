import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ExpressionEvaluator } from './expression-evaluator';
import { SourceEvaluator } from './source-evaluator';

describe('SourceEvaluator', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zolt-source-evaluator-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test('should pass through regular content', () => {
    const evaluator = new ExpressionEvaluator();
    const sourceEvaluator = new SourceEvaluator(evaluator);

    const result = sourceEvaluator.evaluate('Hello World');
    expect(result).toBe('Hello World');
  });

  test('should skip comment blocks', () => {
    const evaluator = new ExpressionEvaluator();
    const sourceEvaluator = new SourceEvaluator(evaluator);

    const input = `:::comment
This is a comment
:::
Regular content`;

    const result = sourceEvaluator.evaluate(input);
    expect(result).toContain('Regular content');
    expect(result).not.toContain('This is a comment');
  });

  test('should evaluate if block when condition is true', () => {
    const evaluator = new ExpressionEvaluator();
    evaluator.setVariable('show', true);
    const sourceEvaluator = new SourceEvaluator(evaluator);

    const input = `:::if true
Visible content
:::
Hidden`;

    const result = sourceEvaluator.evaluate(input);
    expect(result).toContain('Visible content');
  });

  test('should skip if block when condition is false', () => {
    const evaluator = new ExpressionEvaluator();
    evaluator.setVariable('show', false);
    const sourceEvaluator = new SourceEvaluator(evaluator);

    const input = `:::if false
Hidden content
:::
Visible`;

    const result = sourceEvaluator.evaluate(input);
    expect(result).toContain('Visible');
    expect(result).not.toContain('Hidden content');
  });

  test('should evaluate foreach block', () => {
    const evaluator = new ExpressionEvaluator();
    evaluator.setVariable('items', ['apple', 'banana', 'cherry']);
    const sourceEvaluator = new SourceEvaluator(evaluator);

    const input = `:::foreach {$items as $item}
- {$item}
:::`;

    const result = sourceEvaluator.evaluate(input);
    expect(result).toContain('- apple');
    expect(result).toContain('- banana');
    expect(result).toContain('- cherry');
  });

  test('should set foreach variables', () => {
    const evaluator = new ExpressionEvaluator();
    evaluator.setVariable('items', ['a', 'b']);
    const sourceEvaluator = new SourceEvaluator(evaluator);

    const input = `:::foreach {$items as $item}
{$item}: {$foreach.index},{$foreach.index1},{$foreach.first},{$foreach.last},{$foreach.even},{$foreach.odd}
:::`;

    const result = sourceEvaluator.evaluate(input);
    expect(result).toContain('a: 0,1,true,false,true,false');
    expect(result).toContain('b: 1,2,false,true,false,true');
  });

  test('should skip code blocks', () => {
    const evaluator = new ExpressionEvaluator();
    const sourceEvaluator = new SourceEvaluator(evaluator);

    const input = `\`\`\`
:::foreach
:::
\`\`\`
After code`;

    const result = sourceEvaluator.evaluate(input);
    expect(result).toContain(':::foreach');
    expect(result).toContain('After code');
  });

  test('should process variable definitions', () => {
    const evaluator = new ExpressionEvaluator();
    const sourceEvaluator = new SourceEvaluator(evaluator);

    const input = `$name = "World"
Hello {$name}`;

    const result = sourceEvaluator.evaluate(input);
    expect(result).toContain('Hello World');
  });

  test('should process frontmatter and extract variables', () => {
    const evaluator = new ExpressionEvaluator();
    const sourceEvaluator = new SourceEvaluator(evaluator);

    const input = `---
title: Frontmatter Title
author: "Zolt Expert"
count: 42
---
# {$title}
By {$author} ({$count})`;

    const result = sourceEvaluator.evaluate(input);
    expect(result).toContain('---');
    expect(result).toContain('title: Frontmatter Title');
    expect(result).toContain('# Frontmatter Title');
    expect(result).toContain('By Zolt Expert (42)');
  });

  test('should handle :::include', () => {
    const includedPath = path.join(tempDir, 'included.zlt');
    fs.writeFileSync(includedPath, 'Included content with {$name}');

    const evaluator = new ExpressionEvaluator();
    evaluator.setVariable('name', 'Zolt');
    const sourceEvaluator = new SourceEvaluator(evaluator, path.join(tempDir, 'main.zlt'));

    const input = `Main
:::include included.zlt
End`;

    const result = sourceEvaluator.evaluate(input);
    expect(result).toContain('Main');
    expect(result).toContain('Included content with Zolt');
    expect(result).toContain('End');
  });

  test('should handle recursive inclusions', () => {
    const fileB = path.join(tempDir, 'fileB.zlt');
    fs.writeFileSync(fileB, 'Content B');

    const fileA = path.join(tempDir, 'fileA.zlt');
    fs.writeFileSync(fileA, ':::include fileB.zlt');

    const evaluator = new ExpressionEvaluator();
    const sourceEvaluator = new SourceEvaluator(evaluator, path.join(tempDir, 'main.zlt'));

    const result = sourceEvaluator.evaluate(':::include fileA.zlt');
    expect(result).toContain('Content B');
  });

  test('should detect circular inclusions', () => {
    const fileA = path.join(tempDir, 'fileA.zlt');
    const fileB = path.join(tempDir, 'fileB.zlt');

    fs.writeFileSync(fileA, ':::include fileB.zlt');
    fs.writeFileSync(fileB, ':::include fileA.zlt');

    const evaluator = new ExpressionEvaluator();
    const sourceEvaluator = new SourceEvaluator(evaluator, path.join(tempDir, 'main.zlt'));

    const result = sourceEvaluator.evaluate(':::include fileA.zlt');
    expect(result).toContain('Circular inclusion detected');
  });

  test('should handle max inclusion depth', () => {
    // Create a chain of inclusions
    for (let i = 0; i < 12; i++) {
      fs.writeFileSync(path.join(tempDir, `file${i}.zlt`), `:::include file${i + 1}.zlt`);
    }

    const evaluator = new ExpressionEvaluator();
    const sourceEvaluator = new SourceEvaluator(evaluator, path.join(tempDir, 'main.zlt'));

    const result = sourceEvaluator.evaluate(':::include file0.zlt');
    expect(result).toContain('Max inclusion depth reached');
  });

  test('should handle layout injection', () => {
    const layoutPath = path.join(tempDir, 'layout.zlt');
    fs.writeFileSync(layoutPath, 'Header\n:::content:::\nFooter');

    const evaluator = new ExpressionEvaluator();
    evaluator.setVariable('layout', 'layout.zlt');
    const sourceEvaluator = new SourceEvaluator(evaluator, path.join(tempDir, 'main.zlt'), [], undefined, false, true);

    const result = sourceEvaluator.evaluate('My Content');
    expect(result).toBe('Header\nMy Content\nFooter');
  });

  test('should merge metadata between document and layout', () => {
    const layoutPath = path.join(tempDir, 'layout.zlt');
    fs.writeFileSync(
      layoutPath,
      `---
title: Layout Title
theme: dark
---
:::content:::`
    );

    const evaluator = new ExpressionEvaluator();
    const sourceEvaluator = new SourceEvaluator(evaluator, path.join(tempDir, 'main.zlt'), [], undefined, false, true);

    const input = `---
layout: layout.zlt
title: Doc Title
---
Content`;

    const result = sourceEvaluator.evaluate(input);

    // Metadata should be merged, with document metadata taking priority
    expect(result).toContain('---');
    expect(result).toContain('title: Layout Title');
    expect(result).toContain('theme: dark');
    expect(result).toContain('layout: layout.zlt');
    expect(result).toContain('title: Doc Title'); // Overrides Layout Title
    expect(result).toContain('Content');
  });

  test('should replace multiple :::content::: tags (if present)', () => {
    const layoutPath = path.join(tempDir, 'layout.zlt');
    fs.writeFileSync(layoutPath, 'Content 1: :::content:::\nContent 2: :::content:::');

    const evaluator = new ExpressionEvaluator();
    evaluator.setVariable('layout', 'layout.zlt');
    const sourceEvaluator = new SourceEvaluator(evaluator, path.join(tempDir, 'main.zlt'), [], undefined, false, true);

    const result = sourceEvaluator.evaluate('My Content');
    expect(result).toContain('Content 1: My Content');
    expect(result).toContain('Content 2: My Content');
  });
});
