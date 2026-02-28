import { describe, expect, test } from 'bun:test';
import { Lexer } from '../lexer/lexer';
import { Parser } from './parser';

function parse(input: string) {
  const lexer = new Lexer(input);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);

  return parser.parse();
}

describe('Markdown Compatibility', () => {
  test('should parse standard headings', () => {
    const input = '# Heading 1\n## Heading 2\n### Heading 3';
    const ast = parse(input);

    expect(ast.children[0].type).toBe('Heading');
    expect((ast.children[0] as any).level).toBe(1);
    expect(ast.children[1].type).toBe('Heading');
    expect((ast.children[1] as any).level).toBe(2);
    expect(ast.children[2].type).toBe('Heading');
    expect((ast.children[2] as any).level).toBe(3);
  });

  test('should parse emphasis and strong', () => {
    const input = 'Normal **Bold** //Italic//';
    const ast = parse(input);

    const paragraph = ast.children[0] as any;
    expect(paragraph.children[1].type).toBe('Bold');
    expect(paragraph.children[3].type).toBe('Italic');
  });

  test('should parse standard lists', () => {
    const input = '- Item 1\n- Item 2\n  - Nested';
    const ast = parse(input);

    expect(ast.children[0].type).toBe('List');
    const list = ast.children[0] as any;
    expect(list.kind).toBe('bullet');
    expect(list.children).toHaveLength(2);
  });

  test('should parse standard blockquotes', () => {
    const input = '> Quote\n> More quote';
    const ast = parse(input);

    expect(ast.children[0].type).toBe('Blockquote');
  });

  test('should parse standard code blocks', () => {
    const input = '```js\nconst x = 1;\n```';
    const ast = parse(input);

    expect(ast.children[0].type).toBe('CodeBlock');
    expect((ast.children[0] as any).language).toBe('js');
  });

  test('should parse standard links and images', () => {
    // Use double newline for separate paragraphs
    const input = '[Link](https://example.com)\n\n![Image](img.png)';
    const ast = parse(input);

    expect(ast.children[0].type).toBe('Paragraph');
    const p1 = ast.children[0] as any;
    expect(p1.children[0].type).toBe('Link');
    expect(p1.children[0].href).toBe('https://example.com');

    expect(ast.children[1].type).toBe('Paragraph');
    const p2 = ast.children[1] as any;
    expect(p2.children[0].type).toBe('Image');
    expect(p2.children[0].src).toBe('img.png');
  });

  test('should parse horizontal rules', () => {
    const input = '---\n***\n___';
    const ast = parse(input);

    expect(ast.children[0].type).toBe('HorizontalRule');
    expect(ast.children[1].type).toBe('HorizontalRule');
    expect(ast.children[2].type).toBe('HorizontalRule');
  });
});
