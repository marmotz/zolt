import { describe, expect, it } from 'bun:test';
import { lint } from './index';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';

describe('Linter: Frontmatter Validation', () => {
  const testFile = join(process.cwd(), 'temp_lint_test.zlt');

  it('should warn about unknown metadata fields', async () => {
    const content = `---
title: "Valid"
unknown_field: "Invalid"
another_bad_one: 42
---
# Content`;
    
    await writeFile(testFile, content);
    
    try {
      const result = await lint(testFile);
      
      const unknownFieldWarning = result.warnings.find(w => w.message.includes('unknown_field'));
      const anotherBadOneWarning = result.warnings.find(w => w.message.includes('another_bad_one'));
      
      expect(unknownFieldWarning).toBeDefined();
      expect(unknownFieldWarning?.line).toBe(3);
      expect(anotherBadOneWarning).toBeDefined();
      expect(anotherBadOneWarning?.line).toBe(4);
    } finally {
      await unlink(testFile);
    }
  });

  it('should not warn about known metadata fields', async () => {
    const content = `---
title: "Known"
author: "Zolt"
date: 2026-02-24
version: 1.0
tags: [test]
description: "Everything is fine"
lang: fr
toc: true
theme: professional
color-scheme: dark
---
# Content`;
    
    await writeFile(testFile, content);
    
    try {
      const result = await lint(testFile);
      const metadataWarnings = result.warnings.filter(w => w.code === 'UNKNOWN_METADATA');
      expect(metadataWarnings.length).toBe(0);
    } finally {
      await unlink(testFile);
    }
  });
});
