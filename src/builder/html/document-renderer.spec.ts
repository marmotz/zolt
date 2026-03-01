import { describe, expect, test } from 'bun:test';
import type { DocumentNode } from '../../parser/types';
import { ExpressionEvaluator } from '../evaluator/expression-evaluator';
import { DocumentRenderer } from './document-renderer';

describe('DocumentRenderer', () => {
  const evaluator = new ExpressionEvaluator();
  const renderer = new DocumentRenderer(evaluator);

  test('should render empty document shell', async () => {
    const node: DocumentNode = {
      type: 'Document',
      children: [],
      sourceFile: 'test.zlt',
    };
    const html = renderer.renderDocument(
      node,
      {
        hasTabs: false,
        hasCharts: false,
        hasMermaid: false,
        hasMath: false,
        hasSidebar: false,
        sidebarSide: 'left',
      },
      () => '',
      () => ''
    );

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<title>Document</title>');
  });

  test('should include scripts when needed', async () => {
    const node: DocumentNode = {
      type: 'Document',
      children: [],
      sourceFile: 'test.zlt',
    };
    const html = renderer.renderDocument(
      node,
      {
        hasTabs: true,
        hasCharts: true,
        hasMermaid: true,
        hasMath: true,
        hasSidebar: false,
        sidebarSide: 'left',
      },
      () => '',
      () => ''
    );

    expect(html).toContain('.zolt-tabs');
    expect(html).toContain('chart.js');
    expect(html).toContain('mermaid');
  });

  test('should include sidebar script when hasSidebar is true', async () => {
    const node: DocumentNode = {
      type: 'Document',
      children: [],
      sourceFile: 'test.zlt',
    };
    const html = renderer.renderDocument(
      node,
      {
        hasTabs: false,
        hasCharts: false,
        hasMermaid: false,
        hasMath: false,
        hasSidebar: true,
        sidebarSide: 'left',
      },
      () => '',
      () => ''
    );

    expect(html).toContain("sidebar.classList.toggle('is-open')");
  });

  test('should NOT include sidebar script when hasSidebar is false', async () => {
    const node: DocumentNode = {
      type: 'Document',
      children: [],
      sourceFile: 'test.zlt',
    };
    const html = renderer.renderDocument(
      node,
      {
        hasTabs: false,
        hasCharts: false,
        hasMermaid: false,
        hasMath: false,
        hasSidebar: false,
        sidebarSide: 'left',
      },
      () => '',
      () => ''
    );

    expect(html).not.toContain("sidebar.classList.toggle('is-open')");
  });

  test('should wrap content when sidebar is present', async () => {
    const node: DocumentNode = {
      type: 'Document',
      children: [],
      sourceFile: 'test.zlt',
    };
    const contentHtml = '<aside class="zolt-sidebar zolt-sidebar-left">Sidebar</aside><h1>Main Content</h1>';

    const html = renderer.renderDocumentWithContent(
      node,
      contentHtml,
      {
        hasTabs: false,
        hasCharts: false,
        hasMermaid: false,
        hasMath: false,
        hasSidebar: true,
        sidebarSide: 'left',
      },
      () => ''
    );

    expect(html).toContain('class="theme-default color-scheme-auto has-sidebar sidebar-left"');
    expect(html).toContain('<main class="zolt-main-content">');
    expect(html).toContain('<div class="zolt-content-container">');
    expect(html).toContain('<h1>Main Content</h1>');
  });
});
