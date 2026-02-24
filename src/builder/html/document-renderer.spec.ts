import { describe, expect, test } from 'bun:test';
import { DocumentRenderer } from './document-renderer';
import { ExpressionEvaluator } from '../evaluator/expression-evaluator';
import { DocumentNode } from '../../parser/types';

describe('DocumentRenderer', () => {
  const evaluator = new ExpressionEvaluator();
  const renderer = new DocumentRenderer(evaluator);

  test('should render empty document shell', () => {
    const node: DocumentNode = {
      type: 'Document',
      children: [],
      sourceFile: 'test.zlt'
    };
    const html = renderer.renderDocument(node, { hasTabs: false, hasCharts: false, hasMermaid: false }, () => '', () => '');

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<title>Document</title>');
  });

  test('should include scripts when needed', () => {
    const node: DocumentNode = {
      type: 'Document',
      children: [],
      sourceFile: 'test.zlt'
    };
    const html = renderer.renderDocument(node, { hasTabs: true, hasCharts: true, hasMermaid: true }, () => '', () => '');

    expect(html).toContain('.zolt-tabs');
    expect(html).toContain('chart.js');
    expect(html).toContain('mermaid');
  });
});
