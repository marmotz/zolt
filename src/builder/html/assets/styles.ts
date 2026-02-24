export const DEFAULT_CSS = `
  * {
    box-sizing: border-box;
  }
  html {
    scroll-behavior: smooth;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
    font-size: 16px;
    line-height: 1.6;
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    color: #333;
    background: #fafafa;
  }
  h1, h2, h3, h4, h5, h6 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-weight: 600;
    line-height: 1.3;
    color: #111;
  }
  h1 { font-size: 2rem; border-bottom: 2px solid #e0e0e0; padding-bottom: 0.3em; }
  h2 { font-size: 1.5rem; border-bottom: 1px solid #e0e0e0; padding-bottom: 0.2em; }
  h3 { font-size: 1.25rem; }
  h4 { font-size: 1rem; }
  ul, ol, dl { padding-left: 2rem; margin: 1em 0; }
  ul ul, ol ol, ul ol, ol ul {  margin: 0; }
  li, dt, dd { margin: 0.25em 0; }
  dt { font-weight: bold; margin-top: 1em; }
  dd { margin-left: 1.5rem; }
  a { color: #0066cc; text-decoration: none; }
  a:hover { text-decoration: underline; }
  blockquote {
    margin: 1em 0;
    padding: 0.5em 1rem;
    border-left: 4px solid #e0e0e0;
    background: #f5f5f5;
    color: #555;
  }
  code {
    font-family: 'SF Mono', Monaco, Consolas, monospace;
    font-size: 0.9em;
    background: #f0f0f0;
    padding: 0.2em 0.4em;
    border-radius: 3px;
  }
  pre {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 1rem;
    border-radius: 6px;
    overflow-x: auto;
  }
  pre code { background: none; padding: 0; color: inherit; }
  hr { border: none; border-top: 2px solid #e0e0e0; margin: 2rem 0; }
  input[type="checkbox"] { margin-right: 0.5em; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
  }
  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e0e0e0;
  }
  th {
    background: #f8f8f8;
    font-weight: 600;
  }
  abbr {
    color: #7c3aed;
    text-decoration: underline dotted;
    text-decoration-color: #c4b5fd;
    text-underline-offset: 2px;
    cursor: help;
    font-weight: 500;
  }
  abbr:hover {
    color: #6d28d9;
    text-decoration-color: #a78bfa;
  }
  .columns {
    display: flex;
    gap: var(--zolt-column-gap, 1.5rem);
    margin: 1.5rem 0;
    flex-wrap: wrap;
  }
  .columns[style*="--zolt-cols"] {
    display: grid;
    grid-template-columns: repeat(var(--zolt-cols, 1), 1fr);
  }
  .column {
    flex: 1 1 0;
    min-width: 0;
  }
  .column[style*="width"] {
    flex: 0 0 auto;
  }
  .triple-colon-block.info, 
  .triple-colon-block.warning, 
  .triple-colon-block.error, 
  .triple-colon-block.success, 
  .triple-colon-block.note, 
  .triple-colon-block.abstract {
    padding: 1rem;
    margin: 1rem 0;
    border-left: 4px solid #ccc;
    background: #f9f9f9;
  }
  .triple-colon-block.info { border-left-color: #3b82f6; background: #eff6ff; }
  .triple-colon-block.warning { border-left-color: #f59e0b; background: #fffbeb; }
  .triple-colon-block.error { border-left-color: #ef4444; background: #fef2f2; }
  .triple-colon-block.success { border-left-color: #10b981; background: #ecfdf5; }
  .triple-colon-block.note { border-left-color: #6366f1; background: #eef2ff; }
  .triple-colon-block.abstract { border-left-color: #6b7280; background: #f3f4f6; }
  
  .block-title {
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  
  details.triple-colon-block {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    margin: 1rem 0;
  }
  summary {
    padding: 0.5rem 1rem;
    font-weight: bold;
    cursor: pointer;
    background: #f5f5f5;
  }
  .details-content {
    padding: 1rem;
  }
  @media (max-width: 768px) {
    .columns[style*="--zolt-cols"] {
      grid-template-columns: 1fr;
    }
    .column {
      flex: 1 1 100% !important;
      width: 100% !important;
    }
  }
  .zolt-tabs {
    margin: 1rem 0;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    overflow: hidden;
  }
  .zolt-tab-list {
    display: flex;
    background: #f5f5f5;
    border-bottom: 1px solid #e0e0e0;
    overflow-x: auto;
  }
  .zolt-tab-button {
    padding: 0.75rem 1.25rem;
    border: none;
    background: transparent;
    cursor: pointer;
    font-size: 0.95em;
    font-weight: 500;
    color: #666;
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
    white-space: nowrap;
  }
  .zolt-tab-button:hover {
    color: #333;
    background: #eee;
  }
  .zolt-tab-button.active {
    color: #0066cc;
    border-bottom-color: #0066cc;
    background: #fff;
  }
  .zolt-tab-panel {
    padding: 1rem;
    display: none;
  }
  .zolt-tab-panel.active {
    display: block;
  }
  .zolt-toc {
    margin: 1rem 0;
    padding: 1rem;
    background: #f9f9f9;
    border-radius: 6px;
    border: 1px solid #e0e0e0;
  }
  .zolt-toc ul {
    list-style: none;
    padding-left: 1.5rem;
    margin: 0.25rem 0;
  }
  .zolt-toc > ul {
    padding-left: 0;
  }
  .zolt-toc li {
    margin: 0.25rem 0;
  }
  .zolt-toc a {
    color: #333;
    text-decoration: none;
  }
  .zolt-toc a:hover {
    color: #0066cc;
    text-decoration: underline;
  }
  .zolt-toc-number {
    margin-right: 0.5rem;
    color: #666;
    font-size: 0.9em;
  }
  :target {
    scroll-margin-top: 2rem;
    animation: zolt-anchor-highlight 3s ease-out;
  }
  @keyframes zolt-anchor-highlight {
    0% { background-color: #fffdba; }
    80% { background-color: #fffdba; }
    100% { background-color: transparent; }
  }
`.trim();
