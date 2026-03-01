import { beforeEach, describe, expect, test } from 'bun:test';
import type {
  BlockquoteNode,
  CodeBlockNode,
  DocumentNode,
  HeadingNode,
  HorizontalRuleNode,
  ListItemNode,
  ListNode,
  ParagraphNode,
} from '../../parser/types';
import { HTMLBuilder } from './builder';

describe('HTMLBuilder', () => {
  let builder: HTMLBuilder;

  beforeEach(() => {
    builder = new HTMLBuilder();
  });

  test('should build heading', async () => {
    const node: HeadingNode = {
      type: 'Heading',
      level: 1,
      children: [{ type: 'Text', content: 'Hello World' }],
    };

    const html = await builder.build(node);
    expect(html).toContain(
      '<h1 id="hello-world"><a href="#hello-world" class="zolt-anchor" aria-hidden="true">#</a>Hello World</h1>'
    );
  });

  test('should build heading with level 6', async () => {
    const node: HeadingNode = {
      type: 'Heading',
      level: 6,
      children: [{ type: 'Text', content: 'Smallest Heading' }],
    };

    const html = await builder.build(node);
    expect(html).toContain(
      '<h6 id="smallest-heading"><a href="#smallest-heading" class="zolt-anchor" aria-hidden="true">#</a>Smallest Heading</h6>'
    );
  });

  test('should build paragraph', async () => {
    const node: ParagraphNode = {
      type: 'Paragraph',
      children: [{ type: 'Text', content: 'This is a paragraph.' }],
    };

    const html = await builder.build(node);
    expect(html).toContain('<p>This is a paragraph.</p>');
  });

  test('should build bullet list', async () => {
    const node: ListNode = {
      type: 'List',
      kind: 'bullet',
      children: [
        { type: 'ListItem', children: [{ type: 'Text', content: 'Item 1' }] },
        { type: 'ListItem', children: [{ type: 'Text', content: 'Item 2' }] },
      ] as any[],
    };

    const html = await builder.build(node);
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>Item 1</li>');
    expect(html).toContain('<li>Item 2</li>');
  });

  test('should build numbered list', async () => {
    const node: ListNode = {
      type: 'List',
      kind: 'numbered',
      children: [
        { type: 'ListItem', children: [{ type: 'Text', content: 'First' }] },
        { type: 'ListItem', children: [{ type: 'Text', content: 'Second' }] },
      ] as any[],
    };

    const html = await builder.build(node);
    expect(html).toContain('<ol>');
    expect(html).toContain('<li>First</li>');
    expect(html).toContain('<li>Second</li>');
  });

  test('should build task list with checkbox', async () => {
    const node: ListNode = {
      type: 'List',
      kind: 'task',
      children: [
        { type: 'ListItem', checked: true, children: [{ type: 'Text', content: 'Done' }] },
        { type: 'ListItem', checked: false, children: [{ type: 'Text', content: 'Not done' }] },
      ] as any[],
    };

    const html = await builder.build(node);
    expect(html).toContain('class="zolt-list-task"');
    expect(html).toContain('<input type="checkbox" checked');
    expect(html).toContain('Done');
    expect(html).toContain('Not done');
  });

  test('should build nested task lists', async () => {
    const node: ListNode = {
      type: 'List',
      kind: 'task',
      children: [
        {
          type: 'ListItem',
          checked: false,
          children: [
            { type: 'Text', content: 'Parent task' },
            {
              type: 'List',
              kind: 'task',
              children: [{ type: 'ListItem', checked: true, children: [{ type: 'Text', content: 'Subtask' }] }],
            },
          ],
        },
      ] as any[],
    };

    const html = await builder.build(node);
    const taskLists = html.match(/class="zolt-list-task"/g);
    expect(taskLists).toHaveLength(2);
    expect(html).toContain('Parent task');
    expect(html).toContain('Subtask');
  });

  test('should build blockquote', async () => {
    const node: BlockquoteNode = {
      type: 'Blockquote',
      level: 1,
      children: [{ type: 'Paragraph', children: [{ type: 'Text', content: 'Quote text' }] } as any],
    };

    const html = await builder.build(node);
    expect(html).toContain('<blockquote>');
    expect(html).toContain('<p>Quote text</p>');
  });

  test('should build horizontal rule', async () => {
    const node: HorizontalRuleNode = {
      type: 'HorizontalRule',
      style: 'solid',
    };

    const html = await builder.build(node);
    expect(html).toContain('<hr');
    expect(html).toContain('border-top-style: solid');
  });

  test('should build thick horizontal rule', async () => {
    const node: HorizontalRuleNode = {
      type: 'HorizontalRule',
      style: 'thick',
    };

    const html = await builder.build(node);
    expect(html).toContain('border-top-width: 4px');
  });

  test('should build thin horizontal rule', async () => {
    const node: HorizontalRuleNode = {
      type: 'HorizontalRule',
      style: 'thin',
    };

    const html = await builder.build(node);
    expect(html).toContain('border-top-width: 1px');
  });

  test('should build horizontal rule with color attribute', async () => {
    const node: HorizontalRuleNode = {
      type: 'HorizontalRule',
      style: 'solid',
      attributes: {
        color: 'red',
      },
    };

    const html = await builder.build(node);
    expect(html).toContain('border-top-color: red');
  });

  test('should build horizontal rule with dashed style', async () => {
    const node: HorizontalRuleNode = {
      type: 'HorizontalRule',
      style: 'solid',
      attributes: {
        style: 'dashed',
      },
    };

    const html = await builder.build(node);
    expect(html).toContain('border-top-style: dashed');
  });

  test('should build horizontal rule with width', async () => {
    const node: HorizontalRuleNode = {
      type: 'HorizontalRule',
      style: 'solid',
      attributes: {
        width: '50%',
      },
    };

    const html = await builder.build(node);
    expect(html).toContain('width: 50%');
  });

  test('should build horizontal rule with center alignment', async () => {
    const node: HorizontalRuleNode = {
      type: 'HorizontalRule',
      style: 'solid',
      attributes: {
        align: 'center',
      },
    };

    const html = await builder.build(node);
    expect(html).toContain('margin-left: auto');
    expect(html).toContain('margin-right: auto');
  });

  test('should build horizontal rule with left alignment', async () => {
    const node: HorizontalRuleNode = {
      type: 'HorizontalRule',
      style: 'solid',
      attributes: {
        align: 'left',
      },
    };

    const html = await builder.build(node);
    expect(html).toContain('margin-right: auto');
  });

  test('should build horizontal rule with right alignment', async () => {
    const node: HorizontalRuleNode = {
      type: 'HorizontalRule',
      style: 'solid',
      attributes: {
        align: 'right',
      },
    };

    const html = await builder.build(node);
    expect(html).toContain('margin-left: auto');
  });

  test('should build horizontal rule with multiple attributes', async () => {
    const node: HorizontalRuleNode = {
      type: 'HorizontalRule',
      style: 'thick',
      attributes: {
        style: 'dashed',
        color: 'blue',
        width: '80%',
        align: 'center',
      },
    };

    const html = await builder.build(node);
    expect(html).toContain('border-top-width: 4px');
    expect(html).toContain('border-top-style: dashed');
    expect(html).toContain('border-top-color: blue');
    expect(html).toContain('width: 80%');
    expect(html).toContain('margin-left: auto');
    expect(html).toContain('margin-right: auto');
  });

  test('should build code block', async () => {
    const node: CodeBlockNode = {
      type: 'CodeBlock',
      language: 'javascript',
      content: 'const x = 1;',
    };

    const html = await builder.build(node);
    expect(html).toContain('zolt-code-block');
    expect(html).toContain('zolt-code-lang');
    expect(html).toContain('javascript');
    expect(html).toContain('shiki');
    expect(html).toContain('const');
  });

  test('should build code block with zolt language', async () => {
    const node: CodeBlockNode = {
      type: 'CodeBlock',
      language: 'zolt',
      content: '# Heading\n**bold** text',
    };

    const html = await builder.build(node);
    expect(html).toContain('zolt-code-block');
    expect(html).toContain('shiki');
  });

  test('should build document with wrapper', async () => {
    const node: DocumentNode = {
      type: 'Document',
      children: [
        { type: 'Heading', level: 1, children: [{ type: 'Text', content: 'Title' }] } as any,
        { type: 'Paragraph', children: [{ type: 'Text', content: 'Content' }] } as any,
      ],
      sourceFile: 'test.zlt',
    };

    const html = await builder.buildDocument(node);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<h1 id="title"><a href="#title" class="zolt-anchor" aria-hidden="true">#</a>Title</h1>');
    expect(html).toContain('<p>Content</p>');
  });

  test('should handle bold inline', async () => {
    const node = { type: 'Bold', children: [{ type: 'Text', content: 'bold text' }] };
    const html = await builder.build(node as any);
    expect(html).toContain('<strong>bold text</strong>');
  });

  test('should handle italic inline', async () => {
    const node = { type: 'Italic', children: [{ type: 'Text', content: 'italic text' }] };
    const html = await builder.build(node as any);
    expect(html).toContain('<em>italic text</em>');
  });

  test('should build heading level 2', async () => {
    const node: HeadingNode = {
      type: 'Heading',
      level: 2,
      children: [{ type: 'Text', content: 'Heading 2' }],
    };

    const html = await builder.build(node);
    expect(html).toContain(
      '<h2 id="heading-2"><a href="#heading-2" class="zolt-anchor" aria-hidden="true">#</a>Heading 2</h2>'
    );
  });

  test('should build list item with content', async () => {
    const node: ListItemNode = {
      type: 'ListItem',
      children: [{ type: 'Text', content: 'Item content' }],
    };

    const html = await builder.build(node);
    expect(html).toContain('<li>Item content</li>');
  });

  test('should build link', async () => {
    const node = {
      type: 'Link',
      href: 'file.zlt',
      children: [{ type: 'Text', content: 'file.zlt' }],
    } as any;

    const html = await builder.build(node);
    expect(html).toContain('<a href="file.html">file.zlt</a>');
  });

  test('should transform .zlt link to .html', async () => {
    const node = {
      type: 'Link',
      href: 'example.zlt',
      children: [{ type: 'Text', content: 'Example' }],
    } as any;

    const html = await builder.build(node);
    expect(html).toContain('href="example.html"');
  });

  test('should not transform non-.zlt links', async () => {
    const node = {
      type: 'Link',
      href: 'page.html',
      children: [{ type: 'Text', content: 'Page' }],
    } as any;

    const html = await builder.build(node);
    expect(html).toContain('<a href="page.html">Page</a>');
  });

  test('should not transform external links', async () => {
    const node = {
      type: 'Link',
      href: 'https://zolt.marmotz.dev',
      children: [{ type: 'Text', content: 'External' }],
    } as any;

    const html = await builder.build(node);
    expect(html).toContain('href="https://zolt.marmotz.dev"');
  });

  test('should build image', async () => {
    const node = {
      type: 'Image',
      src: 'img.jpg',
      alt: 'Alt',
    } as any;

    const html = await builder.build(node);
    expect(html).toContain('<img src="img.jpg" alt="Alt">');
  });

  test('should build image with attributes', async () => {
    const node = {
      type: 'Image',
      src: 'img.jpg',
      alt: 'Alt',
      attributes: { width: '100px', class: 'img-fluid' },
    };

    const html = await builder.build(node as any);
    expect(html).toContain('<img src="img.jpg" alt="Alt"');
    expect(html).toContain('style="width: 100px"');
    expect(html).toContain('class="img-fluid"');
  });

  test('should transform file node .zlt to .html', async () => {
    const node = {
      type: 'File',
      src: 'document.zlt',
      title: 'Document',
    };

    const html = await builder.build(node as any);
    expect(html).toContain('href="document.html"');
  });

  test('should process inline link in paragraph', async () => {
    const html = await builder.processInline('[example.zlt](example.zlt)');
    expect(html).toContain('<a href="example.html">example.zlt</a>');
  });

  test('should process multiple inline elements', async () => {
    const html = await builder.processInline('This is **bold** and //italic//');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
  });

  test('should build list item with inline link', async () => {
    const node: ListItemNode = {
      type: 'ListItem',
      children: [
        { type: 'Link', href: 'file.zlt', children: [{ type: 'Text', content: 'file.zlt' }] } as any,
        { type: 'Text', content: ' — description' },
      ],
    };

    const html = await builder.build(node);
    expect(html).toContain('<a href="file.html">file.zlt</a>');
  });

  test('should build nested list', async () => {
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
              children: [{ type: 'ListItem', children: [{ type: 'Text', content: 'Child' }] } as any],
            } as any,
          ],
        },
      ] as any[],
    };

    const html = await builder.build(node);
    expect(html).toContain('<li>Parent');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>Child</li>');
  });

  test('should build abbreviation', async () => {
    const node = {
      type: 'Abbreviation',
      abbreviation: 'API',
      definition: 'Application Programming Interface',
    };

    const html = await builder.build(node as any);
    expect(html).toContain('<abbr title="Application Programming Interface">API</abbr>');
  });

  test('should build abbreviation with Greek letter mu', async () => {
    const node = {
      type: 'Abbreviation',
      abbreviation: 'µs',
      definition: 'microsecond',
    };

    const html = await builder.build(node as any);
    expect(html).toContain('<abbr title="microsecond">µs</abbr>');
  });

  test('should return empty string for CommentInline', async () => {
    const node = { type: 'CommentInline', content: 'comment' };
    const html = await builder.build(node as any);
    expect(html).toBe('');
  });

  test('should remove inline comment during inline processing', async () => {
    const html = await builder.processInline('Text %% comment %% more text');
    expect(html).toContain('Text');
    expect(html).toContain('more text');
    expect(html).not.toContain('comment');
  });

  test('should build triple colon columns', async () => {
    const localBuilder = new HTMLBuilder();
    const node = {
      type: 'TripleColonBlock',
      blockType: 'columns',
      attributes: { cols: '2' },
      children: [
        {
          type: 'TripleColonBlock',
          blockType: 'column',
          attributes: { width: '50%' },
          children: [{ type: 'Text', content: 'Half' }],
        },
      ],
    };
    const html = await localBuilder.build(node as any);
    expect(html).toContain('class="triple-colon-block columns"');
    expect(html).toContain('data-type="columns"');
    expect(html).toContain('class="triple-colon-block column"');
  });

  test('should build definition list', async () => {
    const node: ListNode = {
      type: 'List',
      kind: 'definition',
      children: [
        { type: 'DefinitionTerm', children: [{ type: 'Text', content: 'Term' }] },
        { type: 'DefinitionDescription', children: [{ type: 'Text', content: 'Definition' }] },
      ] as any[],
    };

    const html = await builder.build(node);
    expect(html).toContain('<dl>');
    expect(html).toContain('<dt>Term</dt>');
    expect(html).toContain('<dd>Definition</dd>');
  });

  test('should process italic with date format containing slashes', async () => {
    const localBuilder = new HTMLBuilder();
    (localBuilder as any).evaluator.setVariable('modified', '2023-05-20');
    const html = await localBuilder.processInline('//Date: {{ Date.format($modified, "DD/MM/YYYY") }}//');
    expect(html).toContain('<em>Date: 20/05/2023</em>');
  });

  describe('Universal Attributes Rendering', () => {
    test('should build paragraph with ID', async () => {
      const node: ParagraphNode = {
        type: 'Paragraph',
        children: [{ type: 'Text', content: 'Text' }],
        attributes: { id: 'para-1' },
      };
      const html = await builder.build(node);
      expect(html).toContain('<p id="para-1">Text</p>');
    });

    test('should build list with ID', async () => {
      const node: ListNode = {
        type: 'List',
        kind: 'bullet',
        children: [{ type: 'ListItem', children: [{ type: 'Text', content: 'Item' }] }] as any[],
        attributes: { id: 'list-1' },
      };
      const html = await builder.build(node);
      expect(html).toContain('<ul id="list-1">');
    });

    test('should build blockquote with ID', async () => {
      const node: BlockquoteNode = {
        type: 'Blockquote',
        level: 1,
        children: [{ type: 'Paragraph', children: [{ type: 'Text', content: 'Quote' }] } as any],
        attributes: { id: 'quote-1' },
      };
      const html = await builder.build(node);
      expect(html).toContain('<blockquote id="quote-1">');
    });

    test('should build bold with style attribute', async () => {
      const node = {
        type: 'Bold',
        children: [{ type: 'Text', content: 'Bold' }],
        attributes: { color: 'red' },
      };
      const html = await builder.build(node as any);
      expect(html).toContain('<strong style="color: red">Bold</strong>');
    });

    test('should build table with ID', async () => {
      const node: any = {
        type: 'Table',
        rows: [],
        attributes: { id: 'table-1' },
      };
      const html = await builder.build(node);
      expect(html).toContain('<table id="table-1">');
    });
  });

  test('should build line break (\\n)', async () => {
    const node = { type: 'LineBreak' };
    const html = await builder.build(node as any);
    expect(html).toContain('<br />');
  });

  describe('Heading Numbering', () => {
    test('should number heading with {numbering} attribute (empty string)', async () => {
      const node: HeadingNode = {
        type: 'Heading',
        level: 1,
        children: [{ type: 'Text', content: 'Chapter 1' }],
        attributes: { numbering: '' },
      };

      const html = await builder.build(node);
      expect(html).toContain('<span class="zolt-heading-number">1 </span>Chapter 1');
      expect(html).not.toContain('numbering=""');
    });

    test('should number heading with {numbering="true"} attribute', async () => {
      const node: HeadingNode = {
        type: 'Heading',
        level: 1,
        children: [{ type: 'Text', content: 'Chapter 1' }],
        attributes: { numbering: 'true' },
      };

      const html = await builder.build(node);
      expect(html).toContain('<span class="zolt-heading-number">1 </span>Chapter 1');
      expect(html).not.toContain('numbering="true"');
    });

    test('should not number heading with {numbering="false"} attribute', async () => {
      const node: HeadingNode = {
        type: 'Heading',
        level: 1,
        children: [{ type: 'Text', content: 'Chapter 1' }],
        attributes: { numbering: 'false' },
      };

      const html = await builder.build(node);
      expect(html).not.toContain('zolt-heading-number');
      expect(html).not.toContain('numbering="false"');
    });

    test('should number nested headings with {numbering}', async () => {
      const h1: HeadingNode = {
        type: 'Heading',
        level: 1,
        children: [{ type: 'Text', content: 'One' }],
        attributes: { numbering: '' },
      };
      const h2: HeadingNode = {
        type: 'Heading',
        level: 2,
        children: [{ type: 'Text', content: 'Two' }],
        attributes: { numbering: '' },
      };

      const html1 = await builder.build(h1);
      const html2 = await builder.build(h2);

      expect(html1).toContain('<span class="zolt-heading-number">1 </span>One');
      expect(html2).toContain('<span class="zolt-heading-number">1.1 </span>Two');
    });

    test('should number headings globally when $numbering is true', async () => {
      (builder as any).evaluator.setVariable('numbering', true);

      const h1: HeadingNode = {
        type: 'Heading',
        level: 1,
        children: [{ type: 'Text', content: 'One' }],
        attributes: {},
      };
      const h2: HeadingNode = {
        type: 'Heading',
        level: 2,
        children: [{ type: 'Text', content: 'Two' }],
        attributes: {},
      };

      const html1 = await builder.build(h1);
      const html2 = await builder.build(h2);

      expect(html1).toContain('<span class="zolt-heading-number">1 </span>One');
      expect(html2).toContain('<span class="zolt-heading-number">1.1 </span>Two');
    });

    test('should respect style when $numbering is a style string', async () => {
      (builder as any).evaluator.setVariable('numbering', 'roman-upper');

      const h1: HeadingNode = {
        type: 'Heading',
        level: 1,
        children: [{ type: 'Text', content: 'One' }],
        attributes: {},
      };

      const html = await builder.build(h1);
      expect(html).toContain('<span class="zolt-heading-number">I </span>One');
    });

    test('should support mixed numbering styles via comma-separated list', async () => {
      (builder as any).evaluator.setVariable('numbering', 'decimal, alpha-lower, roman-upper');

      const h1: HeadingNode = {
        type: 'Heading',
        level: 1,
        children: [{ type: 'Text', content: 'Part' }],
        attributes: {},
      };
      const h2: HeadingNode = {
        type: 'Heading',
        level: 2,
        children: [{ type: 'Text', content: 'Chapter' }],
        attributes: {},
      };
      const h3: HeadingNode = {
        type: 'Heading',
        level: 3,
        children: [{ type: 'Text', content: 'Section' }],
        attributes: {},
      };

      const html1 = await builder.build(h1);
      const html2 = await builder.build(h2);
      const html3 = await builder.build(h3);

      expect(html1).toContain('<span class="zolt-heading-number">1 </span>Part');
      expect(html2).toContain('<span class="zolt-heading-number">1.a </span>Chapter');
      expect(html3).toContain('<span class="zolt-heading-number">1.a.I </span>Section');
    });

    test('should skip numbering for headings with {numbering=false} even if global numbering is on', async () => {
      (builder as any).evaluator.setVariable('numbering', true);

      const h1: HeadingNode = {
        type: 'Heading',
        level: 1,
        children: [{ type: 'Text', content: 'One' }],
        attributes: {},
      };
      const h2: HeadingNode = {
        type: 'Heading',
        level: 1,
        children: [{ type: 'Text', content: 'Two' }],
        attributes: { numbering: 'false' },
      };
      const h3: HeadingNode = {
        type: 'Heading',
        level: 1,
        children: [{ type: 'Text', content: 'Three' }],
        attributes: {},
      };

      const html1 = await builder.build(h1);
      const html2 = await builder.build(h2);
      const html3 = await builder.build(h3);

      expect(html1).toContain('<span class="zolt-heading-number">1 </span>One');
      expect(html2).not.toContain('zolt-heading-number');
      expect(html3).toContain('<span class="zolt-heading-number">3 </span>Three');
    });

    test('should show correct number even if preceding headings are not numbered', async () => {
      // 7 headings level 1 (not numbered)
      for (let i = 0; i < 7; i++) {
        await builder.build({
          type: 'Heading',
          level: 1,
          children: [{ type: 'Text', content: `H${i}` }],
          attributes: {},
        } as any);
      }

      // The 8th heading (numbered)
      const h8: HeadingNode = {
        type: 'Heading',
        level: 1,
        children: [{ type: 'Text', content: 'The Eighth' }],
        attributes: { numbering: '' },
      };

      const html = await builder.build(h8);
      expect(html).toContain('<span class="zolt-heading-number">8 </span>The Eighth');
    });

    test('should reset counters between buildDocument calls', async () => {
      const doc = {
        type: 'Document',
        children: [
          {
            type: 'Heading',
            level: 1,
            children: [{ type: 'Text', content: 'Chapter 1' }],
            attributes: { numbering: '' },
          } as any,
          {
            type: 'Heading',
            level: 1,
            children: [{ type: 'Text', content: 'Chapter 2' }],
            attributes: { numbering: '' },
          } as any,
        ],
      } as DocumentNode;

      const html1 = await builder.buildDocument(doc);
      expect(html1).toContain(
        '<h1 id="chapter-1"><a href="#chapter-1" class="zolt-anchor" aria-hidden="true">#</a><span class="zolt-heading-number">1 </span>Chapter 1</h1>'
      );
      expect(html1).toContain(
        '<h1 id="chapter-2"><a href="#chapter-2" class="zolt-anchor" aria-hidden="true">#</a><span class="zolt-heading-number">2 </span>Chapter 2</h1>'
      );

      const html2 = await builder.buildDocument(doc);
      expect(html2).toContain(
        '<h1 id="chapter-1"><a href="#chapter-1" class="zolt-anchor" aria-hidden="true">#</a><span class="zolt-heading-number">1 </span>Chapter 1</h1>'
      );
      expect(html2).toContain(
        '<h1 id="chapter-2"><a href="#chapter-2" class="zolt-anchor" aria-hidden="true">#</a><span class="zolt-heading-number">2 </span>Chapter 2</h1>'
      );
    });

    test('should NOT number single H1 and start numbering from H2', async () => {
      const doc = {
        type: 'Document',
        children: [
          { type: 'Heading', level: 1, children: [{ type: 'Text', content: 'Title' }], attributes: {} } as any,
          {
            type: 'Heading',
            level: 2,
            children: [{ type: 'Text', content: 'Section 1' }],
            attributes: { numbering: '' },
          } as any,
          {
            type: 'Heading',
            level: 2,
            children: [{ type: 'Text', content: 'Section 2' }],
            attributes: { numbering: '' },
          } as any,
        ],
      } as DocumentNode;

      const html = await builder.buildDocument(doc);
      expect(html).not.toContain('zolt-heading-number">1 </span>Title');
      expect(html).toContain('<span class="zolt-heading-number">1 </span>Section 1');
      expect(html).toContain('<span class="zolt-heading-number">2 </span>Section 2');
    });

    test('should number H1 if there are multiple H1s', async () => {
      const doc = {
        type: 'Document',
        children: [
          {
            type: 'Heading',
            level: 1,
            children: [{ type: 'Text', content: 'Part 1' }],
            attributes: { numbering: '' },
          } as any,
          {
            type: 'Heading',
            level: 1,
            children: [{ type: 'Text', content: 'Part 2' }],
            attributes: { numbering: '' },
          } as any,
        ],
      } as DocumentNode;

      const html = await builder.buildDocument(doc);
      expect(html).toContain('<span class="zolt-heading-number">1 </span>Part 1');
      expect(html).toContain('<span class="zolt-heading-number">2 </span>Part 2');
    });
  });
});
