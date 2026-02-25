import { describe, expect, test } from 'bun:test';
import {
  AbbreviationNode,
  BlockquoteNode,
  CodeBlockNode,
  DocumentNode,
  FileNode,
  HeadingNode,
  HorizontalRuleNode,
  ImageNode,
  LinkNode,
  ListItemNode,
  ListNode,
  ParagraphNode,
} from '../../parser/types';
import { HTMLBuilder } from './builder';

describe('HTMLBuilder', () => {
  const builder = new HTMLBuilder();

  test('should build heading', () => {
    const node: HeadingNode = {
      type: 'Heading',
      level: 1,
      children: [{ type: 'Text', content: 'Hello World' }],
    };

    const html = builder.build(node);
    expect(html).toBe('<h1 id="hello-world">Hello World</h1>');
  });

  test('should build heading with level 6', () => {
    const node: HeadingNode = {
      type: 'Heading',
      level: 6,
      children: [{ type: 'Text', content: 'Test' }],
    };

    const html = builder.build(node);
    expect(html).toBe('<h6 id="test">Test</h6>');
  });

  test('should build paragraph', () => {
    const node: ParagraphNode = {
      type: 'Paragraph',
      children: [{ type: 'Text', content: 'This is a paragraph' }],
    };

    const html = builder.build(node);
    expect(html).toBe('<p>This is a paragraph</p>');
  });

  test('should build bullet list', () => {
    const node: ListNode = {
      type: 'List',
      kind: 'bullet',
      children: [
        { type: 'ListItem', children: [{ type: 'Text', content: 'Item 1' }] },
        { type: 'ListItem', children: [{ type: 'Text', content: 'Item 2' }] },
      ] as any[],
    };

    const html = builder.build(node);
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>');
  });

  test('should build numbered list', () => {
    const node: ListNode = {
      type: 'List',
      kind: 'numbered',
      children: [
        { type: 'ListItem', children: [{ type: 'Text', content: 'First' }] },
        { type: 'ListItem', children: [{ type: 'Text', content: 'Second' }] },
      ] as any[],
    };

    const html = builder.build(node);
    expect(html).toContain('<ol>');
  });

  test('should build task list with checkbox', () => {
    const node: ListNode = {
      type: 'List',
      kind: 'task',
      children: [
        { type: 'ListItem', checked: true, children: [{ type: 'Text', content: 'Done' }] },
        { type: 'ListItem', checked: false, children: [{ type: 'Text', content: 'Not done' }] },
      ] as any[],
    };

    const html = builder.build(node);
    expect(html).toContain('<input type="checkbox"');
    expect(html).toContain('checked');
    expect(html).toContain('onclick="return false;"');
  });

  test('should build blockquote', () => {
    const node: BlockquoteNode = {
      type: 'Blockquote',
      level: 1,
      children: [{ type: 'Paragraph', children: [{ type: 'Text', content: 'Quote text' }] } as any],
    };

    const html = builder.build(node);
    expect(html).toContain('<blockquote>');
    expect(html).toContain('Quote text');
  });

  test('should build horizontal rule', () => {
    const node: HorizontalRuleNode = {
      type: 'HorizontalRule',
      style: 'solid',
    };

    const html = builder.build(node);
    expect(html).toContain('<hr');
    expect(html).toContain('border-top-width: 2px');
    expect(html).toContain('border-top-style: solid');
  });

  test('should build thick horizontal rule', () => {
    const node: HorizontalRuleNode = {
      type: 'HorizontalRule',
      style: 'thick',
    };

    const html = builder.build(node);
    expect(html).toContain('<hr');
    expect(html).toContain('border-top-width: 4px');
  });

  test('should build thin horizontal rule', () => {
    const node: HorizontalRuleNode = {
      type: 'HorizontalRule',
      style: 'thin',
    };

    const html = builder.build(node);
    expect(html).toContain('<hr');
    expect(html).toContain('border-top-width: 1px');
  });

  test('should build horizontal rule with color attribute', () => {
    const node: HorizontalRuleNode = {
      type: 'HorizontalRule',
      style: 'solid',
      attributes: {
        color: 'red',
      },
    };

    const html = builder.build(node);
    expect(html).toContain('<hr');
    expect(html).toContain('border-top-color: red');
  });

  test('should build horizontal rule with dashed style', () => {
    const node: HorizontalRuleNode = {
      type: 'HorizontalRule',
      style: 'solid',
      attributes: {
        style: 'dashed',
      },
    };

    const html = builder.build(node);
    expect(html).toContain('<hr');
    expect(html).toContain('border-top-style: dashed');
  });

  test('should build horizontal rule with width', () => {
    const node: HorizontalRuleNode = {
      type: 'HorizontalRule',
      style: 'solid',
      attributes: {
        width: '50%',
      },
    };

    const html = builder.build(node);
    expect(html).toContain('<hr');
    expect(html).toContain('width: 50%');
  });

  test('should build horizontal rule with center alignment', () => {
    const node: HorizontalRuleNode = {
      type: 'HorizontalRule',
      style: 'solid',
      attributes: {
        align: 'center',
      },
    };

    const html = builder.build(node);
    expect(html).toContain('<hr');
    expect(html).toContain('margin-left: auto');
    expect(html).toContain('margin-right: auto');
  });

  test('should build horizontal rule with left alignment', () => {
    const node: HorizontalRuleNode = {
      type: 'HorizontalRule',
      style: 'solid',
      attributes: {
        align: 'left',
      },
    };

    const html = builder.build(node);
    expect(html).toContain('<hr');
    expect(html).toContain('margin-right: auto');
    expect(html).not.toContain('margin-left: auto');
  });

  test('should build horizontal rule with right alignment', () => {
    const node: HorizontalRuleNode = {
      type: 'HorizontalRule',
      style: 'solid',
      attributes: {
        align: 'right',
      },
    };

    const html = builder.build(node);
    expect(html).toContain('<hr');
    expect(html).toContain('margin-left: auto');
    expect(html).not.toContain('margin-right: auto');
  });

  test('should build horizontal rule with multiple attributes', () => {
    const node: HorizontalRuleNode = {
      type: 'HorizontalRule',
      style: 'thick',
      attributes: {
        color: 'blue',
        style: 'dashed',
        width: '80%',
        align: 'center',
      },
    };

    const html = builder.build(node);
    expect(html).toContain('<hr');
    expect(html).toContain('border-top-width: 4px');
    expect(html).toContain('border-top-style: dashed');
    expect(html).toContain('border-top-color: blue');
    expect(html).toContain('width: 80%');
    expect(html).toContain('margin-left: auto');
    expect(html).toContain('margin-right: auto');
  });

  test('should build code block', () => {
    const node: CodeBlockNode = {
      type: 'CodeBlock',
      language: 'javascript',
      content: 'const x = 1;',
    };

    const html = builder.build(node);
    expect(html).toContain('<pre>');
    expect(html).toContain('<code');
    expect(html).toContain('language-javascript');
  });

  test('should build document with wrapper', () => {
    const node: DocumentNode = {
      type: 'Document',
      children: [
        { type: 'Heading', level: 1, children: [{ type: 'Text', content: 'Title' }] } as any,
        { type: 'Paragraph', children: [{ type: 'Text', content: 'Content' }] } as any,
      ],
      sourceFile: 'test.zlt',
    };

    const html = builder.buildDocument(node);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<head>');
    expect(html).toContain('<body');
    expect(html).toContain('Title');
    expect(html).toContain('Content');
  });

  test('should handle bold inline', () => {
    const node = { type: 'Bold', children: [{ type: 'Text', content: 'bold text' }] };
    const html = builder.build(node as any);
    expect(html).toBe('<strong>bold text</strong>');
  });

  test('should handle italic inline', () => {
    const node = { type: 'Italic', children: [{ type: 'Text', content: 'italic text' }] };
    const html = builder.build(node as any);
    expect(html).toBe('<em>italic text</em>');
  });

  test('should build heading level 2', () => {
    const node: HeadingNode = {
      type: 'Heading',
      level: 2,
      children: [{ type: 'Text', content: 'Section' }],
    };

    const html = builder.build(node);
    expect(html).toBe('<h2 id="section">Section</h2>');
  });

  test('should build list item with content', () => {
    const node: ListItemNode = {
      type: 'ListItem',
      children: [{ type: 'Text', content: 'First item' }],
    };

    const html = builder.build(node);
    expect(html).toBe('<li>First item</li>');
  });

  test('should build link', () => {
    const node: LinkNode = {
      type: 'Link',
      href: 'file.zlt',
      children: [{ type: 'Text', content: 'file.zlt' }],
    } as any;

    const html = builder.build(node);
    expect(html).toBe('<a href="file.html">file.zlt</a>');
  });

  test('should transform .zlt link to .html', () => {
    const node: LinkNode = {
      type: 'Link',
      href: 'example.zlt',
      children: [{ type: 'Text', content: 'Example' }],
    } as any;

    const html = builder.build(node);
    expect(html).toContain('href="example.html"');
  });

  test('should not transform non-.zlt links', () => {
    const node: LinkNode = {
      type: 'Link',
      href: 'page.html',
      children: [{ type: 'Text', content: 'Page' }],
    } as any;

    const html = builder.build(node);
    expect(html).toBe('<a href="page.html">Page</a>');
  });

  test('should not transform external links', () => {
    const node: LinkNode = {
      type: 'Link',
      href: 'https://zolt.marmotz.dev',
      children: [{ type: 'Text', content: 'External' }],
    } as any;

    const html = builder.build(node);
    expect(html).toContain('href="https://zolt.marmotz.dev"');
  });

  test('should build image', () => {
    const node: ImageNode = {
      type: 'Image',
      src: 'img.jpg',
      alt: 'Alt',
    };

    const html = builder.build(node);
    expect(html).toBe('<img src="img.jpg" alt="Alt">');
  });

  test('should build image with attributes', () => {
    const node: ImageNode = {
      type: 'Image',
      src: 'img.jpg',
      alt: 'Alt',
      attributes: { width: '100px', class: 'img-fluid' },
    };

    const html = builder.build(node);
    expect(html).toContain('<img src="img.jpg" alt="Alt"');
    expect(html).toContain('style="width: 100px"');
    expect(html).toContain('class="img-fluid"');
  });

  test('should transform file node .zlt to .html', () => {
    const node: FileNode = {
      type: 'File',
      src: 'document.zlt',
      title: 'Document',
    };

    const html = builder.build(node);
    expect(html).toContain('href="document.html"');
    expect(html).toContain('>Document</a>');
  });

  test('should process inline link in paragraph', () => {
    const html = builder.processInline('[example.zlt](example.zlt)');
    expect(html).toBe('<a href="example.html">example.zlt</a>');
  });

  test('should process multiple inline elements', () => {
    const html = builder.processInline('This is **bold** and //italic//');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
  });

  test('should build list item with inline link', () => {
    const node: ListItemNode = {
      type: 'ListItem',
      children: [
        { type: 'Link', href: 'file.zlt', children: [{ type: 'Text', content: 'file.zlt' }] } as any,
        { type: 'Text', content: ' — description' },
      ],
    };

    const html = builder.build(node);
    expect(html).toContain('<a href="file.html">file.zlt</a>');
    expect(html).toContain('— description');
  });

  test('should build nested list', () => {
    const node: ListNode = {
      type: 'List',
      kind: 'bullet',
      children: [
        {
          type: 'ListItem',
          children: [
            { type: 'Text', content: 'Parent' },
            {
              type: 'List',
              kind: 'bullet',
              children: [{ type: 'ListItem', children: [{ type: 'Text', content: 'Child' }] }] as any[],
            },
          ],
        },
      ] as any[],
    };

    const html = builder.build(node);
    expect(html).toContain('<li>Parent');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>Child</li>');
  });

  test('should build abbreviation', () => {
    const node: AbbreviationNode = {
      type: 'Abbreviation',
      abbreviation: 'HTML',
      definition: 'HyperText Markup Language',
    };

    const html = builder.build(node);
    expect(html).toBe('<abbr title="HyperText Markup Language">HTML</abbr>');
  });

  test('should build abbreviation with Greek letter mu', () => {
    const node: AbbreviationNode = {
      type: 'Abbreviation',
      abbreviation: 'μs',
      definition: 'microsecond',
    };

    const html = builder.build(node);
    expect(html).toBe('<abbr title="microsecond">μs</abbr>');
  });

  test('should return empty string for CommentInline', () => {
    const node = { type: 'CommentInline', content: 'comment' };
    const html = builder.build(node as any);
    expect(html).toBe('');
  });

  test('should remove inline comment during inline processing', () => {
    const html = builder.processInline('Text %% comment %% more text');
    expect(html).toContain('Text');
    expect(html).toContain('more text');
    expect(html).not.toContain('comment');
  });

  test('should build triple colon columns', () => {
    const localBuilder = new HTMLBuilder();
    const node: any = {
      type: 'TripleColonBlock',
      blockType: 'columns',
      children: [
        {
          type: 'TripleColonBlock',
          blockType: 'column',
          attributes: { width: '50%' },
          children: [{ type: 'Text', content: 'Half' }],
        },
      ],
    };
    const html = localBuilder.build(node);
    expect(html).toContain('class="triple-colon-block columns"');
    expect(html).toContain('class="triple-colon-block column"');
    expect(html).toContain('style="width: calc(50% - (var(--zolt-column-gap, 1.5rem) * 0.500))"');
  });

  test('should build definition list', () => {
    const node: ListNode = {
      type: 'List',
      kind: 'definition',
      children: [
        { type: 'DefinitionTerm', children: [{ type: 'Text', content: 'Term' }] },
        { type: 'DefinitionDescription', children: [{ type: 'Text', content: 'Definition' }] },
      ] as any[],
    };

    const html = builder.build(node);
    expect(html).toContain('<dl>');
    expect(html).toContain('<dt>Term</dt>');
    expect(html).toContain('<dd>Definition</dd>');
    expect(html).toContain('</dl>');
  });

  test('should process italic with date format containing slashes', () => {
    const localBuilder = new HTMLBuilder();
    (localBuilder as any).evaluator.setVariable('modified', '2023-05-20');
    const html = localBuilder.processInline('//Date: {{ Date.format($modified, "DD/MM/YYYY") }}//');
    expect(html).toContain('<em>');
    expect(html).toContain('20/05/2023');
    expect(html).toContain('</em>');
  });

  describe('Universal Attributes Rendering', () => {
    test('should build paragraph with ID', () => {
      const node: ParagraphNode = {
        type: 'Paragraph',
        children: [{ type: 'Text', content: 'Text' }],
        attributes: { id: 'para-1' },
      };
      const html = builder.build(node);
      expect(html).toBe('<p id="para-1">Text</p>');
    });

    test('should build list with ID', () => {
      const node: ListNode = {
        type: 'List',
        kind: 'bullet',
        children: [{ type: 'ListItem', children: [{ type: 'Text', content: 'Item' }] }] as any[],
        attributes: { id: 'list-1' },
      };
      const html = builder.build(node);
      expect(html).toContain('<ul id="list-1">');
    });

    test('should build blockquote with ID', () => {
      const node: BlockquoteNode = {
        type: 'Blockquote',
        level: 1,
        children: [{ type: 'Paragraph', children: [{ type: 'Text', content: 'Quote' }] } as any],
        attributes: { id: 'quote-1' },
      };
      const html = builder.build(node);
      expect(html).toContain('<blockquote id="quote-1">');
    });

    test('should build bold with style attribute', () => {
      const node: any = {
        type: 'Bold',
        children: [{ type: 'Text', content: 'Bold' }],
        attributes: { color: 'red' },
      };
      const html = builder.build(node);
      expect(html).toBe('<strong style="color: red">Bold</strong>');
    });

    test('should build table with ID', () => {
      const node: any = {
        type: 'Table',
        rows: [],
        attributes: { id: 'table-1' },
      };
      const html = builder.build(node);
      expect(html).toContain('<table id="table-1">');
    });

    test('should handle internal links with @ prefix', () => {
      const node: LinkNode = {
        type: 'Link',
        href: '@target',
        children: [{ type: 'Text', content: 'Link' }],
      } as any;
      const html = builder.build(node);
      expect(html).toContain('href="#target"');
    });
  });

  test('should build line break (\\n)', () => {
    const html = builder.processInline('line 1\\nline 2');
    expect(html).toBe('line 1<br />line 2');
  });
});
