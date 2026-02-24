import { describe, expect, test } from 'bun:test';
import { Lexer } from '../lexer/lexer';
import { Parser } from './parser';

describe('Parser', () => {
  const getFlatContent = (node: any): string => {
    if (node.content !== undefined) {
      return node.content;
    }
    if (node.children) {
      return node.children
        .map((c: any) => {
          if (c.type === 'Text') {
            return c.content;
          }
          if (c.type === 'Expression') {
            return `{{ ${c.expression} }}`;
          }
          if (c.type === 'Variable') {
            return `{$${c.name}}`;
          }
          if (c.type === 'Bold') {
            return `**${getFlatContent(c)}**`;
          }
          if (c.type === 'Italic') {
            return `//${getFlatContent(c)}//`;
          }
          if (c.type === 'Underline') {
            return `__${getFlatContent(c)}__`;
          }
          if (c.type === 'Strikethrough') {
            return `~~${getFlatContent(c)}~~`;
          }
          if (c.type === 'Highlight') {
            return `==${getFlatContent(c)}==`;
          }
          if (c.type === 'InlineStyle') {
            const attrs = c.attributes
              ? `{${Object.entries(c.attributes)
                  .map(([k, v]) => `${k}=${v}`)
                  .join(' ')}}`
              : '';

            return `||${getFlatContent(c)}||${attrs}`;
          }

          return getFlatContent(c);
        })
        .join('');
    }

    return '';
  };

  test('should parse heading', () => {
    const lexer = new Lexer('# Hello World');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.type).toBe('Document');
    expect(ast.children[0].type).toBe('Heading');
    expect(getFlatContent(ast.children[0])).toBe('Hello World');
    expect((ast.children[0] as any).level).toBe(1);
  });

  test('should parse paragraph', () => {
    const lexer = new Lexer('This is a paragraph');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('Paragraph');
    expect(getFlatContent(ast.children[0])).toBe('This is a paragraph');
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

  test('should parse blockquote with multiple lines', () => {
    const lexer = new Lexer('> Line 1\n> Line 2');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('Blockquote');
    expect((ast.children[0] as any).level).toBe(1);
    expect((ast.children[0] as any).children.length).toBe(2);
  });

  test('should parse nested blockquote', () => {
    const lexer = new Lexer('> Level 1\n> > Level 2');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('Blockquote');
    expect((ast.children[0] as any).level).toBe(1);
    expect((ast.children[0] as any).children.length).toBe(2);
    expect((ast.children[0] as any).children[1].type).toBe('Blockquote');
    expect(((ast.children[0] as any).children[1] as any).level).toBe(2);
  });

  test('should parse three-level nested blockquote', () => {
    const lexer = new Lexer('> Level 1\n> > Level 2\n> > > Level 3');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    const level1 = ast.children[0] as any;
    expect(level1.type).toBe('Blockquote');
    expect(level1.level).toBe(1);

    const level2 = level1.children.find((c: any) => c.type === 'Blockquote') as any;
    expect(level2).toBeDefined();
    expect(level2.level).toBe(2);

    const level3 = level2.children.find((c: any) => c.type === 'Blockquote') as any;
    expect(level3).toBeDefined();
    expect(level3.level).toBe(3);
  });

  test('should parse horizontal rule', () => {
    const lexer = new Lexer('---');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('HorizontalRule');
  });

  test('should parse code block', () => {
    const lexer = new Lexer('```typescript\nconst x = 1;\n```');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('CodeBlock');
    expect((ast.children[0] as any).language).toBe('typescript');
    expect((ast.children[0] as any).content).toBe('const x = 1;');
  });

  test('should parse horizontal rule', () => {
    const lexer = new Lexer('---');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('HorizontalRule');
  });

  test('should parse thick horizontal rule', () => {
    const lexer = new Lexer('***');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('HorizontalRule');
    expect((ast.children[0] as any).style).toBe('thick');
  });

  test('should parse thin horizontal rule', () => {
    const lexer = new Lexer('___');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('HorizontalRule');
    expect((ast.children[0] as any).style).toBe('thin');
  });

  test('should parse horizontal rule with color attribute', () => {
    const lexer = new Lexer('\n---:{color=red}');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('HorizontalRule');
    expect((ast.children[0] as any).attributes.color).toBe('red');
  });

  test('should parse horizontal rule with multiple attributes', () => {
    const lexer = new Lexer('\n***:{color=blue width=50%}');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('HorizontalRule');
    expect((ast.children[0] as any).style).toBe('thick');
    expect((ast.children[0] as any).attributes.color).toBe('blue');
    expect((ast.children[0] as any).attributes.width).toBe('50%');
  });

  test('should parse multiple blocks', () => {
    const lexer = new Lexer('# Heading\n\nParagraph');
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
    expect(ast.children.length).toBe(0);
  });

  test('should set sourceFile', () => {
    const lexer = new Lexer('');
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
    expect(getFlatContent(ast.children[0])).toBe('Section Title');
  });

  test('should parse list with content', () => {
    const lexer = new Lexer('- item 1\n- item 2');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('List');
    expect((ast.children[0] as any).children.length).toBe(2);
    expect(getFlatContent((ast.children[0] as any).children[0])).toBe('item 1');
  });

  test('should parse numbered list with content', () => {
    const lexer = new Lexer('1. First\n2. Second');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('List');
    expect((ast.children[0] as any).kind).toBe('numbered');
    expect(getFlatContent((ast.children[0] as any).children[0])).toBe('First');
  });

  test('should parse inline style with single attribute', () => {
    const lexer = new Lexer('||important||{color=red}');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('Paragraph');
    expect(getFlatContent(ast.children[0])).toContain('||important||{color=red}');
  });

  test('should parse inline style with multiple attributes', () => {
    const lexer = new Lexer('||Warning||{color=red font-weight=bold}');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('Paragraph');
    expect(getFlatContent(ast.children[0])).toContain('||Warning||{color=red font-weight=bold}');
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
    const lexer = new Lexer('::: info\nSome content\n:::');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('TripleColonBlock');
    expect((ast.children[0] as any).blockType).toBe('info');
    expect((ast.children[0] as any).children.length).toBe(1);
    expect((ast.children[0] as any).children[0].type).toBe('Paragraph');
  });

  test('should not hang on unexpected TRIPLE_COLON_END', () => {
    const lexer = new Lexer(':::');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('Paragraph');
    expect(getFlatContent(ast.children[0])).toBe(':::');
  });

  test('should handle multiple unexpected TRIPLE_COLON_END tokens', () => {
    const lexer = new Lexer(':::\n:::');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children.length).toBe(2);
    expect(ast.children[0].type).toBe('Paragraph');
    expect(ast.children[1].type).toBe('Paragraph');
  });

  test('should parse definition list', () => {
    const lexer = new Lexer(': Term\n:   Definition');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('List');
    expect((ast.children[0] as any).kind).toBe('definition');
    expect((ast.children[0] as any).children[0].type).toBe('DefinitionTerm');
    expect(getFlatContent((ast.children[0] as any).children[0])).toBe('Term');
    expect((ast.children[0] as any).children[1].type).toBe('DefinitionDescription');
    expect(getFlatContent((ast.children[0] as any).children[1])).toBe('Definition');
  });

  test('should parse link reference definition', () => {
    const lexer = new Lexer('[zolt]: https://zolt.example.com');
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast.children[0].type).toBe('LinkReferenceDefinition');
    expect((ast.children[0] as any).ref).toBe('zolt');
    expect((ast.children[0] as any).url).toBe('https://zolt.example.com');
  });

  describe('Universal Attributes', () => {
    test('should parse paragraph with ID', () => {
      const lexer = new Lexer('Paragraph {#my-id}');
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();

      expect(ast.children[0].type).toBe('Paragraph');
      expect((ast.children[0] as any).attributes.id).toBe('my-id');
    });

    test('should parse list with ID on new line', () => {
      const lexer = new Lexer('- item\n{#list-id}');
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();

      expect(ast.children[0].type).toBe('List');
      expect((ast.children[0] as any).attributes.id).toBe('list-id');
    });

    test('should parse bold text with ID', () => {
      const lexer = new Lexer('**bold**{#bold-id}');
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();

      const para = ast.children[0] as any;
      const bold = para.children[0];
      expect(bold.type).toBe('Bold');
      expect(bold.attributes.id).toBe('bold-id');
    });

    test('should parse italic text with class', () => {
      const lexer = new Lexer('//italic//{.my-class}');
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();

      const para = ast.children[0] as any;
      const italic = para.children[0];
      expect(italic.type).toBe('Italic');
      expect(italic.attributes.class).toBe('my-class');
    });

    test('should apply ID to blockquote on next line', () => {
      const lexer = new Lexer('> Quote\n{#quote-id}');
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();

      expect(ast.children[0].type).toBe('Blockquote');
      expect((ast.children[0] as any).attributes.id).toBe('quote-id');
    });

    test('should parse heading with ID without space', () => {
      const lexer = new Lexer('## Heading{#head-id}');
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens);
      const ast = parser.parse();

      expect(ast.children[0].type).toBe('Heading');
      expect((ast.children[0] as any).attributes.id).toBe('head-id');
    });

    describe('Table Alignment', () => {
      test('should parse table with left alignment', () => {
        const lexer = new Lexer('| Left | Right |\n| :--- | --- |\n| A | B |');
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();

        expect(ast.children[0].type).toBe('Table');
        expect((ast.children[0] as any).header.cells[0].alignment).toBe('left');
        expect((ast.children[0] as any).header.cells[1].alignment).toBeUndefined();
      });

      test('should parse table with center alignment', () => {
        const lexer = new Lexer('| Center |\n| :---: |\n| A |');
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();

        expect(ast.children[0].type).toBe('Table');
        expect((ast.children[0] as any).header.cells[0].alignment).toBe('center');
      });

      test('should parse table with right alignment', () => {
        const lexer = new Lexer('| Right |\n| ---: |\n| A |');
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();

        expect(ast.children[0].type).toBe('Table');
        expect((ast.children[0] as any).header.cells[0].alignment).toBe('right');
      });

      test('should apply alignment to all rows', () => {
        const lexer = new Lexer('| Col |\n| :---: |\n| A |\n| B |');
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();

        const table = ast.children[0] as any;
        expect(table.header.cells[0].alignment).toBe('center');
        expect(table.rows[0].cells[0].alignment).toBe('center');
        expect(table.rows[1].cells[0].alignment).toBe('center');
      });
    });

    describe('Double Bracket Block', () => {
      test('should parse double bracket block with type', () => {
        const lexer = new Lexer('[[toc]]');
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();

        expect(ast.children[0].type).toBe('DoubleBracketBlock');
        expect((ast.children[0] as any).blockType).toBe('toc');
      });

      test('should parse double bracket block with attributes', () => {
        const lexer = new Lexer('[[toc {id=toc-root class=nav}]]');
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();

        expect(ast.children[0].type).toBe('DoubleBracketBlock');
        expect((ast.children[0] as any).blockType).toBe('toc');
        expect((ast.children[0] as any).attributes.id).toBe('toc-root');
        expect((ast.children[0] as any).attributes.class).toBe('nav');
      });
    });

    describe('Link Reference in content', () => {
      test('should use link reference in link', () => {
        const lexer = new Lexer('[zolt]: https://zolt.example.com\n\n[Zolt][zolt]');
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();

        expect(ast.children[0].type).toBe('LinkReferenceDefinition');
        expect(ast.children[1].type).toBe('Paragraph');
      });
    });
  });
});
