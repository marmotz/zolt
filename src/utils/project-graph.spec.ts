import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import * as fs from 'fs';
import * as path from 'path';
import { ProjectGraphBuilder } from './project-graph';

describe('ProjectGraphBuilder', () => {
  const testDir = path.resolve(process.cwd(), 'test-graph-unit');
  const indexFile = path.join(testDir, 'index.zlt');
  const page1File = path.join(testDir, 'page1.zlt');

  beforeEach(() => {
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir);
    fs.writeFileSync(indexFile, '# Index\n[Page 1](page1.zlt)');
    fs.writeFileSync(page1File, '# Page 1\n[Index](index.zlt)');
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
  });

  test('should build a project graph and handle cycles', () => {
    const builder = new ProjectGraphBuilder(indexFile);
    const graph = builder.build();

    expect(graph).not.toBeNull();
    // Use basename if title metadata is missing
    expect(graph!.title).toBe('index');
    expect(graph!.children.length).toBe(1);
    expect(graph!.children[0].title).toBe('page1');
    expect(graph!.children[0].children.length).toBe(0); // Cycle
  });

  test('should extract title from metadata', () => {
    fs.writeFileSync(indexFile, '---\ntitle: Custom Title\n---\n# Index');
    const builder = new ProjectGraphBuilder(indexFile);
    const graph = builder.build();

    expect(graph!.title).toBe('Custom Title');
  });
});
