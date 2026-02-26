export const BASE_CSS = `
  * {
    box-sizing: border-box;
  }
  html {
    scroll-behavior: smooth;
  }
  body {
    font-family: var(--zlt-font-body, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    font-size: 16px;
    line-height: 1.6;
    max-width: var(--zlt-max-width, 800px);
    margin: 0 auto;
    padding: 2rem;
    color: var(--zlt-color-text);
    background: var(--zlt-color-bg);
    transition: background-color 0.3s, color 0.3s;
  }
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--zlt-font-headings, inherit);
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-weight: 600;
    line-height: 1.3;
    color: var(--zlt-color-heading);
  }
  h1 { font-size: 2.2rem; border-bottom: var(--zlt-h1-border, 2px solid var(--zlt-color-border)); padding-bottom: 0.3em; }
  h2 { font-size: 1.7rem; border-bottom: var(--zlt-h2-border, 1px solid var(--zlt-color-border)); padding-bottom: 0.2em; }
  h3 { font-size: 1.4rem; }
  h4 { font-size: 1.15rem; }
  ul, ol, dl { padding-left: 2rem; margin: 1em 0; }
  ul.zolt-list-plain { list-style: none; padding-left: 0; margin-left: 0; margin-right: 0; }
  li, dt, dd { margin: 0.4em 0; }
  dt { font-weight: bold; margin-top: 1em; }
  dd { margin-left: 1.5rem; }
  a { color: var(--zlt-color-link); text-decoration: none; }
  a:hover { text-decoration: underline; }
  img {
    max-width: 100%;
    height: auto;
  }
  blockquote {
    margin: 1.5em 0;
    padding: 0.5em 1.2rem;
    border-left: 4px solid var(--zlt-color-quote-border);
    background: var(--zlt-color-quote-bg);
    color: var(--zlt-color-quote-text);
    font-style: var(--zlt-quote-font-style, normal);
  }
  code {
    font-family: var(--zlt-font-mono, 'SF Mono', Monaco, Consolas, monospace);
    font-size: 0.9em;
    background: var(--zlt-color-code-bg);
    color: var(--zlt-color-code-text);
    padding: 0.2em 0.4em;
    border-radius: 4px;
  }
  pre {
    background: var(--zlt-color-pre-bg);
    color: var(--zlt-color-pre-text);
    padding: 1.2rem;
    border-radius: 8px;
    overflow-x: auto;
    border: 1px solid var(--zlt-color-pre-border, transparent);
  }
  pre code { background: none; padding: 0; color: inherit; }
  hr { border: none; border-top: 2px solid var(--zlt-color-border); margin: 3rem 0; }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 2rem 0;
  }
  th, td {
    padding: 0.85rem;
    text-align: left;
    border-bottom: 1px solid var(--zlt-color-border);
  }
  th {
    background: var(--zlt-color-table-header-bg);
    font-weight: 600;
    color: var(--zlt-color-heading);
  }
  abbr {
    color: var(--zlt-color-primary);
    text-decoration: underline dotted;
    text-decoration-color: var(--zlt-color-primary-soft);
    text-underline-offset: 3px;
    cursor: help;
  }
  
  .columns {
    display: flex;
    gap: 1.5rem;
    margin: 2rem 0;
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
  
  .triple-colon-block {
    padding: 1.2rem;
    margin: 1.5rem 0;
    background: var(--zlt-color-block-bg);
  }
  .triple-colon-block.columns, .triple-colon-block.column {
    background: var(--zlt-color-bg);
  }
  .triple-colon-block.column {
    border-left: 1px solid var(--zlt-color-border);
    margin: 0;
  }
  .triple-colon-block.column:first-child {
    border-width: 0;
  }
  .triple-colon-block.info { border-left-color: #3b82f6; background: var(--zlt-color-info-bg); }
  .triple-colon-block.warning { border-left-color: #f59e0b; background: var(--zlt-color-warning-bg); }
  .triple-colon-block.error { border-left-color: #ef4444; background: var(--zlt-color-error-bg); }
  .triple-colon-block.success { border-left-color: #10b981; background: var(--zlt-color-success-bg); }
  
  .block-title { font-weight: bold; margin-bottom: 0.6rem; color: var(--zlt-color-heading); }
  
  details.triple-colon-block {
    border: 1px solid var(--zlt-color-border);
    border-left-width: 1px;
    padding: 0;
  }
  summary {
    padding: 0.8rem 1.2rem;
    font-weight: bold;
    cursor: pointer;
    background: var(--zlt-color-block-bg);
    outline: none;
  }
  .details-content { padding: 1.2rem; border-top: 1px solid var(--zlt-color-border); }
  
  .zolt-tabs { margin: 2rem 0; border: 1px solid var(--zlt-color-border); border-radius: 8px; overflow: hidden; }
  .zolt-tab-list { display: flex; background: var(--zlt-color-block-bg); border-bottom: 1px solid var(--zlt-color-border); }
  .zolt-tab-button {
    padding: 0.8rem 1.5rem;
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--zlt-color-text-soft);
    border-bottom: 2px solid transparent;
  }
  .zolt-tab-button.active {
    color: var(--zlt-color-primary);
    border-bottom-color: var(--zlt-color-primary);
    background: var(--zlt-color-bg);
  }
  .zolt-tab-panel { display: none; padding: 1.2rem 1.5rem; }
  .zolt-tab-panel.active { display: block; }
  
  .zolt-toc {
    margin: 2rem 0;
    padding: 1.5rem;
    background: var(--zlt-color-block-bg);
    border-radius: 8px;
    border: 1px solid var(--zlt-color-border);
  }
  .zolt-toc ul { list-style: none; padding-left: 1.2rem; }
  .zolt-toc a { color: var(--zlt-color-text); }
  .zolt-toc a:hover { color: var(--zlt-color-primary); }
  .zolt-toc-number { margin-right: 0.5rem; }
  .zolt-heading-number { margin-right: 0.5rem; }

  /* --- FILETREE --- */
  .zolt-filetree ul {
    list-style: none;
    padding-left: 1.2rem;
    margin: 0.5rem 0;
  }
  
  .zolt-filetree > ul {
    padding-left: 0;
  }
  
  .zolt-filetree li {
    margin: 0.2rem 0;
    line-height: 1.4;
  }
  
  .zolt-filetree a {
    color: var(--zlt-color-text);
    text-decoration: none;
    display: block;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    transition: background 0.2s;
  }
  
  .zolt-filetree a:hover {
    background: var(--zlt-color-primary-soft);
    color: var(--zlt-color-primary);
  }
  
  .zolt-filetree li.active > a {
    background: var(--zlt-color-primary);
    color: white;
    font-weight: bold;
  }
  
  .zolt-filetree-error {
    color: var(--zlt-color-error);
    font-style: italic;
    font-size: 0.9em;
    padding: 1rem;
    border: 1px dashed var(--zlt-color-error);
    border-radius: 4px;
  }

  .zolt-chart {
    margin: 2.5rem 0;
    background: var(--zlt-color-bg);
    padding: 1.5rem;
    border-radius: 12px;
    border: 1px solid var(--zlt-color-border);
    box-shadow: 0 4px 12px var(--zlt-color-shadow);
  }

  .zolt-mermaid {
    margin: 2.5rem 0;
    display: flex;
    justify-content: center;
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    border: 1px solid var(--zlt-color-border);
  }
  
  .zolt-video,
  .zolt-embed {
    width: 100%;
    max-width: 100%;
    aspect-ratio: 16/9;
  }

  body.color-scheme-dark .zolt-mermaid,
  @media (prefers-color-scheme: dark) {
    body:not(.color-scheme-light) .zolt-mermaid {
      background: #1a202c;
    }
  }

  :target {
    scroll-margin-top: 2rem;
    background-color: var(--zlt-color-highlight-bg);
    animation: zolt-anchor-highlight 3s ease-out;
  }

  @keyframes zolt-anchor-highlight {
    0% { background-color: #fffdba; }
    80% { background-color: #fffdba; }
    100% { background-color: transparent; }
  }

  /* --- SIDEBAR --- */
  body.has-sidebar {
    max-width: none;
    margin: 0;
    display: flex;
    padding: 0;
    min-height: 100vh;
  }
  
  body.sidebar-left { flex-direction: row; }
  body.sidebar-right { flex-direction: row-reverse; }

  .zolt-sidebar {
    width: var(--zlt-sidebar-width, 280px);
    height: 100vh;
    position: sticky;
    top: 0;
    background: var(--zlt-color-block-bg);
    border-right: 1px solid var(--zlt-color-border);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    z-index: 100;
  }
  
  body.sidebar-right .zolt-sidebar {
    border-right: none;
    border-left: 1px solid var(--zlt-color-border);
  }

  .zolt-sidebar-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--zlt-color-border-soft, var(--zlt-color-border));
    flex-shrink: 0;
  }
  
  .zolt-sidebar-footer {
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--zlt-color-border-soft, var(--zlt-color-border));
    flex-shrink: 0;
    font-size: 0.9em;
    color: var(--zlt-color-text-soft);
  }
  
  .zolt-sidebar-content {
    padding: 1.5rem;
    flex-grow: 1;
    overflow-y: auto;
  }

  .zolt-sidebar img {
    max-width: 100%;
    height: auto;
  }

  .zolt-main-content {
    flex-grow: 1;
    padding: 2rem;
    overflow-y: auto;
    width: 100%;
  }

  .zolt-content-container {
    max-width: var(--zlt-max-width, 800px);
    margin: 0 auto;
  }

  @media (max-width: 768px) {
    body.has-sidebar {
      flex-direction: column;
    }
    .zolt-sidebar {
      width: 100%;
      height: auto;
      position: relative;
      border-right: none;
      border-bottom: 1px solid var(--zlt-color-border);
    }
    body.sidebar-right .zolt-sidebar {
      border-left: none;
    }
  }
`;

export const THEMES_CSS = `
  /* --- THEME: DEFAULT --- */
  body.theme-default, body:not([class*="theme-"]) {
    --zlt-color-primary: #0066cc;
    --zlt-color-primary-soft: rgba(0, 102, 204, 0.2);
    --zlt-color-bg: #ffffff;
    --zlt-color-text: #333333;
    --zlt-color-text-soft: #666666;
    --zlt-color-heading: #111111;
    --zlt-color-border: #e0e0e0;
    --zlt-color-link: #0066cc;
    --zlt-color-quote-bg: #f9f9f9;
    --zlt-color-quote-border: #dddddd;
    --zlt-color-quote-text: #555555;
    --zlt-color-code-bg: #f3f4f6;
    --zlt-color-code-text: #d91e18;
    --zlt-color-pre-bg: #1e1e1e;
    --zlt-color-pre-text: #d4d4d4;
    --zlt-color-block-bg: #f3f4f6;
    --zlt-color-info-bg: #eff6ff;
    --zlt-color-warning-bg: #fffbeb;
    --zlt-color-error-bg: #fef2f2;
    --zlt-color-success-bg: #ecfdf5;
    --zlt-color-table-header-bg: #f8f8f8;
    --zlt-color-shadow: rgba(0,0,0,0.05);
    --zlt-color-highlight-bg: #fffde7;
  }

  /* Default Dark (Forced & Auto) */
  body.theme-default.color-scheme-dark,
  body:not([class*="theme-"]).color-scheme-dark {
    --zlt-color-primary: #3b82f6;
    --zlt-color-bg: #0f172a;
    --zlt-color-text: #e2e8f0;
    --zlt-color-text-soft: #94a3b8;
    --zlt-color-heading: #f8fafc;
    --zlt-color-border: #334155;
    --zlt-color-link: #60a5fa;
    --zlt-color-quote-bg: #1e293b;
    --zlt-color-quote-border: #3b82f6;
    --zlt-color-quote-text: #94a3b8;
    --zlt-color-code-bg: #1e293b;
    --zlt-color-code-text: #f472b6;
    --zlt-color-block-bg: #1e293b;
    --zlt-color-info-bg: #1e3a8a;
    --zlt-color-warning-bg: #78350f;
    --zlt-color-error-bg: #7f1d1d;
    --zlt-color-success-bg: #064e3b;
    --zlt-color-table-header-bg: #1e293b;
    --zlt-color-shadow: rgba(0,0,0,0.3);
    --zlt-color-highlight-bg: #3e3e10;
  }

  @media (prefers-color-scheme: dark) {
    body.theme-default:not(.color-scheme-light),
    body:not([class*="theme-"]):not(.color-scheme-light) {
      --zlt-color-primary: #3b82f6;
      --zlt-color-bg: #0f172a;
      --zlt-color-text: #e2e8f0;
      --zlt-color-text-soft: #94a3b8;
      --zlt-color-heading: #f8fafc;
      --zlt-color-border: #334155;
      --zlt-color-link: #60a5fa;
      --zlt-color-quote-bg: #1e293b;
      --zlt-color-quote-border: #3b82f6;
      --zlt-color-quote-text: #94a3b8;
      --zlt-color-code-bg: #1e293b;
      --zlt-color-code-text: #f472b6;
      --zlt-color-block-bg: #1e293b;
      --zlt-color-info-bg: #1e3a8a;
      --zlt-color-warning-bg: #78350f;
      --zlt-color-error-bg: #7f1d1d;
      --zlt-color-success-bg: #064e3b;
      --zlt-color-table-header-bg: #1e293b;
      --zlt-color-shadow: rgba(0,0,0,0.3);
      --zlt-color-highlight-bg: #3e3e10;
    }
  }

  /* --- THEME: PROFESSIONAL --- */
  body.theme-professional {
    --zlt-font-headings: 'Georgia', 'Times New Roman', serif;
    --zlt-max-width: 900px;
    --zlt-color-primary: #1a202c;
    --zlt-color-bg: #ffffff;
    --zlt-color-text: #2d3748;
    --zlt-color-heading: #1a202c;
    --zlt-color-border: #cbd5e0;
    --zlt-color-link: #2c5282;
    --zlt-h1-border: none;
    --zlt-h2-border: none;
    --zlt-color-quote-bg: transparent;
    --zlt-color-quote-border: #1a202c;
    --zlt-quote-font-style: italic;
    --zlt-color-block-bg: #edf2f7;
  }

  /* Professional Dark (Forced) */
  body.theme-professional.color-scheme-dark {
    --zlt-color-primary: #f8fafc;
    --zlt-color-bg: #1e293b;
    --zlt-color-text: #cbd5e0;
    --zlt-color-heading: #f1f5f9;
    --zlt-color-border: #475569;
    --zlt-color-link: #94a3b8;
    --zlt-color-quote-border: #f8fafc;
    --zlt-color-block-bg: #334155;
    --zlt-color-info-bg: #0c4a6e;
    --zlt-color-warning-bg: #713f12;
    --zlt-color-error-bg: #7f1d1d;
    --zlt-color-success-bg: #064e3b;
    --zlt-color-table-header-bg: #334155;
  }

  @media (prefers-color-scheme: dark) {
    body.theme-professional:not(.color-scheme-light) {
      --zlt-color-primary: #f8fafc;
      --zlt-color-bg: #1e293b;
      --zlt-color-text: #cbd5e0;
      --zlt-color-heading: #f1f5f9;
      --zlt-color-border: #475569;
      --zlt-color-link: #94a3b8;
      --zlt-color-quote-border: #f8fafc;
      --zlt-color-block-bg: #334155;
      --zlt-color-info-bg: #0c4a6e;
      --zlt-color-warning-bg: #713f12;
      --zlt-color-error-bg: #7f1d1d;
      --zlt-color-success-bg: #064e3b;
      --zlt-color-table-header-bg: #334155;
    }
  }

  /* --- THEME: TECHNICAL --- */
  body.theme-technical {
    --zlt-font-headings: var(--zlt-font-mono);
    --zlt-color-primary: #3182ce;
    --zlt-color-bg: #f7fafc;
    --zlt-color-text: #2d3748;
    --zlt-color-heading: #2d3748;
    --zlt-color-border: #e2e8f0;
    --zlt-color-link: #3182ce;
    --zlt-color-pre-border: #3182ce;
    --zlt-color-pre-bg: #000000;
    --zlt-color-pre-text: #48bb78;
    --zlt-color-block-bg: #ebf8ff;
  }

  /* Technical Dark (Forced) */
  body.theme-technical.color-scheme-dark {
    --zlt-color-primary: #4ade80;
    --zlt-color-bg: #000000;
    --zlt-color-text: #c9d1d9;
    --zlt-color-heading: #f0f6fc;
    --zlt-color-border: #30363d;
    --zlt-color-link: #4ade80;
    --zlt-color-pre-border: #4ade80;
    --zlt-color-block-bg: #161b22;
    --zlt-color-info-bg: #0c2d6b;
    --zlt-color-warning-bg: #4d2d00;
    --zlt-color-error-bg: #490202;
    --zlt-color-success-bg: #033a16;
    --zlt-color-table-header-bg: #161b22;
  }

  @media (prefers-color-scheme: dark) {
    body.theme-technical:not(.color-scheme-light) {
      --zlt-color-primary: #4ade80;
      --zlt-color-bg: #000000;
      --zlt-color-text: #c9d1d9;
      --zlt-color-heading: #f0f6fc;
      --zlt-color-border: #30363d;
      --zlt-color-link: #4ade80;
      --zlt-color-pre-border: #4ade80;
      --zlt-color-block-bg: #161b22;
      --zlt-color-info-bg: #0c2d6b;
      --zlt-color-warning-bg: #4d2d00;
      --zlt-color-error-bg: #490202;
      --zlt-color-success-bg: #033a16;
      --zlt-color-table-header-bg: #161b22;
    }
  }

  /* --- THEME: PLAYFUL --- */
  body.theme-playful {
    --zlt-color-primary: #ec4899;
    --zlt-color-bg: #fffafb;
    --zlt-color-text: #4a5568;
    --zlt-color-heading: #da627d;
    --zlt-color-border: #f9a8d4;
    --zlt-color-link: #db2777;
    --zlt-max-width: 750px;
    --zlt-color-block-bg: #fdf2f8;
  }

  /* Playful Dark (Forced) */
  body.theme-playful.color-scheme-dark {
    --zlt-color-primary: #ff71ce;
    --zlt-color-bg: #0f071a;
    --zlt-color-text: #fce7f3;
    --zlt-color-heading: #b967ff;
    --zlt-color-border: #701a75;
    --zlt-color-link: #ff71ce;
    --zlt-color-block-bg: #1a0b2e;
    --zlt-color-info-bg: #1e3a8a;
    --zlt-color-warning-bg: #78350f;
    --zlt-color-error-bg: #7f1d1d;
    --zlt-color-success-bg: #064e3b;
    --zlt-color-table-header-bg: #1a0b2e;
  }

  @media (prefers-color-scheme: dark) {
    body.theme-playful:not(.color-scheme-light) {
      --zlt-color-primary: #ff71ce;
      --zlt-color-bg: #0f071a;
      --zlt-color-text: #fce7f3;
      --zlt-color-heading: #b967ff;
      --zlt-color-border: #701a75;
      --zlt-color-link: #ff71ce;
      --zlt-color-block-bg: #1a0b2e;
      --zlt-color-info-bg: #1e3a8a;
      --zlt-color-warning-bg: #78350f;
      --zlt-color-error-bg: #7f1d1d;
      --zlt-color-success-bg: #064e3b;
      --zlt-color-table-header-bg: #1a0b2e;
    }
  }
`;

export const DEFAULT_CSS = `
${BASE_CSS}
${THEMES_CSS}
`.trim();
