import { describe, expect, test } from 'bun:test';
import { ContentProcessor } from './content-processor';
import { ExpressionEvaluator } from './expression-evaluator';

describe('Ternary Operator', () => {
  test('should evaluate simple ternary in expression', () => {
    const evaluator = new ExpressionEvaluator();
    expect(evaluator.evaluate('true ? "yes" : "no"')).toBe('yes');
    expect(evaluator.evaluate('false ? "yes" : "no"')).toBe('no');
  });

  test('should evaluate ternary with numbers', () => {
    const evaluator = new ExpressionEvaluator();
    expect(evaluator.evaluate('1 > 0 ? 10 : 20')).toBe(10);
    expect(evaluator.evaluate('1 < 0 ? 10 : 20')).toBe(20);
  });

  test('should handle variables in ternary', () => {
    const evaluator = new ExpressionEvaluator({ featured: true, price: 100 });
    expect(evaluator.evaluate('$featured ? "Featured" : "Regular"')).toBe('Featured');
    expect(evaluator.evaluate('$price > 50 ? "Expensive" : "Cheap"')).toBe('Expensive');
  });

  test('should handle nested ternaries (right-associative)', () => {
    const evaluator = new ExpressionEvaluator();
    // a ? b : c ? d : e  => a ? b : (c ? d : e)
    expect(evaluator.evaluate('false ? "a" : true ? "b" : "c"')).toBe('b');
    expect(evaluator.evaluate('false ? "a" : false ? "b" : "c"')).toBe('c');
  });

  test('should handle expressions in ternary values', () => {
    const evaluator = new ExpressionEvaluator({ a: 10, b: 20 });
    expect(evaluator.evaluate('true ? $a + $b : $a - $b')).toBe(30);
    expect(evaluator.evaluate('false ? $a + $b : $a - $b')).toBe(-10);
  });

  test('should handle ternary in ContentProcessor variable expansion', () => {
    const evaluator = new ExpressionEvaluator({ featured: true });
    const processor = new ContentProcessor(evaluator);

    expect(processor.processContent('Featured: {$featured ? "Yes" : "No"}')).toBe('Featured: Yes');

    evaluator.setVariable('featured', false);
    expect(processor.processContent('Featured: {$featured ? "Yes" : "No"}')).toBe('Featured: No');
  });

  test('should handle ternary in ContentProcessor expressions', () => {
    const evaluator = new ExpressionEvaluator({ age: 20 });
    const processor = new ContentProcessor(evaluator);

    expect(processor.processContent('Statut: {{ $age >= 18 ? "Adulte" : "Mineur" }}')).toBe('Statut: Adulte');

    evaluator.setVariable('age', 15);
    expect(processor.processContent('Statut: {{ $age >= 18 ? "Adulte" : "Mineur" }}')).toBe('Statut: Mineur');
  });
});
