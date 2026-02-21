# 📘 Zolt

*Zolt : The high-voltage successor to Markdown*

![Zolt Version](https://img.shields.io/badge/version-0.2-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-draft-orange)

**Zolt** is a modern markup language that combines the simplicity of Markdown with the power of professional
documentation features. Write in plain text, publish anywhere.

---

## ✨ Features

### 🎯 Core Features

- **📝 Simple Syntax** - Write in plain text, readable by anyone
- **🎨 Rich Formatting** - Bold, italic, underline, strikethrough, highlights
- **🔗 Advanced Links** - References, attributes, automatic linking
- **📊 Tables** - Advanced tables with merged cells
- **🖼️ Rich Media** - Images, videos, audio, embeds
- **💻 Code Blocks** - Syntax highlighting with attributes

### 🚀 Advanced Features

- **🔄 Variables** - Reusable content variables
- **🔢 Calculations** - Built-in math with namespaces (Math, List, String)
- **📋 Lists** - Bullets, numbers, tasks, definitions
- **🗂️ TOC** - Automatic table of contents
- **📑 Footnotes** - Reference-style footnotes
- **🎛️ Components** - Accordions, tabs, columns
- **📈 Charts** - Native charts (line, bar, pie, area)
- **🔄 Loops** - Iterate over data structures
- **📅 Dates** - Automatic timestamps
- **🏷️ Metadata** - YAML frontmatter support
- **🎨 Styling** - Universal attribute system `{}`

### 🌟 Unique to Zolt

- **Inline styling** - `||text||{attr}` for styled spans
- **Technical indentation** - `&` for code blocks vs `>` for quotes
- **Numbered headings** - Automatic section numbering
- **Smart escaping** - Universal `\` for all special characters
- **Abbreviations** - Tooltip abbreviations
- **Comments** - Both block `:::comment` and inline `%% %%`

---

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
bun install

# Build the standalone executable
bun run build

# Run the CLI
./dist/vibe
```

### Your First Document

Create `hello.zlt`:

```vibe
---
title: "My First Zolt Document"
author: "Your Name"
date: {$created}
---

# Welcome to Zolt!

This is **bold**, //italics//, and ||highlighted||{background=yellow}.

## Features

- Easy to write
- Powerful features
- Beautiful output

:::details [Learn More]
Zolt combines Markdown simplicity with professional features!
:::

**Created:** {$created}
```

### CLI Commands

```bash
# Lint a .zlt file (analyze and report errors)
vibe lint examples/abbreviations.zlt

# Watch a file for changes and re-lint
vibe lint examples/abbreviations.zlt --watch

# Build to HTML/PDF
vibe build examples/abbreviations.zlt -o output.html
```

---

## 🛠️ CLI Commands

### `vibe lint <file>`

Analyze a `.zlt` file and report errors and warnings.

```bash
vibe lint examples/abbreviations.zlt
```

**Options:**

- `-w, --watch`: Watch the file for changes and re-run linting

**Example:**

```bash
vibe lint examples/abbreviations.zlt --watch
```

### `vibe build <file>`

Build a `.zlt` file to HTML (with embedded CSS) or PDF.

```bash
vibe build examples/abbreviations.zlt
```

**Options:**

- `-o, --output <file>`: Output file path (default: same name with .html extension)
- `-w, --watch`: Watch the file for changes and re-build automatically

**Examples:**

```bash
# Build to HTML
vibe build examples/abbreviations.zlt -o output.html

# Build with watch mode
vibe build examples/abbreviations.zlt --watch
```

**Features:**

- ✅ HTML generation with embedded CSS
- ✅ Text formatting (bold, italic, underline, etc.)
- ✅ Abbreviations with tooltips
- ✅ Headings, lists, tables
- ✅ Task lists with checkboxes
- ✅ Responsive design
- ⏳ PDF generation (coming soon)

---

## 📖 Documentation

### Specification

The complete Zolt v0.2 specification is available in [spec.md](spec.md).

### Examples

Check the [`examples/`](examples/) directory for comprehensive examples:

| File                                            | Description                                           |
|-------------------------------------------------|-------------------------------------------------------|
| [lists.zlt](examples/lists.zlt)                 | All list types (bullets, numbers, tasks, definitions) |
| [links.zlt](examples/links.zlt)                 | Links, references, and attributes                     |
| [quotes.zlt](examples/quotes.zlt)               | Blockquotes and citations                             |
| [indentation.zlt](examples/indentation.zlt)     | Technical indentation                                 |
| [separators.zlt](examples/separators.zlt)       | Horizontal rules                                      |
| [inline-style.zlt](examples/inline-style.zlt)   | Inline text styling                                   |
| [escaping.zlt](examples/escaping.zlt)           | Character escaping                                    |
| [details.zlt](examples/details.zlt)             | Collapsible accordions                                |
| [tabs.zlt](examples/tabs.zlt)                   | Tabbed navigation                                     |
| [columns.zlt](examples/columns.zlt)             | Multi-column layouts                                  |
| [footnotes.zlt](examples/footnotes.zlt)         | Footnotes and references                              |
| [frontmatter.zlt](examples/frontmatter.zlt)     | YAML metadata                                         |
| [dates.zlt](examples/dates.zlt)                 | Automatic dates                                       |
| [abbreviations.zlt](examples/abbreviations.zlt) | Abbreviations with tooltips                           |
| [toc.zlt](examples/toc.zlt)                     | Table of contents                                     |
| [calculations.zlt](examples/calculations.zlt)   | Math and namespaces                                   |
| [loops.zlt](examples/loops.zlt)                 | Data iteration                                        |
| [charts.zlt](examples/charts.zlt)               | Charts and graphs                                     |
| [complete.zlt](examples/complete.zlt)           | Complete example with all features                    |

---

## 🎯 Key Syntax Examples

### Text Formatting

```vibe
**Bold text** and //italics//
__Underline__ and ~~strikethrough==
^{Superscript} and _{subscripts}
==Highlighted text==
```

### Universal Attributes

```vibe
# Title {#intro}
Text{color=blue} with styles
![Image](img.jpg){width=100% align=center}
```

### Variables & Calculations

```vibe
$version = "2.0"
$price = 99

Version {$version}
Price with tax: {{ $price * 1.2 }}
Average: {{ Math.round(List.avg($scores)) }}
```

### Dynamic Content

```vibe
$products = [{name: "A", price: 10}, {name: "B", price: 20}]

:::foreach {$products as $product}
- {$product.name}: ${{$product.price}}
:::
```

### Interactive Components

```vibe
:::details [Click to expand]
Hidden content here...
:::

:::tabs
:::tab [JavaScript]
console.log("Hello");
:::
:::tab [Python]
print("Hello")
:::
:::
```

---

## 📂 Project Structure

```
vibe/
├── spec.md              # Complete language specification
├── README.md            # This file
├── package.json         # Project dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── examples/            # Example files
│   ├── lists.zlt
│   ├── links.zlt
│   ├── quotes.zlt
│   ├── abbreviations.zlt
│   ├── ... (21 example files)
│   └── complete.zlt    # All features in one file
├── src/                 # Source code
│   ├── cli.ts          # CLI entry point
│   ├── linter.ts       # Linter logic
│   ├── watcher.ts      # File watcher
│   ├── types.ts        # TypeScript types
│   └── parsers/        # Feature-specific parsers
│       └── abbreviations.ts
├── dist/               # Compiled output (generated)
└── tests/              # Test files
```

---

## 🔄 Migration from Markdown

Zolt follows **standard Markdown conventions** for paragraph formatting:

- **Single line breaks**: Lines separated by a single newline are joined into one paragraph
  ```
  Line 1
  Line 2
  → <p>Line 1 Line 2</p>
  ```

- **Multiple line breaks**: Blank lines separate paragraphs
  ```
  Paragraph 1

  Paragraph 2
  → <p>Paragraph 1</p><p>Paragraph 2</p>
  ```

Your existing `.md` files will work correctly in Zolt.

### Key Syntax Changes

| Markdown        | Zolt                             |
|-----------------|----------------------------------|
| `*italic*`      | `//italic//`                     |
| `<u>text</u>`   | `__text__`                       |
| `> [!NOTE]`     | `:::note`                        |
| No variables    | `$var = "val"`                   |
| No calculations | `{{ 10 + 5 }}`                   |
| Limited tables  | `[[table]]` with colspan/rowspan |

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- Inspired by Markdown, LaTeX, and modern documentation tools
- Built for technical writers, developers, and content creators
- Designed with ❤️ for the community

---

## 📞 Support

- **Documentation:** [spec.md](spec.md)
- **Examples:** [`examples/`](examples/)
- **Issues:** [GitHub Issues](https://github.com/marmotz/vibe/issues)
- **Discussions:** [GitHub Discussions](https://github.com/marmotz/vibe/discussions)

---

**Zolt** • *Markdown with a better vibe.*

For detailed specifications, see [spec.md](spec.md).
