import { describe, expect, test } from 'bun:test';
import { InlineParser } from './inline-parser';
import type {
  BoldNode,
  HighlightNode,
  ItalicNode,
  LinkNode,
  StrikethroughNode,
  TextNode,
  UnderlineNode,
} from './types';

describe('InlineParser', () => {
  const parser = new InlineParser();

  const getFlatContent = (node: any): string => {
    if (node.content !== undefined) {
      return node.content;
    }
    if (node.children) {
      return node.children
        .map((c: any) => {
          if (c.type === 'Text') {
            return c.content;
          }
          if (c.type === 'Expression') {
            return `{{ ${c.expression} }}`;
          }
          if (c.type === 'Variable') {
            return `{$${c.name}}`;
          }

          return getFlatContent(c);
        })
        .join('');
    }

    return '';
  };

  describe('Italic with forward slashes', () => {
    test('should parse italic with forward slashes in content', () => {
      const nodes = parser.parse('//DD/MM/YYYY//');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Italic');
      expect(getFlatContent(nodes[0])).toBe('DD/MM/YYYY');
    });

    test('should parse italic with multiple forward slashes in content', () => {
      const nodes = parser.parse('//path/to/file/name//');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Italic');
      expect(getFlatContent(nodes[0])).toBe('path/to/file/name');
    });

    test('should parse italic with date format', () => {
      const nodes = parser.parse('//Last updated: DD/MM/YYYY hh:mm:ss//');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Italic');
      expect(getFlatContent(nodes[0])).toBe('Last updated: DD/MM/YYYY hh:mm:ss');
    });

    test('should parse italic with expression immediately after opening delimiter', () => {
      const nodes = parser.parse('//{{ Date.format($modified, "DD/MM/YYYY") }}//');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Italic');
      expect(getFlatContent(nodes[0])).toContain('Date.format($modified, "DD/MM/YYYY")');
    });

    test('should parse italic with expression followed immediately by closing delimiter', () => {
      const nodes = parser.parse('//Last updated: {{ Date.format($modified, "DD/MM/YYYY") }}//');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Italic');
      expect(getFlatContent(nodes[0])).toContain('Date.format($modified, "DD/MM/YYYY")');
    });

    test('should parse italic with URL-like content', () => {
      const nodes = parser.parse('//visit: example.com/path//');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Italic');
      expect(getFlatContent(nodes[0])).toBe('visit: example.com/path');
    });

    test('should not trigger italic for URLs in text', () => {
      const nodes = parser.parse('Visit https://zolt.marmotz.dev today.');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Text');
      expect((nodes[0] as any).content).toBe('Visit https://zolt.marmotz.dev today.');
    });
  });

  describe('Bold with asterisks', () => {
    test('should parse bold with asterisks in content', () => {
      const nodes = parser.parse('**Score: 5 * 3 = 15**');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Bold');
      expect(getFlatContent(nodes[0])).toBe('Score: 5 * 3 = 15');
    });

    test('should parse bold with multiple asterisks in content', () => {
      const nodes = parser.parse('***emphasis* style**');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Bold');
      // Now it's nested! Bold -> Text("*emphasis* style") if Italic didn't match.
      // Wait, *...* is not Italic in Zolt, it's //...//.
      // So * is just a character.
      expect(getFlatContent(nodes[0])).toBe('*emphasis* style');
    });

    test('should parse bold with math expression', () => {
      const nodes = parser.parse('**Result: 2 * 3 + 4 * 5 = 26**');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Bold');
      expect(getFlatContent(nodes[0])).toBe('Result: 2 * 3 + 4 * 5 = 26');
    });

    test('should parse bold with expression followed immediately by closing delimiter', () => {
      const nodes = parser.parse('**Value: {{ $price * 1.2 }}**');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Bold');
      expect(getFlatContent(nodes[0])).toContain('$price * 1.2');
    });

    test('should parse bold with expression immediately after opening delimiter', () => {
      const nodes = parser.parse('**{{ $price * 1.2 }}**');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Bold');
      expect(getFlatContent(nodes[0])).toContain('$price * 1.2');
    });
  });

  describe('Underline with underscores', () => {
    test('should parse underline with underscores in content', () => {
      const nodes = parser.parse('__variable_name_here__');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Underline');
      expect(getFlatContent(nodes[0])).toBe('variable_name_here');
    });

    test('should parse underline with snake_case content', () => {
      const nodes = parser.parse('__my_function_name__');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Underline');
      expect(getFlatContent(nodes[0])).toBe('my_function_name');
    });

    test('should parse underline with single underscore in content', () => {
      const nodes = parser.parse('__hello_world__');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Underline');
      expect(getFlatContent(nodes[0])).toBe('hello_world');
    });

    test('should parse underline with expression immediately after opening delimiter', () => {
      const nodes = parser.parse('__{{ $name }}__');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Underline');
      expect(getFlatContent(nodes[0])).toContain('$name');
    });

    test('should parse underline with expression followed immediately by closing delimiter', () => {
      const nodes = parser.parse('__Value: {{ $name }}__');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Underline');
      expect(getFlatContent(nodes[0])).toContain('$name');
    });
  });

  describe('Strikethrough with tildes', () => {
    test('should parse strikethrough with single tilde in content', () => {
      const nodes = parser.parse('~~deleted ~ text~~');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Strikethrough');
      expect(getFlatContent(nodes[0])).toBe('deleted ~ text');
    });

    test('should parse strikethrough with approximate value', () => {
      const nodes = parser.parse('~~approx. ~50 items~~');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Strikethrough');
      expect(getFlatContent(nodes[0])).toBe('approx. ~50 items');
    });

    test('should parse strikethrough with expression immediately after opening delimiter', () => {
      const nodes = parser.parse('~~{{ $old_value }}~~');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Strikethrough');
      expect(getFlatContent(nodes[0])).toContain('$old_value');
    });

    test('should parse strikethrough with expression followed immediately by closing delimiter', () => {
      const nodes = parser.parse('~~Old: {{ $old_value }}~~');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Strikethrough');
      expect(getFlatContent(nodes[0])).toContain('$old_value');
    });
  });

  describe('Highlight with equals signs', () => {
    test('should parse highlight with equals signs in content', () => {
      const nodes = parser.parse('==formula: a = b + c==');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Highlight');
      expect(getFlatContent(nodes[0])).toBe('formula: a = b + c');
    });

    test('should parse highlight with single equals in content', () => {
      const nodes = parser.parse('==x = y==');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Highlight');
      expect(getFlatContent(nodes[0])).toBe('x = y');
    });

    test('should parse highlight with assignment', () => {
      const nodes = parser.parse('==result = 42==');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Highlight');
      expect(getFlatContent(nodes[0])).toBe('result = 42');
    });

    test('should parse highlight with expression immediately after opening delimiter', () => {
      const nodes = parser.parse('=={{ $important }}==');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Highlight');
      expect(getFlatContent(nodes[0])).toContain('$important');
    });

    test('should parse highlight with expression followed immediately by closing delimiter', () => {
      const nodes = parser.parse('==Important: {{ $value }}==');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Highlight');
      expect(getFlatContent(nodes[0])).toContain('$value');
    });
  });

  describe('Multiple inline elements', () => {
    test('should parse multiple inline elements in same text', () => {
      const nodes = parser.parse('This is **bold** and //italic//');
      expect(nodes).toHaveLength(4);
      expect(nodes[1].type).toBe('Bold');
      expect(getFlatContent(nodes[1])).toBe('bold');
      expect(nodes[3].type).toBe('Italic');
      expect(getFlatContent(nodes[3])).toBe('italic');
    });

    test('should parse nested inline elements correctly', () => {
      const nodes = parser.parse('**bold with //italic// inside**');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Bold');
      expect(getFlatContent(nodes[0])).toBe('bold with italic inside');
    });

    test('should capture deeply nested inline delimiters in content', () => {
      const nodes = parser.parse('//**__~~==text==~~__**//');

      expect(nodes).toHaveLength(1);

      const node0 = nodes[0] as ItalicNode;
      expect(node0.type).toBe('Italic');

      const node1 = node0.children[0] as BoldNode;
      expect(node1.type).toBe('Bold');

      const node2 = node1.children[0] as UnderlineNode;
      expect(node2.type).toBe('Underline');

      const node3 = node2.children[0] as StrikethroughNode;
      expect(node3.type).toBe('Strikethrough');

      const node4 = node3.children[0] as HighlightNode;
      expect(node4.type).toBe('Highlight');

      const node5 = node4.children[0] as TextNode;
      expect(node5.type).toBe('Text');
      expect(node5.content).toBe('text');
    });

    test('should capture all inline formats in italic content', () => {
      const nodes = parser.parse('//**bold** __underline__ ~~strike~~ ==highlight==//');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Italic');
      expect(getFlatContent(nodes[0])).toBe('bold underline strike highlight');
    });

    test('should handle text before and after inline elements', () => {
      const nodes = parser.parse('Before //italic// after');
      expect(nodes).toHaveLength(3);
      expect(nodes[0].type).toBe('Text');
      expect((nodes[0] as TextNode).content).toBe('Before ');
      expect(nodes[1].type).toBe('Italic');
      expect(getFlatContent(nodes[1])).toBe('italic');
      expect(nodes[2].type).toBe('Text');
      expect((nodes[2] as TextNode).content).toBe(' after');
    });
  });

  describe('Edge cases', () => {
    test('should not parse unclosed italic', () => {
      const nodes = parser.parse('//italic');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Text');
      expect((nodes[0] as TextNode).content).toBe('//italic');
    });

    test('should not parse unclosed bold', () => {
      const nodes = parser.parse('**bold');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Text');
      expect((nodes[0] as TextNode).content).toBe('**bold');
    });

    test('should match shortest valid sequence for italic', () => {
      const nodes = parser.parse('//a// and //b//');
      expect(nodes).toHaveLength(3);
      expect(nodes[0].type).toBe('Italic');
      expect(getFlatContent(nodes[0])).toBe('a');
      expect(nodes[1].type).toBe('Text');
      expect((nodes[1] as any).content).toBe(' and ');
      expect(nodes[2].type).toBe('Italic');
      expect(getFlatContent(nodes[2])).toBe('b');
    });

    test('should match shortest valid sequence for bold', () => {
      const nodes = parser.parse('**a** and **b**');
      expect(nodes).toHaveLength(3);
      expect(nodes[0].type).toBe('Bold');
      expect(getFlatContent(nodes[0])).toBe('a');
      expect(nodes[1].type).toBe('Text');
      expect((nodes[1] as any).content).toBe(' and ');
      expect(nodes[2].type).toBe('Bold');
      expect(getFlatContent(nodes[2])).toBe('b');
    });

    test('should not parse double delimiters in content as separate element', () => {
      const nodes = parser.parse('**//italic//**');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Bold');
      expect(getFlatContent(nodes[0])).toBe('italic');
    });

    test('should handle non-greedy matching correctly', () => {
      const nodes = parser.parse('==a== and ==b==');
      expect(nodes).toHaveLength(3);
      expect(nodes[0].type).toBe('Highlight');
      expect(getFlatContent(nodes[0])).toBe('a');
      expect(nodes[1].type).toBe('Text');
      expect((nodes[1] as any).content).toBe(' and ');
      expect(nodes[2].type).toBe('Highlight');
      expect(getFlatContent(nodes[2])).toBe('b');
    });
  });

  describe('Escaping', () => {
    test('should handle escaped characters', () => {
      const nodes = parser.parse('\\`print()\\`');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Text');
      expect((nodes[0] as any).content).toBe('`print()`');
    });

    test('should handle escaped delimiters', () => {
      const nodes = parser.parse('\\*\\*not bold\\*\\*');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Text');
      expect((nodes[0] as any).content).toBe('**not bold**');
    });

    test('should handle escaped backslash', () => {
      const nodes = parser.parse('\\\\text');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Text');
      expect((nodes[0] as any).content).toBe('\\text');
    });

    test('should handle escaped line break (\\n)', () => {
      const nodes = parser.parse('line 1\\nline 2');
      expect(nodes).toHaveLength(3);
      expect(nodes[0].type).toBe('Text');
      expect(nodes[1].type).toBe('LineBreak');
      expect(nodes[2].type).toBe('Text');
    });
  });

  describe('Variables with Ternary', () => {
    test('should parse variable with ternary operator', () => {
      const nodes = parser.parse('{$featured ? "Yes" : "No"}');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Variable');
      expect((nodes[0] as any).name).toBe('featured ? "Yes" : "No"');
    });

    test('should parse complex variable with property access and ternary', () => {
      const nodes = parser.parse('{$product.onSale ? "Sale!" : ""}');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Variable');
      expect((nodes[0] as any).name).toBe('product.onSale ? "Sale!" : ""');
    });
  });

  describe('Links', () => {
    test('should parse standard links', () => {
      const nodes = parser.parse('[Zolt](https://zolt.example.com)');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Link');
      expect((nodes[0] as LinkNode).href).toBe('https://zolt.example.com');
      expect(getFlatContent(nodes[0])).toBe('Zolt');
    });

    test('should parse reference-style links', () => {
      parser.setLinkReferences(new Map([['zolt', 'https://zolt.example.com']]));
      const nodes = parser.parse('[Zolt][zolt]');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Link');
      expect((nodes[0] as LinkNode).href).toBe('https://zolt.example.com');
      expect(getFlatContent(nodes[0])).toBe('Zolt');
    });

    test('should parse collapsed reference-style links', () => {
      parser.setLinkReferences(new Map([['zolt', 'https://zolt.example.com']]));
      const nodes = parser.parse('[Zolt][]');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Link');
      expect((nodes[0] as LinkNode).href).toBe('https://zolt.example.com');
      expect(getFlatContent(nodes[0])).toBe('Zolt');
    });

    test('should handle case-insensitive references', () => {
      parser.setLinkReferences(new Map([['zolt', 'https://zolt.example.com']]));
      const nodes = parser.parse('[Zolt][ZOLT]');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Link');
      expect((nodes[0] as LinkNode).href).toBe('https://zolt.example.com');
    });
  });

  describe('Inline Code with variable backticks', () => {
    test('should parse simple inline code', () => {
      const nodes = parser.parse('`print()`');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Code');
      expect((nodes[0] as any).content).toBe('print()');
    });

    test('should parse nested backticks with double backticks', () => {
      const nodes = parser.parse('`` ` ```javascript ``');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Code');
      expect((nodes[0] as any).content).toBe('` ```javascript');
    });

    test('should parse complex nested backticks', () => {
      const nodes = parser.parse('``` `` ` `` ```');
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe('Code');
      expect((nodes[0] as any).content).toBe('`` ` ``');
    });

    test('should handle optional leading/trailing spaces in code span', () => {
      const nodes = parser.parse('`` `code` ``');
      expect(nodes).toHaveLength(1);
      expect((nodes[0] as any).content).toBe('`code`');
    });
  });
});
