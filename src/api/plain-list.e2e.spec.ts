import { expect, test } from 'bun:test';
import { buildString } from './index';

test('should render a plain list with + prefix', async () => {
  const input = `
+ Item 1
+ Item 2
  `;
  const html = await buildString(input);

  expect(html).toContain('<ul class="zolt-list-plain">');
  expect(html).toContain('<li>Item 1</li>');
  expect(html).toContain('<li>Item 2</li>');
});

test('should render nested plain lists', async () => {
  const input = `
+ Parent
  + Child 1
  + Child 2
+ Other
  `;
  const html = await buildString(input);

  expect(html).toContain('<ul class="zolt-list-plain">');
  expect(html).toContain('<li>Parent');
  expect(html).toContain('<li>Child 1</li>');
  expect(html).toContain('<li>Child 2</li>');
});

test('should support attributes on plain lists', async () => {
  const input = `
+ Item 1
+ Item 2
{#my-list .custom}
  `;
  const html = await buildString(input);

  expect(html).toContain('id="my-list"');
  expect(html).toContain('class="custom zolt-list-plain"');
  // Check that no manual style was added by the visitor
  expect(html).not.toContain('style="list-style: none"');
});
