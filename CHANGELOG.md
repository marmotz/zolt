# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unrealeased]

### Added

- Implemented block-level layouts (`:::layout [path]`) with robust testing and documentation.
- Added support for inline includes (`{{include path}}`) anywhere within a line.

### Fixed

- Removce extra spaces were introduced after `InlineStyle` elements (e.g., `</span> olt` instead of `</span>olt`).

## [0.2.0] - 2026-03-03

### Added

- Roadmap documentation (`docs/roadmap.zlt`) outlining upcoming features.
- Abbreviations and footnotes support in the parser.
- `Date.buildTime()` function for consistent build timestamps across the codebase.
- Support for mixed numbering styles in TOC and filetrees via comma-separated lists.
- Improved evaluation support for conditionals (`:::if`) and loops (`:::foreach`).

### Changed

- Refactored syntax components for better modularity and formatting logic.
- Switched project configuration files to `zolt.yaml`.
- Standardized terminology across codebase: "numbering" replaced with "numbered" for consistency.

## [0.1.1] - 2026-03-02

### Added

- Build step for CLI in the GitHub publish workflow.

### Changed

- Refactored dev server: replaced Bun with Node.js and switched WebSocket to SSE for better reliability.

### Fixed

- Updated README and package metadata for clearer installation instructions.

## [0.1.0] - 2026-03-01

### Added

- Initial public release of Zolt.
- Core parser with support for headings, lists, tables, and blockquotes.
- Advanced components: tabs, details, columns, and triple-colon blocks.
- Math support via KaTeX.
- Diagram support via Mermaid.js.
- Chart support via Chart.js.
- Project-wide variables and file metadata evaluation.
- CLI for building and serving Zolt projects.
- VS Code extension with syntax highlighting.
