import { describe, expect, test } from 'bun:test';
import { Lexer } from '../../lexer/lexer';
import { Parser } from '../parser';

describe('TripleColonParser', () => {
  test('should parse info block', () => {
    const input = `::: info
Content
:::`;
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('TripleColonBlock');
    expect((ast.children[0] as any).blockType).toBe('info');
  });

  test('should parse mermaid block', () => {
    const input = `::: mermaid
graph TD;
A-->B;
:::`;
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('Mermaid');
    expect((ast.children[0] as any).content).toBe(`graph TD;
A-->B;`);
  });

  test('should parse chart block', () => {
    const input = `::: chart [My Chart]
::: chart-line [Series 1]
A: 10
B: 20
:::
:::`;
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('Chart');
  });
});
