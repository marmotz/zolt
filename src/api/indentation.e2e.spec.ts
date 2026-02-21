import { expect, test } from 'bun:test';
import { Lexer } from '../lexer/lexer';
import { Parser } from '../parser/parser';
import { HTMLBuilder } from '../builder/html/builder';

async function buildString(input: string): Promise<string> {
  const lexer = new Lexer(input);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();
  const builder = new HTMLBuilder();
  return builder.visitDocument(ast);
}

test('should build simple technical indentation', async () => {
  const html = await buildString('& Indented text');
  expect(html).toContain('<div class="indented" style="margin-left: 2em">');
  expect(html).toContain('<p>Indented text</p>');
  expect(html).toContain('</div>');
});

test('should build multiple lines of technical indentation', async () => {
  const html = await buildString(`& Line 1\n& Line 2`);
  expect(html).toContain('<div class="indented" style="margin-left: 2em">');
  expect(html).toContain('<p>Line 1</p>');
  expect(html).toContain('<p>Line 2</p>');
  expect(html).toContain('</div>');
});

test('should build nested technical indentation', async () => {
  const html = await buildString(`& Level 1\n&& Level 2`);
  expect(html).toContain('<div class="indented" style="margin-left: 2em">');
  expect(html).toContain('<p>Level 1</p>');
  expect(html).toContain('<div class="indented" style="margin-left: 4em">');
  expect(html).toContain('<p>Level 2</p>');
});

test('should distinguish technical indentation from blockquotes', async () => {
  const html = await buildString(`& Indent\n> Quote`);
  expect(html).toContain('<div class="indented" style="margin-left: 2em">');
  expect(html).toContain('<p>Indent</p>');
  expect(html).toContain('<blockquote>');
  expect(html).toContain('<p>Quote</p>');
});
