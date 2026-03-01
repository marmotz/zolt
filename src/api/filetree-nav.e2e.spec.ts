import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { buildFileToString } from './index';

describe('Filetree Navigation Markup', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zolt-filetree-nav-'));
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('should render previous and next links based on filetree order', async () => {
    const indexFile = path.join(testDir, 'index.zlt');
    const page1File = path.join(testDir, 'page1.zlt');
    const page2File = path.join(testDir, 'page2.zlt');

    fs.writeFileSync(indexFile, '---\ntitle: Home\n---\n[[filetree-nav]]\n[Page 1](page1.zlt)');
    fs.writeFileSync(page1File, '---\ntitle: Page 1\n---\n[[filetree-nav]]\n[Page 2](page2.zlt)');
    fs.writeFileSync(page2File, '---\ntitle: Page 2\n---\n[[filetree-nav]]');

    // Build Page 1
    const html1 = await buildFileToString(page1File, { entryPoint: indexFile });

    expect(html1).toContain('zolt-nav-link prev');
    expect(html1).toContain('zolt-nav-link next');
    expect(html1).toContain('href="index.html"');
    expect(html1).toContain('href="page2.html"');
    expect(html1).toContain('Home');
    expect(html1).toContain('Page 2');
    expect(html1).toContain('Previous');
    expect(html1).toContain('Next');

    // Build Home (should only have next)
    const htmlHome = await buildFileToString(indexFile, { entryPoint: indexFile });
    expect(htmlHome).not.toContain('zolt-nav-link prev');
    expect(htmlHome).toContain('zolt-nav-link next');
    expect(htmlHome).toContain('href="page1.html"');
    expect(htmlHome).toContain('Page 1');
    expect(htmlHome).toContain('Next');

    // Build Page 2 (should only have prev)
    const html2 = await buildFileToString(page2File, { entryPoint: indexFile });
    expect(html2).toContain('zolt-nav-link prev');
    expect(html2).not.toContain('zolt-nav-link next');
    expect(html2).toContain('href="page1.html"');
    expect(html2).toContain('Page 1');
    expect(html2).toContain('Previous');
  });

  it('should handle nested filetree correctly', async () => {
    const indexFile = path.join(testDir, 'index.zlt');
    const subDir = path.join(testDir, 'sub');
    fs.mkdirSync(subDir);
    const subPageFile = path.join(subDir, 'subpage.zlt');

    fs.writeFileSync(indexFile, '---\ntitle: Home\n---\n[[filetree-nav]]\n[Sub](sub/subpage.zlt)');
    fs.writeFileSync(subPageFile, '---\ntitle: Sub Page\n---\n[[filetree-nav]]');

    // Build Sub Page
    const htmlSub = await buildFileToString(subPageFile, { entryPoint: indexFile });
    expect(htmlSub).toContain('zolt-nav-link prev');
    expect(htmlSub).toContain('href="../index.html"');
    expect(htmlSub).toContain('Home');
  });
});
