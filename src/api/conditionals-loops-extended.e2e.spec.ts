import { describe, expect, test } from 'bun:test';
import { buildString } from './index';

describe('Conditionals Extended (elseif, else)', () => {
  test('should handle if-elseif-else with true if', async () => {
    const input = `
$val = "A"
:::if {$val == "A"}
CASE A
:::elseif {$val == "B"}
CASE B
:::else
CASE ELSE
:::
`;
    const html = await buildString(input);
    expect(html).toContain('CASE A');
    expect(html).not.toContain('CASE B');
    expect(html).not.toContain('CASE ELSE');
  });

  test('should handle if-elseif-else with true elseif', async () => {
    const input = `
$val = "B"
:::if {$val == "A"}
CASE A
:::elseif {$val == "B"}
CASE B
:::else
CASE ELSE
:::
`;
    const html = await buildString(input);
    expect(html).not.toContain('CASE A');
    expect(html).toContain('CASE B');
    expect(html).not.toContain('CASE ELSE');
  });

  test('should handle if-elseif-else with true else', async () => {
    const input = `
$val = "C"
:::if {$val == "A"}
CASE A
:::elseif {$val == "B"}
CASE B
:::else
CASE ELSE
:::
`;
    const html = await buildString(input);
    expect(html).not.toContain('CASE A');
    expect(html).not.toContain('CASE B');
    expect(html).toContain('CASE ELSE');
  });

  test('should handle multiple elseif', async () => {
    const input = `
$val = 3
:::if {$val == 1}
1
:::elseif {$val == 2}
2
:::elseif {$val == 3}
3
:::else
OTHER
:::
`;
    const html = await buildString(input);
    expect(html).toContain('<p>3</p>');
    expect(html).not.toContain('<p>1</p>');
    expect(html).not.toContain('<p>2</p>');
    expect(html).not.toContain('<p>OTHER</p>');
  });

  test('should ignore standalone elseif and else', async () => {
    const input = `
:::elseif {true}
STRAY ELSEIF
:::
:::else
STRAY ELSE
:::
`;
    const html = await buildString(input);
    expect(html).not.toContain('STRAY ELSEIF');
    expect(html).not.toContain('STRAY ELSE');
  });

  test('should handle nested conditional blocks correctly', async () => {
    const input = `
$outer = true
$inner = false
:::if {$outer}
  OUTER TRUE
  :::if {$inner}
    INNER TRUE
  :::else
    INNER FALSE
  :::
:::else
  OUTER FALSE
:::
`;
    const html = await buildString(input);
    expect(html).toContain('OUTER TRUE');
    expect(html).toContain('INNER FALSE');
    expect(html).not.toContain('INNER TRUE');
    expect(html).not.toContain('OUTER FALSE');
  });
});

describe('Foreach Extended (else)', () => {
  test('should render body when list is not empty', async () => {
    const input = `
$items = ["A", "B"]
:::foreach {$items as $item}
ITEM: {$item}
:::else
EMPTY
:::
`;
    const html = await buildString(input);
    expect(html).toContain('ITEM: A');
    expect(html).toContain('ITEM: B');
    expect(html).not.toContain('EMPTY');
  });

  test('should render else when list is empty', async () => {
    const input = `
$items = []
:::foreach {$items as $item}
ITEM: {$item}
:::else
EMPTY
:::
`;
    const html = await buildString(input);
    expect(html).not.toContain('ITEM:');
    expect(html).toContain('EMPTY');
  });

  test('should render else when collection is null/undefined', async () => {
    const input = `
:::foreach {$unknown as $item}
ITEM: {$item}
:::else
EMPTY
:::
`;
    const html = await buildString(input);
    expect(html).not.toContain('ITEM:');
    expect(html).toContain('EMPTY');
  });

  test('should handle nested foreach with else', async () => {
    const input = `
$groups = [
  {name: "G1", items: ["A"]},
  {name: "G2", items: []}
]
:::foreach {$groups as $group}
GROUP: {$group.name}
:::foreach {$group.items as $item}
- {$item}
:::else
- NO ITEMS
:::
:::
`;
    const html = await buildString(input);
    expect(html).toContain('GROUP: G1');
    expect(html).toContain('<li>A</li>');
    expect(html).toContain('GROUP: G2');
    expect(html).toContain('<li>NO ITEMS</li>');
  });
});
