import { test, expect } from 'bun:test';
import { ContentProcessor } from './content-processor';
import { ExpressionEvaluator } from './expression-evaluator';

test('should handle multi-line object variables', () => {
  const evaluator = new ExpressionEvaluator();
  const processor = new ContentProcessor(evaluator);

  const content = [
    '$obj = {',
    '  key: "value",',
    '  num: 42',
    '}'
  ].join('\n');

  processor.processContent(content);

  const obj = evaluator.getVariable('obj');
  expect(obj).toEqual({ key: 'value', num: 42 });
});

test('should handle nested multi-line objects and arrays', () => {
  const evaluator = new ExpressionEvaluator();
  const processor = new ContentProcessor(evaluator);

  const content = [
    '$category_products = {',
    '  tech: [',
    '    {name: "Laptop", price: 999},',
    '    {name: "Mouse", price: 29}',
    '  ],',
    '  home: [',
    '    {name: "Lamp", price: 49},',
    '    {name: "Chair", price: 149}',
    '  ]',
    '}'
  ].join('\n');

  processor.processContent(content);

  const products = evaluator.getVariable('category_products') as any;
  expect(products.tech).toBeDefined();
  expect(products.tech.length).toBe(2);
  expect(products.tech[0].name).toBe('Laptop');
  expect(products.home.length).toBe(2);
});

test('should handle empty objects', () => {
  const evaluator = new ExpressionEvaluator();
  const processor = new ContentProcessor(evaluator);

  processor.processContent('$empty = {}');

  const empty = evaluator.getVariable('empty');
  expect(empty).toEqual({});
});

test('should handle direct variable assignment', () => {
  const evaluator = new ExpressionEvaluator();
  const processor = new ContentProcessor(evaluator);

  evaluator.setVariable('other', 123);
  processor.processContent('$ref = $other');

  const ref = evaluator.getVariable('ref');
  expect(ref).toBe(123);
});
