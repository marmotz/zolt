import { beforeEach, describe, expect, test } from 'bun:test';
import { ASTNode, TripleColonBlockNode } from '../../../parser/types';
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

    expect(await visitor.visitTripleColonBlock(header)).toContain('class="zolt-sidebar-header"');
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
      graph,
      '/root/index.zlt'
    );

    const node: any = { type: 'DoubleBracketBlock', blockType: 'filetree', attributes: {} };
    const html = await visitorWithGraph.visitDoubleBracketBlock(node);

    expect(html).toContain('zolt-filetree');
    expect(html).toContain('Home');
    expect(html).toContain('Page 1');
    expect(html).toContain('class="active"');
  });

  test('should reset state correctly', () => {
    visitor.hasSidebar = true;
    visitor.sidebarSide = 'right';
    visitor.reset();
    expect(visitor.hasSidebar).toBe(false);
    expect(visitor.sidebarSide).toBe('left');
  });
});
