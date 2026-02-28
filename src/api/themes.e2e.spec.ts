import { describe, expect, it } from 'bun:test';
import { buildString } from './index';

describe('E2E: Themes and Color Scheme', () => {
  it('should apply the default theme when none is specified', async () => {
    const content = `# Hello Zolt`;
    const html = await buildString(content);
    expect(html).toContain('<body class="theme-default color-scheme-auto">');
  });

  it('should apply the specified theme from file metadata', async () => {
    const content = `---
theme: professional
---
# Professional Title`;
    const html = await buildString(content);
    expect(html).toContain('<body class="theme-professional color-scheme-auto">');
  });

  it('should apply forced color scheme', async () => {
    const content = `---
theme: technical
colorScheme: dark
---
# Technical Dark`;
    const html = await buildString(content);
    expect(html).toContain('<body class="theme-technical color-scheme-dark">');
  });

  it('should support the playful theme', async () => {
    const content = `---
theme: playful
colorScheme: light
---
# Playful Light`;
    const html = await buildString(content);
    expect(html).toContain('<body class="theme-playful color-scheme-light">');
  });

  it('should contain the new semantic background variables in the styles', async () => {
    const html = await buildString('# Test');
    expect(html).toContain('--zlt-color-info-bg');
    expect(html).toContain('--zlt-color-warning-bg');
    expect(html).toContain('--zlt-color-error-bg');
    expect(html).toContain('--zlt-color-success-bg');
  });

  it('should contain the new error and mono font variables in the styles', async () => {
    const html = await buildString('# Test');
    expect(html).toContain('--zlt-color-error:');
    expect(html).toContain('--zlt-font-mono:');
  });
});
