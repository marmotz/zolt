import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { mkdir, rm, writeFile } from 'fs/promises';
import * as path from 'path';
import { buildFile, buildString, extractAllAssets, getLinkedFiles, lint } from './index';

describe('API Coverage Final Boost', () => {
  const tmpDir = path.resolve('/tmp/zolt-api-coverage-boost-final');

  beforeAll(async () => {
    await mkdir(tmpDir, { recursive: true });
  });

  afterAll(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('should cover buildFile', async () => {
    const inputFile = path.join(tmpDir, 'input.zlt');
    const outputFile = path.join(tmpDir, 'output.html');
    await writeFile(inputFile, '# Hello');
    await buildFile(inputFile, outputFile);
    const { existsSync } = require('fs');
    expect(existsSync(outputFile)).toBe(true);
  });

  it('should cover buildString with file metadata', async () => {
    const content = '---\ntitle: Meta\n---\n{$title}';
    const html = await buildString(content);
    expect(html).toContain('Meta');
  });

  it('should cover getLinkedFiles', async () => {
    const f1 = path.join(tmpDir, 'f1.zlt');
    await writeFile(f1, '[Link](f2.zlt)');
    const links = await getLinkedFiles(f1);
    expect(links).toContain('f2.zlt');
  });

  it('should cover extractAllAssets additional branches', async () => {
    const content = `
[[filetree]]
| col |
| --- |
| [L](l.zlt) |

> [Q](q.zlt)
`;
    const result = extractAllAssets(content, { image: 'proj.png', layout: 'lay.zlt' });
    expect(result.otherAssets).toContain('proj.png');
    expect(result.zltLinks).toContain('lay.zlt');
    expect(result.zltLinks).toContain('l.zlt');
    expect(result.zltLinks).toContain('q.zlt');
  });

  it('should cover lint error branches', async () => {
    const result = await lint('/non/existent');
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('FILE_NOT_FOUND');
  });
});
