import { describe, expect, test } from 'bun:test';
import { buildString } from './index';

describe('Tables E2E', () => {
  test('should render simple table', async () => {
    const input = `| A | B |
| --- | --- |
| 1 | 2 |`;
    const html = await buildString(input);

    expect(html).toContain('<table>');
    expect(html).toContain('<thead>');
    expect(html).toContain('<th>A</th>');
    expect(html).toContain('<tbody>');
    expect(html).toContain('<td>1</td>');
  });

  test('should render [h] marker as <th>', async () => {
    const input = `| [h] Name | [h] Age |
| Alice | 30 |`;
    const html = await buildString(input);

    expect(html).toContain('<th>Name</th>');
    expect(html).toContain('<th>Age</th>');
    expect(html).toContain('<td>Alice</td>');
    expect(html).toContain('<td>30</td>');
  });

  test('should render colspan and rowspan', async () => {
    const input = `| [colspan=2] Header |
| [rowspan=2] Vertical | Data |
| | More Data |`;
    const html = await buildString(input);

    expect(html).toContain('<td colspan="2">Header</td>');
    expect(html).toContain('<td rowspan="2">Vertical</td>');
  });

  test('should combine markers and use [[table]] wrapper', async () => {
    const input = `[[table id=advanced class=tech]]
| [h] [colspan=2] Main Header |
| [h] [rowspan=2] Side | Data |
| | More Data |
[[/table]]`;
    const html = await buildString(input);

    expect(html).toContain('<table id="advanced" class="tech">');
    expect(html).toContain('<th colspan="2">Main Header</th>');
    expect(html).toContain('<th rowspan="2">Side</th>');
  });
});
