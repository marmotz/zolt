import { describe, expect, test } from 'bun:test';
import { buildString } from './index';

describe('PDF Build - Section 5 Logic and Calculations', () => {
  const options = { type: 'pdf' as const };

  test('should evaluate variables and expressions correctly', async () => {
    const input = `
$name = "Zolt"
$version = 1.0

Hello {$name}!
Version: {$version}
Calculation: {{ 10 * 2 }}
    `;

    const result = await buildString(input, options);
    const docDef = JSON.parse(result);

    expect(docDef.content).toBeDefined();
    const flatContent = JSON.stringify(docDef.content);

    expect(flatContent).toContain('Hello Zolt!');
    expect(flatContent).toContain('Version: 1');
    expect(flatContent).toContain('Calculation: 20');
  });

  test('should evaluate conditional blocks correctly', async () => {
    const input = `
$show = true
$hide = false

:::if $show
Visible content
:::

:::if $hide
Hidden content
:::
    `;

    const result = await buildString(input, options);
    const docDef = JSON.parse(result);

    const flatContent = JSON.stringify(docDef.content);
    expect(flatContent).toContain('Visible content');
    expect(flatContent).not.toContain('Hidden content');
  });

  test('should evaluate loops correctly', async () => {
    const input = `
$items = ["A", "B", "C"]

:::foreach {$items as $item}
Item {$item}
:::
    `;

    const result = await buildString(input, options);
    const docDef = JSON.parse(result);

    const flatContent = JSON.stringify(docDef.content);
    expect(flatContent).toContain('Item A');
    expect(flatContent).toContain('Item B');
    expect(flatContent).toContain('Item C');
  });
});
