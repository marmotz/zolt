import { describe, expect, test } from 'bun:test';
import { ExpressionEvaluator } from '../../evaluator/expression-evaluator';
import { AttributeRenderer } from './attribute-renderer';

describe('AttributeRenderer', () => {
  const evaluator = new ExpressionEvaluator();
  const renderer = new AttributeRenderer(evaluator);

  test('should render width as style', () => {
    const attrs = { width: '70%' };
    const html = renderer.renderAllAttributes(attrs);
    expect(html).toContain('style="width: 70%"');
  });

  test('should merge style attribute with other css properties', () => {
    const attrs = { width: '70%', style: '--custom-var: 123;' };
    const html = renderer.renderAllAttributes(attrs);

    // This is what we expect for it to work correctly
    expect(html).toContain('style="--custom-var: 123; width: 70%"');
    // It should NOT contain two style attributes
    const styleMatches = html.match(/style="/g);
    expect(styleMatches?.length).toBe(1);
  });
});
