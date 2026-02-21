import { describe, expect, test } from 'bun:test';
import { Lexer } from '../lexer/lexer';
import { Parser } from './parser';

describe('Parser', () => {
  test('should parse heading', () => {
    const lexer = new Lexer('# Hello World');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.type).toBe('Document');
    expect(ast.children[0].type).toBe('Heading');
    expect((ast.children[0] as any).content).toBe('Hello World');
    expect((ast.children[0] as any).level).toBe(1);
  });

  test('should parse paragraph', () => {
    const lexer = new Lexer('This is a paragraph');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('Paragraph');
    expect((ast.children[0] as any).content).toBe('This is a paragraph');
  });

  test('should parse bullet list', () => {
    const lexer = new Lexer('- item 1\n- item 2');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('List');
    expect((ast.children[0] as any).kind).toBe('bullet');
    expect((ast.children[0] as any).children.length).toBe(2);
  });

  test('should parse numbered list', () => {
    const lexer = new Lexer('1. First\n2. Second');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('List');
    expect((ast.children[0] as any).kind).toBe('numbered');
  });

  test('should parse blockquote', () => {
    const lexer = new Lexer('> Quote text');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('Blockquote');
    expect((ast.children[0] as any).level).toBe(1);
  });

  test('should parse horizontal rule', () => {
    const lexer = new Lexer('---');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('HorizontalRule');
  });

  test('should parse code block', () => {
    const lexer = new Lexer('```js\ncode\n```');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('CodeBlock');
    expect((ast.children[0] as any).language).toBe('js');
  });

  test('should parse multiple blocks', () => {
    const lexer = new Lexer('# Title\n\nParagraph text');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children.length).toBe(2);
    expect(ast.children[0].type).toBe('Heading');
    expect(ast.children[1].type).toBe('Paragraph');
  });

  test('should handle empty input', () => {
    const lexer = new Lexer('');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.type).toBe('Document');
  });

  test('should set sourceFile', () => {
    const lexer = new Lexer('text');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens, 'test.zlt');
    const ast = parser.parse();

    expect(ast.sourceFile).toBe('test.zlt');
  });

  test('should parse heading level 2', () => {
    const lexer = new Lexer('## Section Title');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('Heading');
    expect((ast.children[0] as any).level).toBe(2);
    expect((ast.children[0] as any).content).toBe('Section Title');
  });

  test('should parse list with content', () => {
    const lexer = new Lexer('- item 1\n- item 2');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('List');
    expect((ast.children[0] as any).children.length).toBe(2);
    expect((ast.children[0] as any).children[0].content).toBe('item 1');
    expect((ast.children[0] as any).children[1].content).toBe('item 2');
  });

  test('should parse numbered list with content', () => {
    const lexer = new Lexer('1. First\n2. Second');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('List');
    expect((ast.children[0] as any).kind).toBe('numbered');
    expect((ast.children[0] as any).children[0].content).toBe('First');
    expect((ast.children[0] as any).children[1].content).toBe('Second');
  });

  test('should parse inline style with single attribute', () => {
    const lexer = new Lexer('This is ||important||{color=red} text');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('Paragraph');
    expect((ast.children[0] as any).content).toContain('||important||{color=red}');
  });

  test('should parse inline style with multiple attributes', () => {
    const lexer = new Lexer('||Warning||{color=red font-weight=bold}');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('Paragraph');
    expect((ast.children[0] as any).content).toContain('||Warning||{color=red font-weight=bold}');
  });

  test('should parse standalone inline comment', () => {
    const lexer = new Lexer('%% comment %%');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('CommentInline');
    expect((ast.children[0] as any).content).toBe('comment');
  });

  test('should parse triple colon block with children', () => {
    const lexer = new Lexer(':::columns\n# Heading\n:::');
    const parser = new Parser(lexer.tokenize());
    const ast = parser.parse();

    const columnBlock = ast.children[0] as any;
    expect(columnBlock.type).toBe('TripleColonBlock');
    expect(columnBlock.blockType).toBe('columns');
    expect(columnBlock.children.length).toBe(1);
    expect(columnBlock.children[0].type).toBe('Heading');
  });

  test('should parse definition list', () => {
    const lexer = new Lexer(': Term\n:   Definition');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('List');
    expect((ast.children[0] as any).kind).toBe('definition');
    expect((ast.children[0] as any).children[0].type).toBe('DefinitionTerm');
    expect((ast.children[0] as any).children[0].content).toBe('Term');
    expect((ast.children[0] as any).children[1].type).toBe('DefinitionDescription');
    expect((ast.children[0] as any).children[1].content).toBe('Definition');
  });
});
