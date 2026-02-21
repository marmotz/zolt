# Zolt Architecture Specification

## Overview

Zolt is a markup language that compiles to multiple output formats (HTML, PDF, etc.). The architecture follows a clear
separation between parsing (input processing) and building (output generation).

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│     zlt     │────▶│    Lexer    │────▶│   Tokens    │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
                    ▼                          ▼                          ▼
             ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
             │   Parser    │           │   Parser    │           │   Parser    │
             │(Recursive   │           │(Recursive   │           │(Future)     │
             │  Descent)   │           │  Descent)   │           │             │
             └─────────────┘           └─────────────┘           └─────────────┘
                    │                          │                          │
                    ▼                          ▼                          ▼
             ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
             │  AST (Nodes)│           │  AST (Nodes)│           │  AST (Nodes)│
             └─────────────┘           └─────────────┘           └─────────────┘
                    │                          │                          │
                    ▼                          ▼                          ▼
             ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
             │HTML Builder │           │ PDF Builder │           │Future Build.│
             └─────────────┘           └─────────────┘           └─────────────┘
                    │                          │                          │
                    ▼                          ▼                          ▼
             ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
             │    html     │           │     pdf     │           │     ...     │
             └─────────────┘           └─────────────┘           └─────────────┘
```

**Key Principle**: Everything is built from scratch - no external lexer/parser libraries. Custom Lexer + Recursive Descent Parser.

---

## 1. CLI Tools

### 1.1 Lint Command

**Purpose**: Analyze one or more .zlt files for errors, warnings, and style issues.

**Interface**:

```
zolt lint <files...> [options]

Options:
  --format <json|text>    Output format (default: text)
  --fix                   Auto-fix fixable issues
```

**Behavior**:

- Parses each file and reports parsing errors
- Validates AST for semantic issues
- Can be extended with rule-based linting
- Does NOT produce any build output

### 1.2 Build Command

**Purpose**: Compile one or more .zlt files to output formats.

**Interface**:

```
zolt build <files...> [options]

Options:
  -o, --output <path>     Output file or directory
  -t, --type <html|pdf>   Output type (default: html)
  -w, --watch             Watch for file changes and rebuild
```

**Behavior**:

- Parses input files and generates output
- For single file: outputs to specified path or stdout
- For multiple files: outputs to directory (preserves structure), copy assets, follow local links to build linked files
- With `--watch`: monitors files (and linked files) and rebuilds on change

---

## 2. JavaScript API

### 2.1 Build from File Path → String

**Function**: `buildFileToString(filePath: string, options?: BuildOptions): Promise<string>`

**Parameters**:

- `filePath`: Absolute or relative path to .zlt file
- `options`: Optional build configuration

**Returns**: Built content as string (HTML code, PDF binary encoded, etc.)

**Example**:

```typescript
import { buildFileToString } from '@zolt/api';

const html = await buildFileToString('document.zlt', { type: 'html' });
console.log(html); // "<!DOCTYPE html>..."
```

### 2.2 Build from File Path → File

**Function**: `buildFile(inputPath: string, outputPath: string, options?: BuildOptions): Promise<void>`

**Parameters**:

- `inputPath`: Source .zlt file
- `outputPath`: Destination file path
- `options`: Optional build configuration

**Example**:

```typescript
import { buildFile } from '@zolt/api';

await buildFile('document.zlt', 'output/document.html', { type: 'html' });
```

### 2.3 Build from String → String

**Function**: `buildString(content: string, options?: BuildOptions): Promise<string>`

**Parameters**:

- `content`: Zolt markup as string
- `options`: Optional build configuration

**Returns**: Built content as string

**Example**:

```typescript
import { buildString } from '@zolt/api';

const html = await buildString('# Hello World\n\nThis is **bold**', { type: 'html' });
```

### 2.4 Build Options Interface

```typescript
interface BuildOptions {
  type: 'html' | 'pdf' | string;         // Output format
  variables?: Record<string, any>;       // Global variables
  frontmatter?: boolean;                 // Parse YAML frontmatter
  [key: string]: any;                    // Future options
}
```

### 2.5 Lint API

**Function**: `lint(filePath: string, options?: LintOptions): Promise<LintResult>`

```typescript
interface LintResult {
  valid: boolean;
  errors: LintError[];
  warnings: LintWarning[];
  filePath: string;
}

interface LintError {
  line: number;
  column: number;
  message: string;
  code: string;
}
```

---

## 3. Lexer Architecture (Custom Implementation)

### 3.1 Overview

The Lexer transforms raw input string into a stream of Tokens. It is built from scratch with no external dependencies.

```
Input String → Lexer → Token Stream → Parser → AST
```

### 3.2 File Structure

```
src/lexer/
├── token-types.ts         # Token types enum and Token interface
├── lexer.ts               # Main Lexer class implementation
├── state/
│   └── lexer-state.ts     # Lexer state management (modes, indentation)
└── errors/
    └── lexer-error.ts     # Lexer error definitions (future)
```

### 3.3 File Explanations

#### `src/lexer/token-types.ts`

This file defines all token types used by the lexer and provides the Token interface. The TokenType enum contains:
- **Structural tokens**: NEWLINE, INDENT, DEDENT, EOF
- **Heading tokens**: HEADING, HEADING_MARKER
- **List tokens**: BULLET_LIST, ORDERED_LIST, TASK_LIST, DEFINITION
- **Block element tokens**: BLOCKQUOTE, INDENTATION, CODE_BLOCK, HORIZONTAL_RULE, FRONTMATTER
- **Special block tokens**: TRIPLE_COLON_START, TRIPLE_COLON_END, DOUBLE_BRACKET_START, DOUBLE_BRACKET_END
- **Inline style tokens**: TEXT, BOLD, ITALIC, UNDERLINE, STRIKETHROUGH, CODE, SUPERSCRIPT, SUBSCRIPT, HIGHLIGHT, INLINE_STYLE
- **Link and media tokens**: LINK_START, LINK_END, LINK_REF_DEF, IMAGE, VIDEO, AUDIO, EMBED, FILE
- **Variable tokens**: VARIABLE, GLOBAL_VARIABLE, EXPRESSION, INCLUDE
- **Attribute tokens**: ATTRIBUTES_START, ATTRIBUTES_END
- **Special tokens**: ESCAPE, COMMENT_INLINE, ABBREVIATION, ANCHOR, FOOTNOTE_DEF, ATTRIBUTE_SHORTCUT

The Token interface includes: type, value, line, column, and length.

#### `src/lexer/lexer.ts`

This is the core Lexer class that transforms input strings into tokens. Key responsibilities:
- Maintains source string, current position, line and column counters
- Implements tokenization loop that processes the entire input
- Contains pattern matching methods (matchHeading, matchCodeBlock, etc.) for recognizing different syntax elements
- Reads and creates appropriate tokens for each recognized pattern
- Handles whitespace, EOF detection, and character advancement with line/column tracking
- Uses LexerState to manage modes (BLOCK, INLINE, CODE, FRONTMATTER, TABLE, TRIPLE_COLON)

#### `src/lexer/state/lexer-state.ts`

This file defines the LexerState class that manages lexer context during tokenization:
- **mode**: Current parsing mode (BLOCK, INLINE, CODE, FRONTMATTER, TABLE, TRIPLE_COLON)
- **indentStack**: Tracks indentation levels for Python-like block detection
- **codeLanguage**: Stores the language identifier from code blocks
- **blockDepth**: Tracks nested block depth

Provides methods: pushIndent(), popIndent(), getCurrentIndent(), setMode(), enterCodeBlock(), exitCodeBlock()

---

## 4. Parser Architecture (Recursive Descent)

### 4.1 Overview

The Parser consumes the Token stream from the Lexer and produces an AST. Built as a custom Recursive Descent Parser.

```
Tokens → Parser → AST
```

### 4.2 File Structure

```
src/parser/
├── types.ts               # All AST Node type interfaces
├── parser.ts             # Main recursive descent parser
├── inline-parser.ts      # Inline element parsing
├── errors/
│   └── parse-error.ts    # ParseError class
└── nodes/
    ├── factory.ts        # Node factory functions (future)
    └── validators.ts     # Node validation (future)
```

### 4.3 File Explanations

#### `src/parser/types.ts`

This file defines all AST node type interfaces. Key interfaces include:
- **DocumentNode**: Root node containing children and optional frontmatter
- **Block nodes**: HeadingNode, ParagraphNode, BlockquoteNode, ListNode, ListItemNode, CodeBlockNode, TripleColonBlockNode, DoubleBracketBlockNode, HorizontalRuleNode, IndentationNode
- **Inline nodes**: BoldNode, ItalicNode, UnderlineNode, StrikethroughNode, CodeNode, SuperscriptNode, SubscriptNode, HighlightNode, InlineStyleNode
- **Media nodes**: LinkNode, ImageNode, VideoNode, AudioNode, EmbedNode, FileNode
- **Special nodes**: VariableNode, ExpressionNode, IncludeNode, ForeachNode, IfNode, FootnoteNode, FootnoteDefinitionNode, AbbreviationNode, FrontmatterNode

All nodes share a base ASTNode interface with type and optional attributes.

#### `src/parser/parser.ts`

The main Parser class implementing recursive descent parsing:
- Consumes tokens from the lexer
- Parses document structure by delegating to specialized methods
- **parseDocument()**: Entry point handling optional frontmatter and block parsing
- **parseBlock()**: Dispatches to specific block parsers based on token type
- **parseHeading()**: Handles # heading syntax with level detection
- **parseParagraph()**: Reads text content until new block or EOF
- **parseBlockquote()**: Handles > syntax with nested content parsing
- **parseList()**: Processes bullet, ordered, and task lists
- **parseCodeBlock()**: Handles ``` code fence syntax

Uses helper methods: advance(), peek(), expect(), match(), skipNewlines(), error(), warn()

#### `src/parser/inline-parser.ts`

Handles inline element parsing within text content:
- **parse()**: Main method that processes text and returns array of inline nodes
- **parseInlineElement()**: Tries each inline pattern in order (longest/most specific first)
- Pattern methods: parseBold, parseItalic, parseUnderline, parseStrikethrough, parseHighlight, parseCode, parseSuperscript, parseSubscript, parseInlineStyle
- Uses regex patterns to match inline syntax (**, //, __, ~~, ==, `, ^, _, ||)

#### `src/parser/errors/parse-error.ts`

Custom error class for parse errors:
- Extends Error with location information
- Properties: message, line, column, filePath, code
- Used by Parser to throw descriptive errors with exact location

---

## 5. Builder Architecture

### 5.1 Overview

Builders transform AST nodes into output formats (HTML, PDF, etc.). The architecture uses the Visitor pattern.

### 5.2 File Structure

```
src/builder/
├── builder.ts             # Builder interface definition
├── html/
│   ├── builder.ts         # HTMLBuilder implementation
│   └── visitors/
│       ├── blockquote.ts  # Blockquote visitor example
│       └── ...
└── pdf/
    └── index.ts          # PDF builder (future)
```

### 5.3 File Explanations

#### `src/builder/builder.ts`

The Builder interface that all builders must implement:
- **build(node: ASTNode)**: Transform a single AST node to output string
- **buildDocument(node: DocumentNode)**: Build complete document with wrapper (DOCTYPE, html, head, body)

#### `src/builder/html/builder.ts`

The HTMLBuilder class that transforms AST to HTML:
- **visitDocument()**: Wraps children in HTML document structure
- **visitHeading()**: Generates h1-h6 elements
- **visitParagraph()**: Generates p elements
- **visitBlockquote()**: Generates blockquote elements with nested content
- **visitList()**: Generates ul/ol elements based on list kind
- **visitListItem()**: Generates li elements with optional checkbox for tasks
- **visitCodeBlock()**: Generates pre/code elements with language class
- **visitTripleColonBlock()**: Generates div for ::: custom blocks
- **visitDoubleBracketBlock()**: Generates div for [[]] blocks
- **visitHorizontalRule()**: Generates hr element
- **visitIndentation()**: Generates indented div with margin
- **Inline visitors**: visitBold, visitItalic, visitUnderline, visitStrikethrough, visitCode, visitSuperscript, visitSubscript, visitHighlight, visitInlineStyle, visitLink, visitImage, visitVideo, visitAudio, visitEmbed, visitFile, visitVariable, visitExpression, visitFootnote, visitFootnoteDefinition
- **buildAttributes()**: Helper to convert Attributes object to HTML attribute string

#### `src/builder/html/visitors/blockquote.ts`

Example of the Visitor pattern implementation:
- **visitBlockquote()**: Function that transforms BlockquoteNode to HTML
- Recursively builds child content using the builder
- Uses buildAttributes helper for attribute handling
- Returns properly formatted blockquote HTML string

---

## 6. Key Architectural Rules

### 6.1 Separation of Concerns

| Layer   | Responsibility               | Location       |
|---------|------------------------------|----------------|
| CLI     | User interface, file I/O     | `src/cli/`     |
| API     | Public functions, validation | `src/api/`     |
| Lexer   | String → Tokens              | `src/lexer/`   |
| Parser  | Tokens → AST                 | `src/parser/`  |
| Builder | AST → Output                 | `src/builder/` |

### 6.2 Lexer Rules

- ✅ MUST produce accurate line/column information for each token
- ✅ MUST handle all edge cases (empty input, malformed syntax)
- ✅ MUST track lexer state (block/inline/code modes)
- ✅ MUST NOT know about AST or building
- ❌ MUST NOT use external lexer libraries

### 6.3 Parser Rules

- ✅ MUST return AST with proper nested nodes
- ✅ MUST handle all edge cases (empty input, malformed syntax)
- ✅ MUST provide meaningful error messages with line/column
- ✅ MUST NOT know about HTML, PDF, or any output format
- ❌ MUST NOT contain any build logic
- ❌ MUST NOT use external parser libraries

### 6.4 Builder Rules

- ✅ MUST only accept AST nodes as input
- ✅ MUST traverse child nodes recursively
- ✅ MUST be format-specific (HTML builder → HTML string)
- ❌ MUST NOT parse raw text content
- ❌ MUST NOT call the lexer or parser

### 6.5 Extensibility

- New builders (PDF, DOCX, etc.) are added to `src/builder/<format>/`
- New node types require:
  1. Lexer token type (if new syntax)
  2. Parser rule in recursive descent
  3. Node factory function
  4. Visitor in each builder
- Plugin system for custom transformations (future)

---

## 7. Implementation Priority

1. **Phase 1**: Lexer with Token generation
2. **Phase 2**: Parser with AST generation (basic node types)
3. **Phase 3**: HTML Builder (basic structure)
4. **Phase 4**: Inline parsing (formatting, links, variables)
5. **Phase 5**: Advanced blocks (triple colon, double bracket, lists)
6. **Phase 6**: CLI tools (lint, build)
7. **Phase 7**: JavaScript API
8. **Phase 8**: PDF builder (future)
9. **Phase 9**: Advanced features (watch mode, templates, etc.)

---

*This document defines the target architecture. Everything is built from scratch using custom Lexer and Recursive Descent Parser in TypeScript.*
