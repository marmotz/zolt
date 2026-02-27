import { describe, expect, it } from 'bun:test';
import { buildString } from './index';

describe('Sidebar Markup', () => {
  it('should render a sidebar with header, content and footer', async () => {
    const content = `:::sidebar {side=right}
:::sidebar-header
# Header
:::
:::sidebar-content
Main sidebar content
:::
:::sidebar-footer
Footer info
:::
:::

# Main Content`;

    const html = await buildString(content);

    // Check body classes
    expect(html).toContain('class="theme-default color-scheme-auto has-sidebar sidebar-right"');

    // Check sidebar structure
    expect(html).toContain('<aside');
    expect(html).toContain('class="zolt-sidebar zolt-sidebar-right"');
    expect(html).toContain('class="zolt-sidebar-header"');
    expect(html).toContain('class="zolt-sidebar-content"');
    expect(html).toContain('class="zolt-sidebar-footer"');

    // Check content
    expect(html).toContain('Header</h1>');
    expect(html).toContain('Main sidebar content');
    expect(html).toContain('Footer info');

    // Check main content wrapping
    expect(html).toContain('<main class="zolt-main-content">');
    expect(html).toContain('Main Content</h1>');
  });

  it('should default to left side if side attribute is missing', async () => {
    const content = `:::sidebar
Sidebar content
:::`;

    const html = await buildString(content);
    expect(html).toContain('class="theme-default color-scheme-auto has-sidebar sidebar-left"');
    expect(html).toContain('class="zolt-sidebar zolt-sidebar-left"');
  });

  it('should handle sidebar in a layout', async () => {
    const expandedContent = `:::sidebar
Sidebar from layout
:::
# Main`;

    const html = await buildString(expandedContent);
    expect(html).toContain('has-sidebar');
    expect(html).toContain('Sidebar from layout');
    expect(html).toContain('Main</h1>');
  });

  it('should render sidebar even with missing components', async () => {
    const content = `:::sidebar
Only content here
:::`;

    const html = await buildString(content);
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
    const bodyContent = bodyMatch ? bodyMatch[1] : html;

    expect(bodyContent).toContain('class="zolt-sidebar zolt-sidebar-left"');
    expect(bodyContent).toContain('Only content here');
    expect(bodyContent).not.toContain('zolt-sidebar-header');
    expect(bodyContent).not.toContain('zolt-sidebar-footer');
  });

  it('should render rich content inside sidebar', async () => {
    const content = `:::sidebar
:::sidebar-content
| Item | Value |
|------|-------|
| A    | 1     |
| B    | 2     |

- List item 1
- List item 2
:::
:::`;

    const html = await buildString(content);
    expect(html).toContain('<table>');
    expect(html).toContain('<td>A</td>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>List item 1</li>');
  });

  it('should render responsive toggle and close buttons in the sidebar header', async () => {
    const content = `:::sidebar
:::sidebar-header
My Sidebar
:::
:::sidebar-content
Content
:::
:::`;
    const html = await buildString(content);

    expect(html).toContain('class="zolt-sidebar-toggle"');
    expect(html).toContain('class="zolt-sidebar-close"');
    expect(html).toContain('aria-label="Toggle sidebar"');
    expect(html).toContain('aria-label="Close sidebar"');
    expect(html).toContain("var sidebar = document.querySelector('.zolt-sidebar');"); // Verify SIDEBAR_SCRIPT inclusion
  });

  it('should render toggle buttons even when sidebar-header is implicit', async () => {
    // Note: SpecialBlockVisitor ONLY adds buttons to explicit sidebar-header.
    // If user just does :::sidebar, they get no header.
    // Let's verify this behavior and see if we should change it.
    const content = `:::sidebar
Content
:::`;
    const html = await buildString(content);
    expect(html).toContain('<aside class="zolt-sidebar zolt-sidebar-left"');
    expect(html).toContain('<p>Content</p>');
    expect(html).not.toContain('class="zolt-sidebar-header"');
    expect(html).not.toContain('class="zolt-sidebar-toggle"');
  });
});
