import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { HTMLBuilder } from '../builder/html/builder';
import { Lexer } from '../lexer/lexer';
import { Parser } from '../parser/parser';

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
    const mainContent = 'Main Title\n\n{{include included.zlt}}';

    const lexer = new Lexer(mainContent);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens, mainFile);
    const doc = parser.parse();
    const builder = new HTMLBuilder();
    // Using visitDocument to only check the rendered body content
    const html = builder.visitDocument(doc);

    expect(html).toContain('id="included-content"');
    expect(html).toContain('Included Content');
    expect(html).toContain('<p>This is from the included file.</p>');
  });

  test('should handle recursive inclusions', async () => {
    const file3 = path.join(tempDir, 'file3.zlt');
    fs.writeFileSync(file3, 'Final Content');

    const file2 = path.join(tempDir, 'file2.zlt');
    fs.writeFileSync(file2, '{{include file3.zlt}}');

    const file1 = path.join(tempDir, 'file1.zlt');
    const content1 = 'Start\n\n{{include file2.zlt}}';

    const lexer = new Lexer(content1);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens, file1);
    const doc = parser.parse();
    const builder = new HTMLBuilder();
    const html = builder.visitDocument(doc);

    expect(html).toContain('<p>Start</p>');
    expect(html).toContain('<p>Final Content</p>');
  });

  test('should detect circular inclusions', async () => {
    const fileA = path.join(tempDir, 'fileA.zlt');
    const fileB = path.join(tempDir, 'fileB.zlt');

    fs.writeFileSync(fileA, '{{include fileB.zlt}}');
    fs.writeFileSync(fileB, '{{include fileA.zlt}}');

    const lexer = new Lexer('{{include fileA.zlt}}');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens, path.join(tempDir, 'main.zlt'));
    const doc = parser.parse();
    const builder = new HTMLBuilder();

    const html = builder.visitDocument(doc);
    expect(html).toContain('Circular inclusion detected');
  });

  test('should inherit variables from parent', async () => {
    const includedFile = path.join(tempDir, 'vars.zlt');
    fs.writeFileSync(includedFile, 'Hello {$name}!');

    const mainFile = path.join(tempDir, 'main.zlt');
    const mainContent = '$name = "Zolt"\n\n{{include vars.zlt}}';

    const lexer = new Lexer(mainContent);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens, mainFile);
    const doc = parser.parse();
    const builder = new HTMLBuilder();
    const html = builder.buildDocument(doc);

    expect(html).toContain('Hello Zolt!');
  });

  test('should include headings from included files in TOC', async () => {
    const includedFile = path.join(tempDir, 'content.zlt');
    fs.writeFileSync(includedFile, '## Section from Include');

    const mainFile = path.join(tempDir, 'main.zlt');
    const mainContent = '[[toc]]\n\n# Main Title\n\n{{include content.zlt}}';

    const lexer = new Lexer(mainContent);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens, mainFile);
    const doc = parser.parse();
    const builder = new HTMLBuilder();
    const html = builder.visitDocument(doc);

    expect(html).toContain('Main Title');
    expect(html).toContain('Section from Include');
    expect(html).toContain('class="zolt-toc"');
  });
});
