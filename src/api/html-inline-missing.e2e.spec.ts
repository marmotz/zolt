import { describe, expect, test } from 'bun:test';
import { buildString } from '../index';

describe('HTML Build - Missing Section 1 Inline Syntax', () => {
  test('should render strikethrough correctly', async () => {
    const input = '~~strikethrough text~~';
    const html = await buildString(input);
    expect(html).toContain('<del');
    expect(html).toContain('strikethrough text</del>');
  });

  test('should render highlight correctly', async () => {
    const input = '==highlighted text==';
    const html = await buildString(input);
    expect(html).toContain('<mark');
    expect(html).toContain('highlighted text</mark>');
  });

  test('should render audio elements correctly', async () => {
    const input = '??[My Podcast](audio.mp3)';
    const html = await buildString(input);
    expect(html).toContain('<audio src="audio.mp3" controls');
    expect(html).toContain('My Podcast</audio>');
  });

  test('should render file download links correctly', async () => {
    const input = '&&[Download Manual](manual.pdf)';
    const html = await buildString(input);
    expect(html).toContain('<a href="manual.pdf"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('Download Manual</a>');
  });

  test('should render line breaks correctly', async () => {
    // La syntaxe est backslash suivi d'un espace à la fin d'une ligne
    const input = 'Line one\\ \nLine two';
    const html = await buildString(input);
    // Le paragraph parser remplace le \n par un espace après avoir traité le line break
    expect(html).toContain('Line one<br />');
    expect(html).toContain('Line two');
  });
});
