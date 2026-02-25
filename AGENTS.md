# AI Agent Instructions for Zolt

Welcome to Zolt, the high-voltage successor to Markdown! This document outlines the standards, commands, and conventions
you MUST follow when working on this repository.

## 1. Project Overview & Architecture

- **Type:** A parser, CLI tool, and framework for the Zolt markup language.
- **Tech Stack:** TypeScript, Bun.
- **Entry Points:** `src/cli.ts` (CLI executable), `src/index.ts` (Library exports).
- **Architecture:** The project is structured into distinct phases typical of a compiler/interpreter:
    - **Lexer:** Located in `src/lexer/`, handles tokenization (`Token`, `TokenType`).
    - **Parser:** Located in `src/parser/`, converts Tokens into an Abstract Syntax Tree (AST). It uses a modular
      approach with specific block parsers (e.g., `TableParser`, `HeadingParser`).
    - **Builder/Renderer:** Located in `src/builder/`, responsible for evaluating variables and rendering the AST into
      HTML or other formats.
    - **API/CLI:** High-level wrappers providing developer APIs and terminal commands.

## 2. Important Commands (Bun)

### Build

- Full build for all target platforms: `bun run build`
- Platform-specific executable builds are also available: `bun run build:linux`, `bun run build:macos-x64`,
  `bun run build:macos-arm64`, `bun run build:windows`.

### Testing (Crucial for Agents)

- **Run all tests:** `bun test`
- **Run a single test file:** `bun test path/to/file.spec.ts`
- **Test Structure:**
    - Unit tests (`*.spec.ts`) focus on isolated components (e.g., `parser.spec.ts`, `inline-parser.spec.ts`).
    - End-to-end tests (`*.e2e.spec.ts`) test end-user functionality.
- **Agent Workflow:** When you modify parser logic or fix a bug, you MUST locate the relevant test file or create a new
  one. Ensure you execute `bun test <file>` to verify your changes locally before concluding your task.

### Linting & Formatting

- **Check formatting:** `bun run lint` (Runs `prettier --check src`).
- **Fix formatting:** `bun run format` (Runs `prettier --write src`).
- **Agent Workflow:** Always run `bun run format` after modifying files to ensure you comply with the formatting rules,
  especially since Prettier organizes imports automatically.

## 3. Code Style & Guidelines

### TypeScript & Typing

- **Strict Mode:** `strict` is set to `true` in `tsconfig.json`. You must strictly type all variables and returns. Avoid
  `any` at all costs. Use well-defined interfaces (e.g., `ASTNode`, `FrontmatterNode`).
- **Module Resolution:** We use `ESNext` and `bundler` resolution.
- **Imports:** When adding imports, ensure they point to the correct internal modules.

### Formatting (Prettier)

- **Indentation:** 2 spaces, no tabs (`useTabs: false`).
- **Line Width:** 120 characters (`printWidth: 120`).
- **Quotes:** Single quotes (`'`) for strings (`singleQuote: true`).
- **Semicolons:** Always required at the end of statements (`semi: true`).
- **Trailing Commas:** Used for multiline objects and arrays (`trailingComma: "es5"`).
- **Arrow Functions:** Always use parentheses around arguments (`arrowParens: "always"`).
- **Attributes:** Single attribute per line in HTML/JSX-like structures (`singleAttributePerLine: true`).

### Naming Conventions

- **Files/Directories:** Kebab-case (e.g., `inline-parser.ts`, `block-parsers/`, `token-types.ts`).
- **Classes/Interfaces/Types:** PascalCase (e.g., `Parser`, `DocumentNode`, `ASTNode`, `TokenType`).
- **Variables/Functions/Methods:** camelCase (e.g., `inlineParser`, `parseDocument()`, `currentToken`).
- **Constants/Enums:** UPPER_SNAKE_CASE for enum values (e.g., `TokenType.CODE_BLOCK_START`).

### Design Patterns & Best Practices

- **Class-Based Parsing:** The parser logic relies heavily on classes to encapsulate state. For instance, `Parser` holds
  `pos` and `currentToken`, while delegating specific block parsing to instances like `TableParser` or
  `CodeBlockParser`.
- **Dependency Injection:** Parsers often receive their dependencies via the constructor. E.g.,
  `new IndentationParser(this.listParser, this.tripleColonParser)`. Do not instantiate dependencies locally if they can
  be shared.
- **Immutability in AST:** AST nodes are mostly plain objects describing their `type` and nested `children`,
  `attributes`, or other properties. Do not mutate AST nodes unexpectedly after creation unless explicitly merging
  attributes (as seen in `parser.ts`).
- **Token Handling:** Always advance the token stream safely. Use internal utility methods like `this.match()`,
  `this.expect()`, `this.peek()`, and `this.advance()` when working inside parsers to avoid out-of-bounds errors.

### Error Handling

- **Specific Errors:** Do not throw generic `Error` instances.
- **ParseError:** When encountering invalid syntax, throw domain-specific error classes. For parsing, use
  `throw new ParseError(message, line, column, filePath, errorCode)`. This ensures precise error reporting for the end
  user.
- **Warnings:** The `Parser` class maintains a `warnings` array. Append non-fatal issues (like invalid frontmatter
  types) to `this.warnings` instead of throwing an error.

## 4. Core Mandates for AI Agents

1. **Understand Before Acting:** Always read existing surrounding files (`glob` and `read`) before modifying code.
   Emulate the exact style of the file you are editing.
2. **Absolute Paths:** When using file system tools (like `read` or `write`), construct the full absolute path starting
   from `/media/data/dev/marmotz-dev/zolt/`.
3. **Do Not Over-Engineer:** Stick to the established architecture. If a feature needs a new token, add it to
   `TokenType` in `src/lexer/token-types.ts`, implement lexing rules in `src/lexer/lexer.ts`, and then build the parser
   component in `src/parser/`. Do not bypass the Lexer-Parser pipeline.
4. **Testing is Mandatory:** Every parser or lexer change needs a corresponding spec. Before claiming a task is done,
   run `bun test` and ensure 100% of the tests pass. Run `bun run format` to clean up the code.
5. **No Placeholders:** Write complete code. Do not leave `// TODO` or `...` inside code blocks unless specifically
   requested by the user.

Adhere to these rules strictly to maintain the high quality and performance of the Zolt project.
