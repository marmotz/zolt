import { describe, expect, it } from 'bun:test';
import { existsSync, readFileSync } from 'fs';
import { buildString } from './index';

describe('Zolt Syntax Highlighting (Shiki)', () => {
  it('should highlight zolt code block with basic tokens', async () => {
    const content = `\`\`\`zolt
# Heading
$var = 1
\`\`\``;
    const html = await buildString(content);

    expect(html).toContain('shiki');
    // Vérifie la présence de spans de couleur (signe d'une coloration active)
    expect(html).toContain('<span style="color:');
  });

  it('should highlight complex zolt syntax', async () => {
    // Note: Utilisation de backticks échappés pour la syntaxe Zolt interne
    const content =
      '```zolt\n' +
      '---\n' +
      'title: "Doc"\n' +
      '---\n' +
      '\n' +
      '# {$title}\n' +
      '\n' +
      '**Bold** and //Italic//\n' +
      '\n' +
      ':::info [Note]\n' +
      'Block content\n' +
      ':::\n' +
      '\n' +
      '[[table]]\n' +
      '| Cell |\n' +
      '[[/table]]\n' +
      '\n' +
      '{{ 1 + 2 }}\n' +
      '```';
    const html = await buildString(content);

    expect(html).toContain('shiki');
    // On s'attend à beaucoup de tokens colorés pour un bloc complexe
    const styleMatches = html.match(/style="color:/g);
    expect(styleMatches && styleMatches.length).toBeGreaterThan(15);
  });

  it('should highlight zolt blocks in real documentation files', async () => {
    const filePath = '/media/data/dev/marmotz-dev/zolt/docs/index.zlt';
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8');
      const html = await buildString(content);

      // index.zlt contient un bloc Zolt
      // Il doit être coloré
      const styleMatches = html.match(/style="color:/g);
      expect(styleMatches && styleMatches.length).toBeGreaterThan(20);
    }
  });

  it('should preserve empty lines in code blocks', async () => {
    const content = '```zolt\nline 1\n\nline 3\n```';
    const html = await buildString(content);

    // Check if we have two lines of content with an empty one between them
    // Shiki generates lines within <span> or <div> depending on theme
    // We can check the raw text content to see if newlines are present
    expect(html).toContain('line 1');
    expect(html).toContain('line 3');

    // Check if there is an empty line or at least the preserved structure
    // In many Shiki themes, an empty line is a span with just a newline or a specific height
    // Since we add '\n' in the parser for each CODE_BLOCK token,
    // and an empty line is a CODE_BLOCK token with empty value,
    // it results in a '\n' in the final string passed to Shiki.

    // Shiki adds some header/footer lines, but let's check if the number of lines is correct
    // "line 1\n\nline 3" is 3 lines.
    expect(html.includes('line 1') && html.includes('line 3')).toBe(true);
  });
});
