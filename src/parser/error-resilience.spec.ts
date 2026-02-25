import { describe, expect, it } from 'bun:test';
import { Lexer } from '../lexer/lexer';
import { Parser } from './parser';

describe('Parser Error Resilience & Validation', () => {
  it('should continue parsing after a syntax error in a block', () => {
    const input = `
# Heading 1

[[invalid block syntax]]

# Heading 2 after error
`;
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    // Should have both headings
    const headings = ast.children.filter((n) => n.type === 'Heading');
    expect(headings.length).toBe(2);
    expect((headings[0] as any).children[0].content).toBe('Heading 1');
    expect((headings[1] as any).children[0].content).toBe('Heading 2 after error');
  });

  it('should validate attribute syntax and emit warnings', () => {
    const input = `
# Heading {.valid #id invalid@@@syntax}
`;
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    const heading = ast.children.find((n) => n.type === 'Heading') as any;
    expect(heading).toBeDefined();
    expect(heading.attributes).toBeDefined();
    expect(heading.attributes.class).toBe('valid');
    expect(heading.attributes.id).toBe('id');

    // Should have warnings for 'invalid@@@syntax'
    const attrWarnings = parser.warnings.filter((w) => w.code === 'INVALID_ATTRIBUTE_SYNTAX');
    expect(attrWarnings.length).toBeGreaterThan(0);
  });

  it('should handle invalid block attributes and continue', () => {
    const input = `
{invalid@@@syntax}
# Heading after invalid attributes
`;
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    const heading = ast.children.find((n) => n.type === 'Heading') as any;
    expect(heading).toBeDefined();
    expect(heading.children[0].content).toBe('Heading after invalid attributes');

    expect(parser.warnings.some((w) => w.code === 'INVALID_ATTRIBUTE_SYNTAX')).toBe(true);
  });
});
