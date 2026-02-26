import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { buildString, lint } from './index';

describe('Include Permission Errors', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zolt-permission-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    mock.restore();
  });

  test('should handle permission denied for included file', async () => {
    const includedFile = path.join(tempDir, 'secret.zlt');
    fs.writeFileSync(includedFile, 'Secret content');

    // On Linux, we can change permissions.
    // 0000 should deny all access.
    fs.chmodSync(includedFile, 0);

    const mainFile = path.join(tempDir, 'main.zlt');
    const mainContent = ':::include secret.zlt';

    const html = await buildString(mainContent, { filePath: mainFile });

    expect(html).toContain('permission denied');
  });

  test('should handle permission denied during linting', async () => {
    const secretFile = path.join(tempDir, 'secret.zlt');
    fs.writeFileSync(secretFile, 'Secret content');
    fs.chmodSync(secretFile, 0);

    const result = await lint(secretFile);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].code).toBe('PERMISSION_ERROR');
    expect(result.errors[0].message).toContain('permission denied');
  });

  test('should handle file not found during linting', async () => {
    const missingFile = path.join(tempDir, 'missing.zlt');

    const result = await lint(missingFile);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].code).toBe('FILE_NOT_FOUND');
    expect(result.errors[0].message).toContain('no such file or directory');
  });
});
