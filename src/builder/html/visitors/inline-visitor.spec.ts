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
    evaluator
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
      evaluator
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
});
