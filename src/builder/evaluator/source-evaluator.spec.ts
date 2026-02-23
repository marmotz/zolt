import { describe, expect, test } from 'bun:test';
import { ExpressionEvaluator } from './expression-evaluator';
import { SourceEvaluator } from './source-evaluator';

describe('SourceEvaluator', () => {
  test('should pass through regular content', () => {
    const evaluator = new ExpressionEvaluator();
    const sourceEvaluator = new SourceEvaluator(evaluator);

    const result = sourceEvaluator.evaluate('Hello World');
    expect(result).toBe('Hello World');
  });

  test('should skip comment blocks', () => {
    const evaluator = new ExpressionEvaluator();
    const sourceEvaluator = new SourceEvaluator(evaluator);

    const input = `:::comment
This is a comment
:::
Regular content`;

    const result = sourceEvaluator.evaluate(input);
    expect(result).toContain('Regular content');
    expect(result).not.toContain('This is a comment');
  });

  test('should evaluate if block when condition is true', () => {
    const evaluator = new ExpressionEvaluator();
    evaluator.setVariable('show', true);
    const sourceEvaluator = new SourceEvaluator(evaluator);

    const input = `:::if true
Visible content
:::
Hidden`;

    const result = sourceEvaluator.evaluate(input);
    expect(result).toContain('Visible content');
  });

  test('should skip if block when condition is false', () => {
    const evaluator = new ExpressionEvaluator();
    evaluator.setVariable('show', false);
    const sourceEvaluator = new SourceEvaluator(evaluator);

    const input = `:::if false
Hidden content
:::
Visible`;

    const result = sourceEvaluator.evaluate(input);
    expect(result).toContain('Visible');
    expect(result).not.toContain('Hidden content');
  });

  test('should evaluate foreach block', () => {
    const evaluator = new ExpressionEvaluator();
    evaluator.setVariable('items', ['apple', 'banana', 'cherry']);
    const sourceEvaluator = new SourceEvaluator(evaluator);

    const input = `:::foreach {$items as $item}
- {$item}
:::`;

    const result = sourceEvaluator.evaluate(input);
    expect(result).toContain('- apple');
    expect(result).toContain('- banana');
    expect(result).toContain('- cherry');
  });

  test('should set foreach variables', () => {
    const evaluator = new ExpressionEvaluator();
    evaluator.setVariable('items', ['a', 'b']);
    const sourceEvaluator = new SourceEvaluator(evaluator);

    const input = `:::foreach {$items as $item}
{$item}: {$foreach.index},{$foreach.index1},{$foreach.first},{$foreach.last},{$foreach.even},{$foreach.odd}
:::`;

    const result = sourceEvaluator.evaluate(input);
    expect(result).toContain('a: 0,1,true,false,true,false');
    expect(result).toContain('b: 1,2,false,true,false,true');
  });

  test('should skip code blocks', () => {
    const evaluator = new ExpressionEvaluator();
    const sourceEvaluator = new SourceEvaluator(evaluator);

    const input = `\`\`\`
:::foreach
:::
\`\`\`
After code`;

    const result = sourceEvaluator.evaluate(input);
    expect(result).toContain(':::foreach');
    expect(result).toContain('After code');
  });

  test('should process variable definitions', () => {
    const evaluator = new ExpressionEvaluator();
    const sourceEvaluator = new SourceEvaluator(evaluator);

    const input = `$name = "World"
Hello {$name}`;

    const result = sourceEvaluator.evaluate(input);
    expect(result).toContain('Hello World');
  });
});
