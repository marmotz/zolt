import { describe, expect, test } from 'bun:test';
import {
  AbbreviationNode,
  BlockquoteNode,
  CodeBlockNode,
  DocumentNode,
  FileNode,
  HeadingNode,
  HorizontalRuleNode,
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
    expect(html).toBe('<hr>');
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
    const html = builder.visitCommentInline(node as any);
    expect(html).toBe('');
  });

  test('should remove inline comment during inline processing', () => {
    const html = builder.processInline('Text %% comment %% more text');
    expect(html).toContain('Text');
    expect(html).toContain('more text');
    expect(html).not.toContain('comment');
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
});
