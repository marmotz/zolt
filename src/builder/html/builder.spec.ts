import { describe, expect, test } from 'bun:test';
import {
  BlockquoteNode,
  CodeBlockNode,
  DocumentNode,
  HeadingNode,
  HorizontalRuleNode,
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
    expect(html).toContain('<html>');
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
    expect(html).toBe('<a href="file.zlt">file.zlt</a>');
  });

  test('should process inline link in paragraph', () => {
    const html = builder.processInline('[example.zlt](example.zlt)');
    expect(html).toBe('<a href="example.zlt">example.zlt</a>');
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
    expect(html).toContain('<a href="file.zlt">file.zlt</a>');
    expect(html).toContain('— description');
  });
});
