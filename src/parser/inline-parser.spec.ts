import { describe, expect, test } from 'bun:test';
import { InlineParser } from './inline-parser';

describe('InlineParser', () => {
  const parser = new InlineParser();

  describe('Italic with forward slashes', () => {
    test('should parse italic with forward slashes in content', () => {
      const nodes = parser.parse('//DD/MM/YYYY//');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Italic');
      expect((nodes[0] as any).content).toBe('DD/MM/YYYY');
    });

    test('should parse italic with multiple forward slashes in content', () => {
      const nodes = parser.parse('//path/to/file/name//');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Italic');
      expect((nodes[0] as any).content).toBe('path/to/file/name');
    });

    test('should parse italic with date format', () => {
      const nodes = parser.parse('//Last updated: DD/MM/YYYY HH:mm:ss//');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Italic');
      expect((nodes[0] as any).content).toBe('Last updated: DD/MM/YYYY HH:mm:ss');
    });

    test('should parse italic with expression immediately after opening delimiter', () => {
      const nodes = parser.parse('//{{ Date.format($modified, "DD/MM/YYYY") }}//');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Italic');
      expect((nodes[0] as any).content).toBe('{{ Date.format($modified, "DD/MM/YYYY") }}');
    });

    test('should parse italic with expression followed immediately by closing delimiter', () => {
      const nodes = parser.parse('//Last updated: {{ Date.format($modified, "DD/MM/YYYY") }}//');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Italic');
      expect((nodes[0] as any).content).toBe('Last updated: {{ Date.format($modified, "DD/MM/YYYY") }}');
    });

    test('should parse italic with URL-like content', () => {
      const nodes = parser.parse('//visit: example.com/path//');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Italic');
      expect((nodes[0] as any).content).toBe('visit: example.com/path');
    });
  });

  describe('Bold with asterisks', () => {
    test('should parse bold with asterisks in content', () => {
      const nodes = parser.parse('**Score: 5 * 3 = 15**');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Bold');
      expect((nodes[0] as any).content).toBe('Score: 5 * 3 = 15');
    });

    test('should parse bold with multiple asterisks in content', () => {
      const nodes = parser.parse('***emphasis* style**');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Bold');
      expect((nodes[0] as any).content).toBe('*emphasis* style');
    });

    test('should parse bold with math expression', () => {
      const nodes = parser.parse('**Result: 2 * 3 + 4 * 5 = 26**');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Bold');
      expect((nodes[0] as any).content).toBe('Result: 2 * 3 + 4 * 5 = 26');
    });

    test('should parse bold with expression followed immediately by closing delimiter', () => {
      const nodes = parser.parse('**Value: {{ $price * 1.2 }}**');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Bold');
      expect((nodes[0] as any).content).toBe('Value: {{ $price * 1.2 }}');
    });

    test('should parse bold with expression immediately after opening delimiter', () => {
      const nodes = parser.parse('**{{ $price * 1.2 }}**');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Bold');
      expect((nodes[0] as any).content).toBe('{{ $price * 1.2 }}');
    });
  });

  describe('Underline with underscores', () => {
    test('should parse underline with underscores in content', () => {
      const nodes = parser.parse('__variable_name_here__');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Underline');
      expect((nodes[0] as any).content).toBe('variable_name_here');
    });

    test('should parse underline with snake_case content', () => {
      const nodes = parser.parse('__my_function_name__');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Underline');
      expect((nodes[0] as any).content).toBe('my_function_name');
    });

    test('should parse underline with single underscore in content', () => {
      const nodes = parser.parse('__hello_world__');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Underline');
      expect((nodes[0] as any).content).toBe('hello_world');
    });

    test('should parse underline with expression immediately after opening delimiter', () => {
      const nodes = parser.parse('__{{ $name }}__');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Underline');
      expect((nodes[0] as any).content).toBe('{{ $name }}');
    });

    test('should parse underline with expression followed immediately by closing delimiter', () => {
      const nodes = parser.parse('__Value: {{ $name }}__');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Underline');
      expect((nodes[0] as any).content).toBe('Value: {{ $name }}');
    });
  });

  describe('Strikethrough with tildes', () => {
    test('should parse strikethrough with single tilde in content', () => {
      const nodes = parser.parse('~~deleted ~ text~~');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Strikethrough');
      expect((nodes[0] as any).content).toBe('deleted ~ text');
    });

    test('should parse strikethrough with approximate value', () => {
      const nodes = parser.parse('~~approx. ~50 items~~');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Strikethrough');
      expect((nodes[0] as any).content).toBe('approx. ~50 items');
    });

    test('should parse strikethrough with expression immediately after opening delimiter', () => {
      const nodes = parser.parse('~~{{ $old_value }}~~');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Strikethrough');
      expect((nodes[0] as any).content).toBe('{{ $old_value }}');
    });

    test('should parse strikethrough with expression followed immediately by closing delimiter', () => {
      const nodes = parser.parse('~~Old: {{ $old_value }}~~');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Strikethrough');
      expect((nodes[0] as any).content).toBe('Old: {{ $old_value }}');
    });
  });

  describe('Highlight with equals signs', () => {
    test('should parse highlight with equals signs in content', () => {
      const nodes = parser.parse('==formula: a = b + c==');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Highlight');
      expect((nodes[0] as any).content).toBe('formula: a = b + c');
    });

    test('should parse highlight with single equals in content', () => {
      const nodes = parser.parse('==x = y==');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Highlight');
      expect((nodes[0] as any).content).toBe('x = y');
    });

    test('should parse highlight with assignment', () => {
      const nodes = parser.parse('==result = 42==');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Highlight');
      expect((nodes[0] as any).content).toBe('result = 42');
    });

    test('should parse highlight with expression immediately after opening delimiter', () => {
      const nodes = parser.parse('=={{ $important }}==');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Highlight');
      expect((nodes[0] as any).content).toBe('{{ $important }}');
    });

    test('should parse highlight with expression followed immediately by closing delimiter', () => {
      const nodes = parser.parse('==Important: {{ $value }}==');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Highlight');
      expect((nodes[0] as any).content).toBe('Important: {{ $value }}');
    });
  });

  describe('Multiple inline elements', () => {
    test('should parse multiple inline elements in same text', () => {
      const nodes = parser.parse('**bold** and //italic// and __underline__');
      expect(nodes).toHaveLength(5);
      expect(nodes[0].type).toBe('Bold');
      expect(nodes[1].type).toBe('Text');
      expect(nodes[2].type).toBe('Italic');
      expect(nodes[3].type).toBe('Text');
      expect(nodes[4].type).toBe('Underline');
    });

    test('should parse nested inline elements correctly', () => {
      const nodes = parser.parse('**bold with //italic// inside**');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Bold');
      expect((nodes[0] as any).content).toBe('bold with //italic// inside');
    });

    test('should capture deeply nested inline delimiters in content', () => {
      const nodes = parser.parse('//**__~~==text==~~__**//');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Italic');
      expect((nodes[0] as any).content).toBe('**__~~==text==~~__**');
    });

    test('should capture all inline formats in italic content', () => {
      const nodes = parser.parse('//**bold** __underline__ ~~strike~~ ==highlight==//');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Italic');
      expect((nodes[0] as any).content).toBe('**bold** __underline__ ~~strike~~ ==highlight==');
    });

    test('should handle text before and after inline elements', () => {
      const nodes = parser.parse('Start **bold** end');
      expect(nodes).toHaveLength(3);
      expect(nodes[0].type).toBe('Text');
      expect((nodes[0] as any).content).toBe('Start ');
      expect(nodes[1].type).toBe('Bold');
      expect(nodes[2].type).toBe('Text');
      expect((nodes[2] as any).content).toBe(' end');
    });
  });

  describe('Edge cases', () => {
    test('should not parse unclosed italic', () => {
      const nodes = parser.parse('//unclosed italic');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Text');
    });

    test('should not parse unclosed bold', () => {
      const nodes = parser.parse('**unclosed bold');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Text');
    });

    test('should match shortest valid sequence for italic', () => {
      const nodes = parser.parse('//a// and //b//');
      expect(nodes).toHaveLength(3);
      expect(nodes[0].type).toBe('Italic');
      expect((nodes[0] as any).content).toBe('a');
      expect(nodes[1].type).toBe('Text');
      expect((nodes[1] as any).content).toBe(' and ');
      expect(nodes[2].type).toBe('Italic');
      expect((nodes[2] as any).content).toBe('b');
    });

    test('should match shortest valid sequence for bold', () => {
      const nodes = parser.parse('**a** and **b**');
      expect(nodes).toHaveLength(3);
      expect(nodes[0].type).toBe('Bold');
      expect((nodes[0] as any).content).toBe('a');
      expect(nodes[1].type).toBe('Text');
      expect((nodes[1] as any).content).toBe(' and ');
      expect(nodes[2].type).toBe('Bold');
      expect((nodes[2] as any).content).toBe('b');
    });

    test('should not parse double delimiters in content as separate element', () => {
      const nodes = parser.parse('//DD/MM/YYYY//');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Italic');
    });

    test('should handle non-greedy matching correctly', () => {
      const nodes = parser.parse('==a== and ==b==');
      expect(nodes).toHaveLength(3);
      expect(nodes[0].type).toBe('Highlight');
      expect((nodes[0] as any).content).toBe('a');
      expect(nodes[1].type).toBe('Text');
      expect(nodes[2].type).toBe('Highlight');
      expect((nodes[2] as any).content).toBe('b');
    });
  });
});
