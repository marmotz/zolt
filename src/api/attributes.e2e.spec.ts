import { describe, expect, test } from 'bun:test';
import { buildString } from './index';

describe('API: Attributes and Anchors', () => {
  test('should apply ID to paragraph on the same line', async () => {
    const html = await buildString('Paragraphe {#para-id}');
    expect(html).toContain('<p id="para-id">Paragraphe</p>');
  });

  test('should apply ID to paragraph without preceding space', async () => {
    const html = await buildString('Paragraphe{#para-id}');
    expect(html).toContain('<p id="para-id">Paragraphe</p>');
  });

  test('should apply ID to paragraph on the next line', async () => {
    const html = await buildString(`Paragraphe\n{#para-id}`);
    expect(html).toContain('<p id="para-id">Paragraphe</p>');
  });

  test('should join lines in paragraph and apply ID', async () => {
    const html = await buildString(`Ligne 1\nLigne 2\n{#para-id}`);
    expect(html).toContain('<p id="para-id">Ligne 1 Ligne 2</p>');
  });

  test('should apply ID to list', async () => {
    const zolt = `- Item 1\n- Item 2\n{#list-id}`;
    const html = await buildString(zolt);
    expect(html).toContain('<ul id="list-id">');
    expect(html).toContain('<li>Item 1</li>');
  });

  test('should apply ID to list item without preceding space', async () => {
    const html = await buildString('- Item{#item-id}');
    expect(html).toContain('<li id="item-id">Item</li>');
  });

  test('should apply ID to blockquote', async () => {
    const zolt = `> Citation\n{#quote-id}`;
    const html = await buildString(zolt);
    expect(html).toContain('<blockquote id="quote-id">');
  });

  test('should apply attributes to bold text', async () => {
    const html = await buildString('**Gras**{#bold-id}');
    expect(html).toContain('<strong id="bold-id">Gras</strong>');
  });

  test('should apply class to italic text', async () => {
    const html = await buildString('//Italique//{.my-class}');
    expect(html).toContain('<em class="my-class">Italique</em>');
  });

  test('should apply style to underline text', async () => {
    const html = await buildString('__Souligné__{color=red}');
    expect(html).toContain('<u style="color: red">Souligné</u>');
  });

  test('should apply ID to code span', async () => {
    const html = await buildString('`code`{#code-id}');
    expect(html).toContain('<code id="code-id">code</code>');
  });

  test('should resolve internal link with @ prefix', async () => {
    const zolt = `[Lien](@target)\n\nCible {#target}`;
    const html = await buildString(zolt);
    expect(html).toContain('<a href="#target">Lien</a>');
    expect(html).toContain('<p id="target">Cible</p>');
  });

  test('should apply attributes to triple colon blocks on new line', async () => {
    const zolt = `:::info\nContenu\n:::\n{#info-id}`;
    const html = await buildString(zolt);
    expect(html).toContain('<div id="info-id" class="triple-colon-block info"');
  });

  test('should apply attributes to tables on new line', async () => {
    const zolt = `| H1 | H2 |\n|---|---|\n| D1 | D2 |\n{#table-id}`;
    const html = await buildString(zolt);
    expect(html).toContain('<table id="table-id">');
  });
});
