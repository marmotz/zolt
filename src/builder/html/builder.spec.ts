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
      content: 'Hello World',
    };

    const html = builder.visitHeading(node);
    expect(html).toBe('<h1>Hello World</h1>');
  });

  test('should build heading with level 6', () => {
    const node: HeadingNode = {
      type: 'Heading',
      level: 6,
      content: 'Test',
    };

    const html = builder.visitHeading(node);
    expect(html).toBe('<h6>Test</h6>');
  });

  test('should build paragraph', () => {
    const node: ParagraphNode = {
      type: 'Paragraph',
      content: 'This is a paragraph',
    };

    const html = builder.visitParagraph(node);
    expect(html).toBe('<p>This is a paragraph</p>');
  });

  test('should build bullet list', () => {
    const node: ListNode = {
      type: 'List',
      kind: 'bullet',
      children: [
        { type: 'ListItem', content: 'Item 1', children: [] },
        { type: 'ListItem', content: 'Item 2', children: [] },
      ],
    };

    const html = builder.visitList(node);
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>');
  });

  test('should build numbered list', () => {
    const node: ListNode = {
      type: 'List',
      kind: 'numbered',
      children: [
        { type: 'ListItem', content: 'First', children: [] },
        { type: 'ListItem', content: 'Second', children: [] },
      ],
    };

    const html = builder.visitList(node);
    expect(html).toContain('<ol>');
  });

  test('should build task list with checkbox', () => {
    const node: ListNode = {
      type: 'List',
      kind: 'task',
      children: [
        { type: 'ListItem', content: 'Done', checked: true, children: [] },
        { type: 'ListItem', content: 'Not done', checked: false, children: [] },
      ],
    };

    const html = builder.visitList(node);
    expect(html).toContain('<input type="checkbox"');
    expect(html).toContain('checked');
    expect(html).toContain('onclick="return false;"');
  });

  test('should build blockquote', () => {
    const node: BlockquoteNode = {
      type: 'Blockquote',
      level: 1,
      children: [{ type: 'Paragraph', content: 'Quote text' }],
    };

    const html = builder.visitBlockquote(node);
    expect(html).toContain('<blockquote>');
    expect(html).toContain('Quote text');
  });

  test('should build horizontal rule', () => {
    const node: HorizontalRuleNode = {
      type: 'HorizontalRule',
      style: 'solid',
    };

    const html = builder.visitHorizontalRule(node);
    expect(html).toContain('<hr');
    expect(html).toContain('border-top-width: 2px');
    expect(html).toContain('border-top-style: solid');
  });

  test('should build thick horizontal rule', () => {
    const node: HorizontalRuleNode = {
      type: 'HorizontalRule',
      style: 'thick',
    };

    const html = builder.visitHorizontalRule(node);
    expect(html).toContain('<hr');
    expect(html).toContain('border-top-width: 4px');
  });

  test('should build thin horizontal rule', () => {
    const node: HorizontalRuleNode = {
      type: 'HorizontalRule',
      style: 'thin',
    };

    const html = builder.visitHorizontalRule(node);
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

    const html = builder.visitHorizontalRule(node);
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

    const html = builder.visitHorizontalRule(node);
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

    const html = builder.visitHorizontalRule(node);
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

    const html = builder.visitHorizontalRule(node);
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

    const html = builder.visitHorizontalRule(node);
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

    const html = builder.visitHorizontalRule(node);
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

    const html = builder.visitHorizontalRule(node);
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

    const html = builder.visitCodeBlock(node);
    expect(html).toContain('<pre>');
    expect(html).toContain('<code');
    expect(html).toContain('language-javascript');
  });

  test('should build document with wrapper', () => {
    const node: DocumentNode = {
      type: 'Document',
      children: [
        { type: 'Heading', level: 1, content: 'Title' },
        { type: 'Paragraph', content: 'Content' },
      ],
    };

    const html = builder.buildDocument(node);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="">');
    expect(html).toContain('<head>');
    expect(html).toContain('<body>');
    expect(html).toContain('Title');
    expect(html).toContain('Content');
  });

  test('should build attributes', () => {
    const attrs = builder.buildAttributes({ id: 'test', class: 'my-class' });
    expect(attrs).toContain('id="test"');
    expect(attrs).toContain('class="my-class"');
  });

  test('should handle bold inline', () => {
    const node = { type: 'Bold', content: 'bold text' };
    const html = builder.visitBold(node as any);
    expect(html).toBe('<strong>bold text</strong>');
  });

  test('should handle italic inline', () => {
    const node = { type: 'Italic', content: 'italic text' };
    const html = builder.visitItalic(node as any);
    expect(html).toBe('<em>italic text</em>');
  });

  test('should build heading level 2', () => {
    const node: HeadingNode = {
      type: 'Heading',
      level: 2,
      content: 'Section',
    };

    const html = builder.visitHeading(node);
    expect(html).toBe('<h2>Section</h2>');
  });

  test('should build list item with content', () => {
    const node: ListItemNode = {
      type: 'ListItem',
      content: 'First item',
      children: [],
    };

    const html = builder.visitListItem(node);
    expect(html).toBe('<li>First item</li>');
  });

  test('should build link', () => {
    const node: LinkNode = {
      type: 'Link',
      href: 'file.zlt',
      content: 'file.zlt',
    };

    const html = builder.visitLink(node);
    expect(html).toBe('<a href="file.html">file.zlt</a>');
  });

  test('should transform .zlt link to .html', () => {
    const node: LinkNode = {
      type: 'Link',
      href: 'example.zlt',
      content: 'Example',
    };

    const html = builder.visitLink(node);
    expect(html).toContain('href="example.html"');
  });

  test('should not transform non-.zlt links', () => {
    const node: LinkNode = {
      type: 'Link',
      href: 'page.html',
      content: 'Page',
    };

    const html = builder.visitLink(node);
    expect(html).toBe('<a href="page.html">Page</a>');
  });

  test('should not transform external links', () => {
    const node: LinkNode = {
      type: 'Link',
      href: 'https://example.com',
      content: 'External',
    };

    const html = builder.visitLink(node);
    expect(html).toContain('href="https://example.com"');
  });

  test('should build image', () => {
    const node: ImageNode = {
      type: 'Image',
      src: 'img.jpg',
      alt: 'Alt',
    };

    const html = builder.visitImage(node);
    expect(html).toBe('<img src="img.jpg" alt="Alt">');
  });

  test('should build image with attributes', () => {
    const node: ImageNode = {
      type: 'Image',
      src: 'img.jpg',
      alt: 'Alt',
      attributes: { width: '100px', class: 'img-fluid' },
    };

    const html = builder.visitImage(node);
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

    const html = builder.visitFile(node);
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
      content: '[file.zlt](file.zlt) — description',
      children: [],
    };

    const html = builder.visitListItem(node);
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
          content: 'Parent',
          children: [
            {
              type: 'List',
              kind: 'bullet',
              children: [{ type: 'ListItem', content: 'Child', children: [] }],
            },
          ],
        },
      ],
    };

    const html = builder.visitList(node);
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

    const html = builder.visitAbbreviation(node);
    expect(html).toBe('<abbr title="HyperText Markup Language">HTML</abbr>');
  });

  test('should build abbreviation with class attribute', () => {
    const node: AbbreviationNode = {
      type: 'Abbreviation',
      abbreviation: 'HTML',
      definition: 'HyperText Markup Language',
      attributes: { class: 'org-link' },
    };

    const html = builder.visitAbbreviation(node);
    expect(html).toContain('<abbr');
    expect(html).toContain('title="HyperText Markup Language"');
    expect(html).toContain('class="org-link"');
    expect(html).toContain('>HTML</abbr>');
  });

  test('should build abbreviation with id attribute', () => {
    const node: AbbreviationNode = {
      type: 'Abbreviation',
      abbreviation: 'HTML5',
      definition: 'HTML version 5',
      attributes: { id: 'html5-def' },
    };

    const html = builder.visitAbbreviation(node);
    expect(html).toContain('id="html5-def"');
    expect(html).toContain('>HTML5</abbr>');
  });

  test('should process inline abbreviation in text', () => {
    const html = builder.processInline('HTML{abbr="HyperText Markup Language"} is the standard');
    expect(html).toContain('<abbr title="HyperText Markup Language">HTML</abbr>');
    expect(html).toContain('is the standard');
  });

  test('should build abbreviation with Greek letter mu', () => {
    const node: AbbreviationNode = {
      type: 'Abbreviation',
      abbreviation: 'μs',
      definition: 'microsecond',
    };

    const html = builder.visitAbbreviation(node);
    expect(html).toBe('<abbr title="microsecond">μs</abbr>');
  });

  test('should return empty string for CommentInline', () => {
    const node = { type: 'CommentInline', content: 'comment' };
    const html = builder.visitCommentInline();
    expect(html).toBe('');
  });

  test('should remove inline comment during inline processing', () => {
    const html = builder.processInline('Text %% comment %% more text');
    expect(html).toContain('Text');
    expect(html).toContain('more text');
    expect(html).not.toContain('comment');
  });

  test('should build triple colon columns', () => {
    const builder = new HTMLBuilder();
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
    const html = builder.build(node);
    expect(html).toContain('class="triple-colon-block columns"');
    expect(html).toContain('class="triple-colon-block column"');
    expect(html).toContain('style="width: calc(50% - (var(--zolt-column-gap, 1.5rem) * 0.500))"');
  });

  test('should build definition list', () => {
    const node: ListNode = {
      type: 'List',
      kind: 'definition',
      children: [
        { type: 'DefinitionTerm', content: 'Term', children: [] },
        { type: 'DefinitionDescription', content: 'Definition', children: [] },
      ],
    };

    const html = builder.visitList(node);
    expect(html).toContain('<dl>');
    expect(html).toContain('<dt>Term</dt>');
    expect(html).toContain('<dd>Definition</dd>');
    expect(html).toContain('</dl>');
  });

  test('should process inline superscript', () => {
    const html = builder.processInline('2^{10}');
    expect(html).toBe('2<sup>10</sup>');
  });

  test('should process inline subscript', () => {
    const html = builder.processInline('H_{2}O');
    expect(html).toBe('H<sub>2</sub>O');
  });

  test('should process nested superscript', () => {
    const html = builder.processInline('2^{3^{2}}');
    expect(html).toBe('2<sup>3<sup>2</sup></sup>');
  });

  test('should process deeply nested superscript', () => {
    const html = builder.processInline('a^{b^{c^{d}}}');
    expect(html).toBe('a<sup>b<sup>c<sup>d</sup></sup></sup>');
  });

  test('should process nested subscript', () => {
    const html = builder.processInline('x_{y_{z}}');
    expect(html).toBe('x<sub>y<sub>z</sub></sub>');
  });

  test('should process mixed nested superscript and subscript', () => {
    const html = builder.processInline('a^{b_{c}}');
    expect(html).toBe('a<sup>b<sub>c</sub></sup>');
  });

  test('should process superscript with subscript inside', () => {
    const html = builder.processInline('x^{y_{2}}');
    expect(html).toBe('x<sup>y<sub>2</sub></sup>');
  });

  test('should process subscript with superscript inside', () => {
    const html = builder.processInline('x_{y^{2}}');
    expect(html).toBe('x<sub>y<sup>2</sup></sub>');
  });

  test('should process superscript with other inline elements', () => {
    const html = builder.processInline('2^{**bold**}');
    expect(html).toBe('2<sup><strong>bold</strong></sup>');
  });

  test('should process subscript with other inline elements', () => {
    const html = builder.processInline('H_{//italic//}');
    expect(html).toBe('H<sub><em>italic</em></sub>');
  });

  test('should not replace variables inside code spans in processInlineContent', () => {
    const localBuilder = new HTMLBuilder();
    (localBuilder as any).evaluator.setVariable('var', 'REPLACED');
    const html = localBuilder.processInlineContent('Code: `{$var}` and Var: {$var}');
    expect(html).toContain('Code: <code>{$var}</code>');
    expect(html).toContain('Var: REPLACED');
  });

  describe('List Merging', () => {
    test('should merge consecutive lists of same type and attributes', () => {
      const node: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'List',
            kind: 'bullet',
            children: [{ type: 'ListItem', content: 'Item 1', children: [] }],
          },
          {
            type: 'List',
            kind: 'bullet',
            children: [{ type: 'ListItem', content: 'Item 2', children: [] }],
          },
        ],
      };

      const html = builder.buildDocument(node);
      const ulCount = (html.match(/<ul/g) || []).length;
      expect(ulCount).toBe(1);
      expect(html).toContain('<li>Item 1</li>');
      expect(html).toContain('<li>Item 2</li>');
    });

    test('should NOT merge lists of different types', () => {
      const node: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'List',
            kind: 'bullet',
            children: [{ type: 'ListItem', content: 'Bullet', children: [] }],
          },
          {
            type: 'List',
            kind: 'numbered',
            children: [{ type: 'ListItem', content: 'Numbered', children: [] }],
          },
        ],
      };

      const html = builder.buildDocument(node);
      const ulCount = (html.match(/<ul/g) || []).length;
      const olCount = (html.match(/<ol/g) || []).length;
      expect(ulCount).toBe(1);
      expect(olCount).toBe(1);
    });

    test('should NOT merge lists with different attributes', () => {
      const node: DocumentNode = {
        type: 'Document',
        children: [
          {
            type: 'List',
            kind: 'bullet',
            attributes: { class: 'red' },
            children: [{ type: 'ListItem', content: 'Red', children: [] }],
          },
          {
            type: 'List',
            kind: 'bullet',
            attributes: { class: 'blue' },
            children: [{ type: 'ListItem', content: 'Blue', children: [] }],
          },
        ],
      };

      const html = builder.buildDocument(node);
      const ulCount = (html.match(/<ul/g) || []).length;
      expect(ulCount).toBe(2);
    });
  });
});
