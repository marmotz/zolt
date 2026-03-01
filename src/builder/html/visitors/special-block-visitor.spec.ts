import { beforeEach, describe, expect, test } from 'bun:test';
import type { ASTNode, TripleColonBlockNode } from '../../../parser/types';
import { SpecialBlockVisitor } from './special-block-visitor';

describe('SpecialBlockVisitor', () => {
  let visitor: SpecialBlockVisitor;

  beforeEach(() => {
    visitor = new SpecialBlockVisitor(
      async (nodes: ASTNode[]) => nodes.map((n) => (n as any).content || '').join(''),
      async (nodes: ASTNode[]) => nodes.map((n) => (n as any).content || '').join(''),
      (attrs?: any) => (attrs ? ' with-attrs' : ''),
      { getVariable: () => null },
      async (text: string) => text,
      []
    );
  });

  test('should render sidebar block', async () => {
    const node: TripleColonBlockNode = {
      type: 'TripleColonBlock',
      blockType: 'sidebar',
      children: [{ type: 'Text', content: 'Sidebar Content' } as any],
      attributes: { side: 'right' },
    };

    const html = await visitor.visitTripleColonBlock(node);
    expect(html).toContain('class="zolt-sidebar zolt-sidebar-right"');
    expect(html).toContain('Sidebar Content');
    expect(visitor.hasSidebar).toBe(true);
    expect(visitor.sidebarSide).toBe('right');
  });

  test('should render sidebar components', async () => {
    const header: TripleColonBlockNode = {
      type: 'TripleColonBlock',
      blockType: 'sidebar-header',
      children: [{ type: 'Text', content: 'Header' } as any],
    };
    const content: TripleColonBlockNode = {
      type: 'TripleColonBlock',
      blockType: 'sidebar-content',
      children: [{ type: 'Text', content: 'Body' } as any],
    };
    const footer: TripleColonBlockNode = {
      type: 'TripleColonBlock',
      blockType: 'sidebar-footer',
      children: [{ type: 'Text', content: 'Footer' } as any],
    };

    const headerHtml = await visitor.visitTripleColonBlock(header);
    expect(headerHtml).toContain('class="zolt-sidebar-header"');
    expect(headerHtml).toContain('class="zolt-sidebar-toggle"');
    expect(headerHtml).toContain('class="zolt-sidebar-close"');
    expect(headerHtml).toContain('aria-label="Toggle sidebar"');
    expect(headerHtml).toContain('aria-label="Close sidebar"');

    expect(await visitor.visitTripleColonBlock(content)).toContain('class="zolt-sidebar-content"');
    expect(await visitor.visitTripleColonBlock(footer)).toContain('class="zolt-sidebar-footer"');
  });

  test('should render filetree', async () => {
    const graph = {
      path: 'index.zlt',
      absPath: '/root/index.zlt',
      title: 'Home',
      children: [
        {
          path: 'page1.zlt',
          absPath: '/root/page1.zlt',
          title: 'Page 1',
          children: [],
        },
      ],
    };

    const visitorWithGraph = new SpecialBlockVisitor(
      async () => '',
      async () => '',
      () => '',
      { getVariable: () => null },
      async (text: string) => text,
      [],
      [graph as any],
      '/root/index.zlt'
    );

    const node: any = { type: 'DoubleBracketBlock', blockType: 'filetree', attributes: {} };
    const html = await visitorWithGraph.visitDoubleBracketBlock(node);

    expect(html).toContain('zolt-filetree');
    expect(html).toContain('Page 1');
  });

  test('should render filetree-nav with previous/next links', async () => {
    const graph = [
      { path: 'index.zlt', absPath: '/root/index.zlt', title: 'Home', children: [] },
      { path: 'page1.zlt', absPath: '/root/page1.zlt', title: 'Page 1', children: [] },
      { path: 'page2.zlt', absPath: '/root/page2.zlt', title: 'Page 2', children: [] },
    ];

    const visitorWithGraph = new SpecialBlockVisitor(
      async () => '',
      async () => '',
      () => '',
      { getVariable: (name: string) => (name === 'lang' ? 'en' : null) },
      async (text: string) => text,
      [],
      graph as any,
      '/root/page1.zlt'
    );

    const node: any = { type: 'DoubleBracketBlock', blockType: 'filetree-nav', attributes: {} };
    const html = await visitorWithGraph.visitDoubleBracketBlock(node);

    expect(html).toContain('filetree-nav');
    expect(html).toContain('zolt-nav-link prev');
    expect(html).toContain('zolt-nav-link next');
    expect(html).toContain('href="index.html"');
    expect(html).toContain('href="page2.html"');
    expect(html).toContain('Home');
    expect(html).toContain('Page 2');
    expect(html).toContain('Previous');
    expect(html).toContain('Next');
  });

  test('should respect lang variable for filetree-nav', async () => {
    const graph = [
      { path: 'index.zlt', absPath: '/root/index.zlt', title: 'Home', children: [] },
      { path: 'page1.zlt', absPath: '/root/page1.zlt', title: 'Page 1', children: [] },
    ];

    const visitorFr = new SpecialBlockVisitor(
      async () => '',
      async () => '',
      () => '',
      { getVariable: (name: string) => (name === 'lang' ? 'fr' : null) },
      async (text: string) => text,
      [],
      graph as any,
      '/root/page1.zlt'
    );

    const node: any = { type: 'DoubleBracketBlock', blockType: 'filetree-nav', attributes: {} };
    const html = await visitorFr.visitDoubleBracketBlock(node);

    expect(html).toContain('Précédent');
    expect(html).not.toContain('Previous');
  });

  test('should handle nested nodes in filetree-nav', async () => {
    const graph = [
      {
        path: 'index.zlt',
        absPath: '/root/index.zlt',
        title: 'Home',
        children: [{ path: 'sub/page1.zlt', absPath: '/root/sub/page1.zlt', title: 'Sub 1', children: [] }],
      },
    ];

    const visitorWithGraph = new SpecialBlockVisitor(
      async () => '',
      async () => '',
      () => '',
      { getVariable: () => null },
      async (text: string) => text,
      [],
      graph as any,
      '/root/sub/page1.zlt'
    );

    const node: any = { type: 'DoubleBracketBlock', blockType: 'filetree-nav', attributes: {} };
    const html = await visitorWithGraph.visitDoubleBracketBlock(node);

    expect(html).toContain('zolt-nav-link prev');
    expect(html).toContain('href="../index.html"');
    expect(html).toContain('Home');
  });

  test('should reset state correctly', () => {
    visitor.hasSidebar = true;
    visitor.sidebarSide = 'right';
    visitor.reset();
    expect(visitor.hasSidebar).toBe(false);
    expect(visitor.sidebarSide as any).toBe('left');
  });

  test('should render column with width and flex: none', async () => {
    const { AttributeRenderer } = await import('../utils/attribute-renderer');
    const { ExpressionEvaluator } = await import('../../evaluator/expression-evaluator');
    const renderer = new AttributeRenderer(new ExpressionEvaluator());

    const visitorWithRenderer = new SpecialBlockVisitor(
      async () => '',
      async () => '',
      (attrs) => renderer.renderAllAttributes(attrs),
      { getVariable: () => null },
      async (text: string) => text,
      []
    );

    const node: TripleColonBlockNode = {
      type: 'TripleColonBlock',
      blockType: 'column',
      children: [],
      attributes: { width: '70%' },
    };

    const html = await visitorWithRenderer.visitTripleColonBlock(node);
    expect(html).toContain('style="flex: none; width: calc(70% - (var(--zolt-column-gap, 1.5rem) * 0.300))"');
  });

  test('should render columns with cols attribute as style variable', async () => {
    const { AttributeRenderer } = await import('../utils/attribute-renderer');
    const { ExpressionEvaluator } = await import('../../evaluator/expression-evaluator');
    const renderer = new AttributeRenderer(new ExpressionEvaluator());

    const visitorWithRenderer = new SpecialBlockVisitor(
      async () => '',
      async () => '',
      (attrs) => renderer.renderAllAttributes(attrs),
      { getVariable: () => null },
      async (text: string) => text,
      []
    );

    const node: TripleColonBlockNode = {
      type: 'TripleColonBlock',
      blockType: 'columns',
      children: [],
      attributes: { cols: '3' },
    };

    const html = await visitorWithRenderer.visitTripleColonBlock(node);
    expect(html).toContain('style="--zolt-cols: 3"');
  });
});
