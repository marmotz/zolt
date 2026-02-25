import { describe, expect, it } from 'bun:test';
import { Lexer } from '../lexer/lexer';
import { Parser } from './parser';
import { FootnoteDefinitionNode, FootnoteNode } from './types';

describe('Footnotes Parsing', () => {
  it('should parse footnote references', () => {
    const source = 'This is a note[^1].';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const doc = parser.parse();

    const paragraph = doc.children[0] as any;
    expect(paragraph.type).toBe('Paragraph');
    const footnote = paragraph.children[1] as FootnoteNode;
    expect(footnote.type).toBe('Footnote');
    expect(footnote.id).toBe('1');
  });

  it('should parse footnote definitions', () => {
    const source = '[^1]: This is the content.';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const doc = parser.parse();

    const definition = doc.children[0] as FootnoteDefinitionNode;
    expect(definition.type).toBe('FootnoteDefinition');
    expect(definition.id).toBe('1');
    expect(definition.children[0].type).toBe('Paragraph');
    const p = definition.children[0] as any;
    expect(p.children[0].content).toBe('This is the content.');
  });

  it('should parse multi-line footnote definitions with multiple paragraphs', () => {
    const source = `[^1]: First paragraph.

  Second paragraph.`;
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const doc = parser.parse();

    const definition = doc.children[0] as FootnoteDefinitionNode;
    expect(definition.type).toBe('FootnoteDefinition');
    expect(definition.children.length).toBe(2);
    expect(definition.children[0].type).toBe('Paragraph');
    expect(definition.children[1].type).toBe('Paragraph');
  });

  it('should parse list immediately following footnote def without indentation', () => {
    const source = '[^list-note]:\n- Item one\n- Item two';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const doc = parser.parse();

    expect(doc.children).toHaveLength(1);
    const def = doc.children[0] as any;
    expect(def.type).toBe('FootnoteDefinition');
    expect(def.children).toHaveLength(1);
    expect(def.children[0].type).toBe('List');
  });

  it('should parse blockquote immediately following footnote def without indentation', () => {
    const source = '[^quote-note]:\n> Quote content';
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const doc = parser.parse();

    expect(doc.children).toHaveLength(1);
    const def = doc.children[0] as any;
    expect(def.type).toBe('FootnoteDefinition');
    expect(def.children).toHaveLength(1);
    expect(def.children[0].type).toBe('Blockquote');
  });
});
