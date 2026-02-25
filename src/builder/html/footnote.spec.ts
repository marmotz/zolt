import { describe, expect, it } from 'bun:test';
import { Lexer } from '../../lexer/lexer';
import { Parser } from '../../parser/parser';
import { HTMLBuilder } from './builder';

describe('Footnotes HTML Rendering', () => {
  it('should render footnote references and definitions', () => {
    const source = `This is a note[^1].

[^1]: Footnote content.`;
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const doc = parser.parse();

    const builder = new HTMLBuilder();
    const html = builder.buildDocument(doc);

    expect(html).toContain('This is a note<sup><a href="#fn:1" id="fnref:1">[1]</a></sup>.');
    expect(html).toContain('<section class="footnotes">');
    expect(html).toContain('<li id="fn:1"><p>Footnote content. <a href="#fnref:1" class="footnote-backref">↩</a></p></li>');
  });

  it('should handle multiple footnotes in order of appearance', () => {
    const source = `First[^b], second[^a].

[^a]: Alpha.
[^b]: Beta.`;
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const doc = parser.parse();

    const builder = new HTMLBuilder();
    const html = builder.buildDocument(doc);

    // [^b] is first in text, so it should be [1]
    expect(html).toContain('First<sup><a href="#fn:b" id="fnref:b">[1]</a></sup>');
    // [^a] is second in text, so it should be [2]
    expect(html).toContain('second<sup><a href="#fn:a" id="fnref:a">[2]</a></sup>');

    // Footnotes section should follow the order [1], [2]
    const fnBIndex = html.indexOf('id="fn:b"');
    const fnAIndex = html.indexOf('id="fn:a"');
    expect(fnBIndex).toBeLessThan(fnAIndex);
  });

  it('should handle complex footnote content with nested blocks', () => {
    const source = `Text[^complex].

[^complex]: Main line.
  - Item 1
  - Item 2
  > A quote.
  \`\`\`js
  console.log("hello");
  \`\`\``;
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const doc = parser.parse();

    const builder = new HTMLBuilder();
    const html = builder.buildDocument(doc);

    expect(html).toContain('<li id="fn:complex"><p>Main line.</p><ul>\n<li>Item 1</li><li>Item 2</li>\n</ul><blockquote><p>A quote.</p></blockquote><pre><code class="language-js">  console.log(&quot;hello&quot;);</code></pre> <a href="#fnref:complex" class="footnote-backref">↩</a></li>');
  });

  it('should handle reusing footnotes without caret and definitions without caret', () => {
    const source = `Ref 1[^reuse].
Ref 2[reuse].

[reuse]: This is reused.`;
    const lexer = new Lexer(source);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const doc = parser.parse();

    const builder = new HTMLBuilder();
    const html = builder.buildDocument(doc);

    expect(html).toContain('Ref 1<sup><a href="#fn:reuse" id="fnref:reuse">[1]</a></sup>');
    expect(html).toContain('Ref 2<sup><a href="#fn:reuse" id="fnref:reuse">[1]</a></sup>');
    expect(html).toContain('<li id="fn:reuse"><p>This is reused. <a href="#fnref:reuse" class="footnote-backref">↩</a></p></li>');
  });
});
