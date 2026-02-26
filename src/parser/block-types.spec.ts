import { describe, expect, test } from 'bun:test';
import { Lexer } from '../lexer/lexer';
import { Parser } from './parser';

function parse(input: string) {
  const lexer = new Lexer(input);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  return parser.parse();
}

describe('Block Type Recognition', () => {
  test('should recognize headings', () => {
    const ast = parse('# Heading');
    expect(ast.children[0].type).toBe('Heading');
  });

  test('should recognize paragraphs', () => {
    const ast = parse('This is a paragraph.');
    expect(ast.children[0].type).toBe('Paragraph');
  });

  test('should recognize lists', () => {
    const ast = parse('- Item');
    expect(ast.children[0].type).toBe('List');
  });

  test('should recognize blockquotes', () => {
    const ast = parse('> Quote');
    expect(ast.children[0].type).toBe('Blockquote');
  });

  test('should recognize code blocks', () => {
    const ast = parse('```\ncode\n```');
    expect(ast.children[0].type).toBe('CodeBlock');
  });

  test('should recognize tables', () => {
    const ast = parse('| a | b |\n|---|---|\n| 1 | 2 |');
    expect(ast.children[0].type).toBe('Table');
  });

  test('should recognize separators', () => {
    const ast = parse('---');
    expect(ast.children[0].type).toBe('HorizontalRule');
  });

  test('should recognize triple colon blocks', () => {
    const ast = parse(':::info\nNote\n:::');
    expect(ast.children[0].type).toBe('TripleColonBlock');
    expect((ast.children[0] as any).blockType).toBe('info');
  });

  test('should recognize indentation blocks', () => {
    const ast = parse('& Indented text');
    expect(ast.children[0].type).toBe('Indentation');
  });

  test('should recognize frontmatter', () => {
    const ast = parse('---\ntitle: test\n---\nContent');
    expect(ast.children[0].type).toBe('Frontmatter');
  });

  test('should recognize variable definitions', () => {
    const ast = parse('$var = "val"');
    expect(ast.children[0].type).toBe('VariableDefinition');
  });

  test('should recognize conditional blocks', () => {
    const ast = parse(':::if {{ $var }}\nTrue\n:::');
    expect(ast.children[0].type).toBe('TripleColonBlock');
    expect((ast.children[0] as any).blockType).toBe('if {{ $var }}');
  });

  test('should recognize loops', () => {
    const ast = parse(':::foreach {$arr as $item}\nItem\n:::');
    expect(ast.children[0].type).toBe('TripleColonBlock');
    expect((ast.children[0] as any).blockType).toBe('foreach {$arr as $item}');
  });

  test('should recognize chart blocks', () => {
    const ast = parse(':::chart\n:::chart-line\ndata\n:::\n:::');
    expect(ast.children[0].type).toBe('Chart');
  });

  test('should recognize mermaid blocks', () => {
    const ast = parse(':::mermaid\ngraph TD;\nA-->B;\n:::');
    expect(ast.children[0].type).toBe('Mermaid');
  });

  test('should recognize tab blocks', () => {
    const ast = parse(':::tabs\n:::tab [A]\nContent\n:::\n:::');
    expect(ast.children[0].type).toBe('TripleColonBlock');
    expect((ast.children[0] as any).blockType).toBe('tabs');
  });

  test('should recognize column blocks', () => {
    const ast = parse(':::columns\n:::column\nContent\n:::\n:::');
    expect(ast.children[0].type).toBe('TripleColonBlock');
    expect((ast.children[0] as any).blockType).toBe('columns');
  });
});
