import { describe, expect, test } from 'bun:test';
import { InlineParser } from './inline-parser';
import { VariableNode } from './types';

describe('InlineParser with Ternary Variables', () => {
  const parser = new InlineParser();

  test('should parse simple variable', () => {
    const nodes = parser.parse('{$featured}');
    expect(nodes).toHaveLength(1);
    expect(nodes[0].type).toBe('Variable');
    expect((nodes[0] as VariableNode).name).toBe('featured');
  });

  test('should parse variable with ternary operator', () => {
    const nodes = parser.parse('{$featured ? "Yes" : "No"}');
    expect(nodes).toHaveLength(1);
    expect(nodes[0].type).toBe('Variable');
    expect((nodes[0] as VariableNode).name).toBe('featured ? "Yes" : "No"');
  });

  test('should parse variable with ternary operator and property access', () => {
    const nodes = parser.parse('{$product.onSale ? "Sale!" : ""}');
    expect(nodes).toHaveLength(1);
    expect(nodes[0].type).toBe('Variable');
    expect((nodes[0] as VariableNode).name).toBe('product.onSale ? "Sale!" : ""');
  });

  test('should parse ternary within a sentence', () => {
    const nodes = parser.parse('Is it featured? {$featured ? "Yes" : "No"}.');
    expect(nodes).toHaveLength(3);
    expect(nodes[1].type).toBe('Variable');
    expect((nodes[1] as VariableNode).name).toBe('featured ? "Yes" : "No"');
  });
});
