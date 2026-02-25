import { describe, expect, test } from 'bun:test';
import { ExpressionNode, ImageNode, VariableNode } from '../../../parser/types';
import { ExpressionEvaluator } from '../../evaluator/expression-evaluator';
import { InlineVisitor } from './inline-visitor';

describe('InlineVisitor', () => {
  const evaluator = new ExpressionEvaluator({
    featured: true,
    name: 'Zolt',
  });

  const visitor = new InlineVisitor(
    () => '', // joinChildren
    () => '', // renderAllAttributes
    (text) => text, // processInline
    evaluator,
    (id) => ({ index: 1, refId: `fnref-${id}` })
  );

  test('should visit variable with ternary operator', () => {
    const node: VariableNode = {
      type: 'Variable',
      name: 'featured ? "Yes" : "No"',
      isGlobal: true,
    };

    expect(visitor.visitVariable(node)).toBe('Yes');

    evaluator.setVariable('featured', false);
    expect(visitor.visitVariable(node)).toBe('No');
  });

  test('should visit expression with ternary operator', () => {
    const node: ExpressionNode = {
      type: 'Expression',
      expression: '$featured ? "Yes" : "No"',
    };

    evaluator.setVariable('featured', true);
    expect(visitor.visitExpression(node)).toBe('Yes');

    evaluator.setVariable('featured', false);
    expect(visitor.visitExpression(node)).toBe('No');
  });

  test('should evaluate ternary operator in attributes', () => {
    // We need to use a real renderAllAttributes for this test
    const realVisitor = new InlineVisitor(
      () => '',
      (attrs) => {
        if (!attrs) return '';
        return Object.entries(attrs)
          .map(([k, v]) => ` ${k}="${v}"`)
          .join('');
      },
      (text) => text,
      evaluator,
      (id) => ({ index: 1, refId: `fnref-${id}` })
    );

    // This is a bit tricky because evaluateString is private,
    // but we can test it through visitImage which uses it for src and alt
    const node: ImageNode = {
      type: 'Image',
      src: '{$featured ? "featured.jpg" : "normal.jpg"}',
      alt: 'Image for {$name}',
      attributes: {},
    };

    evaluator.setVariable('featured', true);
    const html = realVisitor.visitImage(node);
    expect(html).toContain('src="featured.jpg"');
    expect(html).toContain('alt="Image for Zolt"');

    evaluator.setVariable('featured', false);
    const html2 = realVisitor.visitImage(node);
    expect(html2).toContain('src="normal.jpg"');
  });

  describe('Remote URL Protection', () => {
    // Mock asset resolver that mangles paths (simulating the CLI bug)
    const manglingResolver = (path: string) => path.replace(/\/\//g, '/');

    const protectedVisitor = new InlineVisitor(
      () => '', // joinChildren
      () => '', // renderAllAttributes
      (text) => text, // processInline
      evaluator,
      (id) => ({ index: 1, refId: `fnref-${id}` }),
      manglingResolver
    );

    test('should NOT mangle remote image URLs', () => {
      const node: any = {
        type: 'Image',
        src: 'https://example.com/image.jpg',
        alt: 'Alt',
      };
      const html = protectedVisitor.visitImage(node);
      expect(html).toContain('src="https://example.com/image.jpg"');
      expect(html).not.toContain('src="https:/example.com/image.jpg"');
    });

    test('should NOT mangle remote video URLs', () => {
      const node: any = {
        type: 'Video',
        src: 'https://www.youtube.com/watch?v=123',
        alt: 'Video',
      };
      const html = protectedVisitor.visitVideo(node);
      // It should use youtube-nocookie and have both slashes
      expect(html).toContain('src="https://www.youtube-nocookie.com/embed/123"');
    });

    test('should NOT mangle remote audio URLs', () => {
      const node: any = {
        type: 'Audio',
        src: 'https://example.com/audio.mp3',
        alt: 'Audio',
      };
      const html = protectedVisitor.visitAudio(node);
      expect(html).toContain('src="https://example.com/audio.mp3"');
    });

    test('should NOT mangle remote embed URLs', () => {
      const node: any = {
        type: 'Embed',
        src: 'https://example.com/embed',
      };
      const html = protectedVisitor.visitEmbed(node);
      expect(html).toContain('src="https://example.com/embed"');
    });

    test('should still use assetResolver for local paths', () => {
      const node: any = {
        type: 'Image',
        src: 'path//to//local.jpg',
        alt: 'Local',
      };
      const html = protectedVisitor.visitImage(node);
      // The mangling resolver will change // to /
      expect(html).toContain('src="path/to/local.jpg"');
    });
  });

  describe('Math Rendering', () => {
    test('should render inline math using katex', () => {
      const node: any = {
        type: 'Math',
        content: 'E=mc^2',
        isBlock: false,
      };
      const html = visitor.visitMath(node);
      expect(html).toContain('zolt-math-inline');
      expect(html).toContain('katex');
      expect(html).toContain('mc');
    });

    test('should render block math using katex', () => {
      const node: any = {
        type: 'Math',
        content: '\\int x dx',
        isBlock: true,
      };
      const html = visitor.visitMath(node);
      expect(html).toContain('zolt-math-block');
      expect(html).toContain('katex-display');
      expect(html).toContain('int');
    });
  });
});
