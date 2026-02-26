import { describe, expect, test } from 'bun:test';
import { Lexer } from '../../lexer/lexer';
import { Parser } from '../parser';

describe('TableParser', () => {
  test('should parse simple table', () => {
    const input = `| Col 1 | Col 2 |
| --- | --- |
| A | B |`;
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('Table');
    const table = ast.children[0] as any;
    expect(table.header.cells.length).toBe(2);
    expect(table.rows.length).toBe(1);
  });

  test('should parse table with alignments', () => {
    const input = `| Left | Center | Right |
| :--- | :---: | ---: |
| A | B | C |`;
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    const table = ast.children[0] as any;
    expect(table.header.cells[0].alignment).toBe('left');
    expect(table.header.cells[1].alignment).toBe('center');
    expect(table.header.cells[2].alignment).toBe('right');
  });

  test('should parse [h] marker in cells', () => {
    const input = `| [h] Col 1 | [h] Col 2 |
| A | B |`;
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    const table = ast.children[0] as any;
    expect(table.rows[0].cells[0].isHeader).toBe(true);
    expect(table.rows[0].cells[1].isHeader).toBe(true);
    expect(table.rows[1].cells[0].isHeader).toBeUndefined();
  });

  test('should parse colspan and rowspan', () => {
    const input = `| [colspan=2] Wide |
| [rowspan=2] Tall | Cell |
| | Cell |`;
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    const table = ast.children[0] as any;
    expect(table.rows[0].cells[0].colspan).toBe(2);
    expect(table.rows[1].cells[0].rowspan).toBe(2);
  });

  test('should handle [[table]] wrapper', () => {
    const input = `[[table id=my-table]]
| [h] A | [h] B |
| 1 | 2 |
[[/table]]`;
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children.length).toBe(1);
    expect(ast.children[0].type).toBe('Table');
    const table = ast.children[0] as any;
    expect(table.attributes?.id).toBe('my-table');
  });

  test('should ignore pipes inside backticks', () => {
    const input = '| Syntax | Result |\n| --- | --- |\n| `||` | pipe |';
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('Table');
    const table = ast.children[0] as any;
    expect(table.rows[0].cells.length).toBe(2);
  });

  test('should ignore escaped pipes', () => {
    const input = '| Syntax | Result |\n| --- | --- |\n| \\| | literal pipe |';
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('Table');
    const table = ast.children[0] as any;
    expect(table.rows[0].cells.length).toBe(2);
  });
});
