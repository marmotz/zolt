import { beforeEach, describe, expect, test } from 'bun:test';
import { ASTNode } from '../../../parser/types';
import { ExpressionEvaluator } from '../../evaluator/expression-evaluator';
import { InlineVisitor } from './inline-visitor';

describe('InlineVisitor', () => {
  let visitor: InlineVisitor;
  let evaluator: ExpressionEvaluator;

  beforeEach(() => {
    evaluator = new ExpressionEvaluator();
    visitor = new InlineVisitor(
      async (nodes: ASTNode[]) => nodes.map((n) => (n as any).content || '').join(''),
      (attrs?: any) => (attrs && Object.keys(attrs).length > 0 ? ' with-attrs' : ''),
      async (text: string) => text,
      evaluator,
      () => ({ index: 1, refId: '1' }),
      (path: string) => path.replace(/\/\/+/g, '/')
    );
  });

  test('should visit variable with ternary operator', async () => {
    const node: any = { type: 'Variable', name: 'featured ? "Yes" : "No"' };
    evaluator.setVariable('featured', true);
    const html = await visitor.visit(node);
    expect(html).toBe('Yes');
  });

  test('should visit expression with ternary operator', async () => {
    const node: any = { type: 'Expression', expression: '$age >= 18 ? "Adult" : "Minor"' };
    evaluator.setVariable('age', 20);
    const html = await visitor.visit(node);
    expect(html).toBe('Adult');
  });

  test('should evaluate ternary operator in attributes', async () => {
    const node: any = {
      type: 'Image',
      src: '{$featured ? "featured.jpg" : "normal.jpg"}',
      alt: 'Image for Zolt',
      attributes: {},
    };

    evaluator.setVariable('featured', true);
    const html = await visitor.visitImage(node);
    expect(html).toContain('src="featured.jpg"');
    expect(html).toContain('alt="Image for Zolt"');
  });

  describe('HTML Escaping', () => {
    test('should escape HTML entities in inline code', async () => {
      const node: any = {
        type: 'Code',
        content: '-o, --output <path>',
        attributes: {},
      };

      const html = await visitor.visit(node);
      expect(html).toBe('<code>-o, --output &lt;path&gt;</code>');
    });

    test('should escape HTML entities in variables', async () => {
      const node: any = { type: 'Variable', name: 'val' };
      evaluator.setVariable('val', '<script>alert(1)</script>');
      const html = await visitor.visit(node);
      expect(html).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    });

    test('should escape HTML entities in expressions', async () => {
      const node: any = { type: 'Expression', expression: '"&"' };
      const html = await visitor.visit(node);
      expect(html).toBe('&amp;');
    });

    test('should escape HTML entities in attributes via evaluateString', async () => {
      const node: any = {
        type: 'Image',
        src: '{$url}',
        alt: 'Alt',
      };
      evaluator.setVariable('url', 'image.jpg?q="quoted"');
      const html = await visitor.visitImage(node);
      expect(html).toContain('src="image.jpg?q=&quot;quoted&quot;"');
    });
  });

  describe('Remote URL Protection', () => {
    test('should NOT mangle remote image URLs', async () => {
      const node: any = {
        type: 'Image',
        src: 'https://example.com/image.jpg',
        alt: 'Alt',
      };
      const html = await visitor.visitImage(node);
      expect(html).toContain('src="https://example.com/image.jpg"');
    });

    test('should NOT mangle remote video URLs', async () => {
      const node: any = {
        type: 'Video',
        src: 'https://www.youtube.com/watch?v=123',
        alt: 'Video',
      };
      const html = await visitor.visitVideo(node);
      expect(html).toContain('src="https://www.youtube-nocookie.com/embed/123"');
    });

    test('should NOT mangle remote audio URLs', async () => {
      const node: any = {
        type: 'Audio',
        src: 'https://example.com/audio.mp3',
        alt: 'Audio',
      };
      const html = await visitor.visitAudio(node);
      expect(html).toContain('src="https://example.com/audio.mp3"');
    });

    test('should NOT mangle remote embed URLs', async () => {
      const node: any = {
        type: 'Embed',
        src: 'https://example.com/embed',
      };
      const html = await visitor.visitEmbed(node);
      expect(html).toContain('src="https://example.com/embed"');
    });

    test('should still use assetResolver for local paths', async () => {
      const node: any = {
        type: 'Image',
        src: 'path//to//local.jpg',
        alt: 'Local',
      };
      const html = await visitor.visitImage(node);
      expect(html).toContain('src="path/to/local.jpg"');
    });
  });

  describe('Math Rendering', () => {
    test('should render inline math using katex', async () => {
      const node: any = {
        type: 'Math',
        content: 'E=mc^2',
        isBlock: false,
      };
      const html = await visitor.visitMath(node);
      expect(html).toContain('zolt-math-inline');
      expect(html).toContain('katex');
    });

    test('should render block math using katex', async () => {
      const node: any = {
        type: 'Math',
        content: '\\int x dx',
        isBlock: true,
      };
      const html = await visitor.visitMath(node);
      expect(html).toContain('zolt-math-block');
      expect(html).toContain('katex');
    });
  });
});
