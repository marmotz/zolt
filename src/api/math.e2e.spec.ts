import { expect, test } from 'bun:test';
import { buildString } from './index';

test('Math: should render inline math', async () => {
  const input = 'La formule est : $E = mc^2$';
  const html = await buildString(input);

  expect(html).toContain('zolt-math-inline');
  expect(html).toContain('katex');
  // Formula content check (mathml or html parts)
  expect(html).toContain('mc');
});

test('Math: should render block math', async () => {
  const input = '$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$';
  const html = await buildString(input);

  expect(html).toContain('zolt-math-block');
  expect(html).toContain('katex-display');
  expect(html).toContain('int');
});

test('Math: should include KaTeX CSS when math is present', async () => {
  const input = '$1+1=2$';
  const html = await buildString(input);

  expect(html).toContain('https://cdn.jsdelivr.net/npm/katex');
});

test('Math: should NOT include KaTeX CSS when NO math is present', async () => {
  const input = 'Texte sans mathématiques.';
  const html = await buildString(input);

  expect(html).not.toContain('https://cdn.jsdelivr.net/npm/katex');
});
