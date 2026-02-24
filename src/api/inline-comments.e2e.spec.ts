import { describe, expect, test } from 'bun:test';
import { buildString } from './index';

describe('API: Inline Comments', () => {
  describe('buildString', () => {
    test('should remove inline comment from text', async () => {
      const html = await buildString('Ceci est du texte normal %% et ceci est un commentaire inline %%.');

      expect(html).toContain('Ceci est du texte normal');
      expect(html).not.toContain('commentaire inline');
      expect(html).not.toContain('%%');
    });

    test('should remove inline comment at end of line', async () => {
      const html = await buildString('Texte normal %% TODO: revoir %% suite du texte');

      expect(html).toContain('Texte normal');
      expect(html).toContain('suite du texte');
      expect(html).not.toContain('TODO');
      expect(html).not.toContain('%%');
    });

    test('should remove multiple inline comments in same line', async () => {
      const html = await buildString('Premier %%note1%% texte milieu %%note2%% fin');

      expect(html).toContain('Premier');
      expect(html).toContain('texte milieu');
      expect(html).toContain('fin');
      expect(html).not.toContain('note1');
      expect(html).not.toContain('note2');
      expect(html).not.toContain('%%');
    });

    test('should handle inline comment in heading', async () => {
      const html = await buildString('# Titre principal %% TODO: revoir cette section %%');

      expect(html).toMatch(/<h1[^>]*>Titre principal<\/h1>/);
      expect(html).not.toContain('TODO');
      expect(html).not.toContain('%%');
    });

    test('should handle inline comment in list item', async () => {
      const html = await buildString('- Item de liste %% note importante %%');

      expect(html).toContain('<li>Item de liste</li>');
      expect(html).not.toContain('note importante');
      expect(html).not.toContain('%%');
    });

    test('should handle inline comment within a heading and preserve subsequent text', async () => {
      const html = await buildString('## Introduction %% Note: vérifier les sources %% Suite du titre');

      expect(html).toMatch(/<h2[^>]*>Introduction\s+Suite du titre<\/h2>/);
      expect(html).not.toContain('Note');
      expect(html).not.toContain('vérifier les sources');
      expect(html).not.toContain('%%');
    });

    test('should handle empty inline comment', async () => {
      const html = await buildString('Texte avant%%%% texte après');

      expect(html).toContain('Texte avant');
      expect(html).toContain('texte après');
      expect(html).not.toContain('%%');
    });

    test('should handle multiple %% markers correctly (non-greedy)', async () => {
      const html = await buildString('Texte %% commentaire avec %% imbriqué %% est OK %% fin');

      expect(html).toContain('Texte');
      expect(html).toContain('fin');
      expect(html).not.toContain('commentaire');
      expect(html).not.toContain('%%');
      expect(html).toContain('imbriqué');
      expect(html).not.toContain('est OK');
    });

    test('should handle inline comment with special characters', async () => {
      const html = await buildString(' Prix: 100€ %% TVA incluse %% HT');

      expect(html).toContain('Prix: 100€');
      expect(html).toContain('HT');
      expect(html).not.toContain('TVA');
      expect(html).not.toContain('%%');
    });

    test('should preserve text around inline comment', async () => {
      const html = await buildString('Début %% commentaire %% milieu %% autre %% fin');

      expect(html).toContain('Début');
      expect(html).toContain('milieu');
      expect(html).toContain('fin');
      expect(html).not.toContain('commentaire');
      expect(html).not.toContain('autre');
    });

    test('should handle multiple inline comments in document', async () => {
      const html = await buildString(`# Title

First paragraph %% NOTE %% with comment.

Second paragraph with %% TODO %% multiple %% comments.

- List item %% reminder %% here.
`);

      expect(html).toContain('First paragraph');
      expect(html).toContain('with comment.');
      expect(html).toContain('Second paragraph');
      expect(html).toContain('multiple');
      expect(html).toContain('List item');
      expect(html).toContain('here');
      expect(html).not.toContain('NOTE');
      expect(html).not.toContain('TODO');
      expect(html).not.toContain('reminder');
    });
  });
});
