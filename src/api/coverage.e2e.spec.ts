import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import * as path from 'node:path';
import { buildString, extractAllAssets, lint } from './index';

describe('API Coverage Improvement', () => {
  const tmpDir = path.resolve('/tmp/zolt-api-coverage');

  beforeAll(async () => {
    await mkdir(tmpDir, { recursive: true });
  });

  afterAll(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe('extractAllAssets', () => {
    it('should extract assets from project metadata', () => {
      const projectMetadata = {
        image: 'img.png',
        icon_png: 'icon.png',
        icon_svg: 'icon.svg',
        icon_ico: 'favicon.ico',
        icon_apple: 'apple-touch-icon.png',
        manifest: 'site.webmanifest',
        layout: '_layout.zlt',
      };

      const result = extractAllAssets('', projectMetadata);
      expect(result.otherAssets).toContain('img.png');
      expect(result.otherAssets).toContain('icon.png');
      expect(result.otherAssets).toContain('icon.svg');
      expect(result.otherAssets).toContain('favicon.ico');
      expect(result.otherAssets).toContain('apple-touch-icon.png');
      expect(result.otherAssets).toContain('site.webmanifest');
      expect(result.zltLinks).toContain('_layout.zlt');
    });

    it('should extract assets from file metadata', async () => {
      const content = `---
image: f-img.png
icon_png: f-icon.png
icon_svg: f-icon.svg
icon_ico: f-favicon.ico
icon_apple: f-apple-icon.png
manifest: f-site.webmanifest
layout: f-layout.zlt
---
# Content`;

      const result = extractAllAssets(content);
      expect(result.otherAssets).toContain('f-img.png');
      expect(result.otherAssets).toContain('f-icon.png');
      expect(result.otherAssets).toContain('f-icon.svg');
      expect(result.otherAssets).toContain('f-favicon.ico');
      expect(result.otherAssets).toContain('f-apple-icon.png');
      expect(result.otherAssets).toContain('f-site.webmanifest');
      expect(result.zltLinks).toContain('f-layout.zlt');
    });

    it('should handle bubbling layout resolution', async () => {
      const subDir = path.join(tmpDir, 'sub');
      await mkdir(subDir, { recursive: true });
      await writeFile(path.join(tmpDir, '_layout.zlt'), 'Layout content');

      const content = '# Page';
      const filePath = path.join(subDir, 'page.zlt');

      const result = extractAllAssets(content, { layout: '_layout.zlt' }, filePath);
      expect(result.zltLinks).toContain('_layout.zlt');
    });

    it('should visit table components in extractAllAssets', () => {
      const content = '| col |\n| --- |\n| [link.zlt](link.zlt) |';
      const result = extractAllAssets(content);
      expect(result.zltLinks).toContain('link.zlt');
    });

    it('should extract asset files via getAssetFiles', async () => {
      const filePath = path.join(tmpDir, 'assets.zlt');
      await writeFile(filePath, '![img](image.png)');
      const assets = await import('./index').then((m) => m.getAssetFiles(filePath));
      expect(assets).toContain('image.png');
    });

    it('should handle missing bubbling file in findBubblingFile', async () => {
      const { extractAllAssets } = await import('./index');
      const result = extractAllAssets('# Test', { layout: 'missing-layout.zlt' }, path.join(tmpDir, 'sub/page.zlt'));
      expect(result.zltLinks).toContain('missing-layout.zlt');
    });
  });

  describe('visit function in extractAllAssets', () => {
    it('should visit various node types', () => {
      const { extractAllAssets } = require('./index');
      const content = `
| col |
| --- |
| val |

> quote [link](page.zlt)
`;
      const result = extractAllAssets(content);
      expect(result.zltLinks).toContain('page.zlt');
    });
  });

  describe('buildString', () => {
    it('should update globalAbbreviations from parser', async () => {
      const globalAbbreviations = new Map<string, string>();
      await buildString('**[HTML]: HyperText Markup Language', { globalAbbreviations });
      expect(globalAbbreviations.get('HTML')).toBe('HyperText Markup Language');
    });

    it('should build project graph if entryPoint is provided', async () => {
      const entryFile = path.join(tmpDir, 'index.zlt');
      await writeFile(entryFile, '# Index\n[Page](page.zlt)');
      await writeFile(path.join(tmpDir, 'page.zlt'), '# Page');

      const html = await buildString('[[filetree]]', { entryPoint: entryFile });
      expect(html).toContain('index.html');
      expect(html).toContain('page.html');
    });

    it('should throw error for unsupported output type', async () => {
      try {
        await buildString('', { type: 'pdf' as any });
        expect(false).toBe(true); // Should not reach here
      } catch (e: any) {
        expect(e.message).toBe('Unsupported output type: pdf');
      }
    });

    it('should handle missing file gracefully in buildString stats', async () => {
      // Provide a non-existent path to trigger the catch block in buildString
      const html = await buildString('# Test', { filePath: '/tmp/non-existent-file-12345.zlt' });
      expect(html).toMatch(/<h1[^>]*>Test<\/h1>/);
    });

    it('should use projectTitle from projectMetadata.title', async () => {
      const html = await buildString('{$projectTitle}', {
        projectMetadata: { title: 'My Awesome Project' },
      });
      expect(html).toContain('My Awesome Project');
    });
  });

  describe('buildFileToString', () => {
    it('should build file to string', async () => {
      const filePath = path.join(tmpDir, 'to-string.zlt');
      await writeFile(filePath, '# To String');
      const { buildFileToString } = await import('./index');
      const html = await buildFileToString(filePath);
      expect(html).toContain('To String');
    });
  });

  describe('lint', () => {
    it('should collect warnings in lint', async () => {
      const filePath = path.join(tmpDir, 'warning.zlt');
      await writeFile(filePath, '---\nunknown_field: some value\n---\n# Content');
      const result = await lint(filePath);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].code).toBe('UNKNOWN_METADATA');
    });
    it('should return error for non-existent file', async () => {
      const result = await lint('/tmp/definitely-not-there.zlt');
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('FILE_NOT_FOUND');
    });

    it('should return error for permission denied (mock-ish)', async () => {
      // We can't easily trigger EACCES on all systems without sudo,
      // but we can test that any error is caught and reported as PARSE_ERROR if not handled.
      const result = await lint('/root/secret.zlt'); // Usually no access for normal user
      expect(result.valid).toBe(false);
      // On some systems it might be FILE_NOT_FOUND if /root is not searchable,
      // on others PERMISSION_ERROR.
      expect(['FILE_NOT_FOUND', 'PERMISSION_ERROR', 'PARSE_ERROR']).toContain(result.errors[0].code);
    });
  });
});
