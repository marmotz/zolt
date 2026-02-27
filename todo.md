# Zolt v0.1 - Implementation Todo List

## 1. Core Parser & Lexer

### Phase 0: Escaping & Comments

- [x] Implement escape character handling (`\`) (tested in escaping.e2e.spec.ts)
- [x] Implement `:::comment` blocks
- [x] Implement inline comments `%% ... %%`

### Phase 0.5: File metadata

- [x] Parse YAML file metadata at start of file
- [x] Create automatic variables from file metadata (`{$title}`, `{$author}`, `{$date}`, `{$version}`, `{$tags}`,
  `{$description}`, `{$lang}`, `{$toc}`, `{$theme}`)
- [x] Implement theme system (`default`, `professional`, `technical`, `playful`)
- [x] Support `color-scheme` (`auto`, `light`, `dark`) with automatic system preference detection
- [x] Generate HTML `<meta>` and Open Graph tags from file metadata (with strict TS typing)

### Phase 1: Variables

- [x] Parse variable definitions `$var = "value"`
- [x] Replace variable occurrences `{$var}` (Note: skipped inside code spans and code blocks)
- [x] Implement automatic date variables (`{$created}`, `{$modified}`)
- [x] Support date formatting with `Date.format()` function (tokens: `DD`, `MM`, `YYYY`, `YY`, `HH`, `H`, `hh`, `h`,
  `mm`, `ss`, `a`, `MMMM`, `MMM`, `dddd`, `ddd`, `m`, `s`)
- [x] Support date localization using `$lang` or `$locale` variables in `Date.format()`
- [x] Implement AST-based evaluation for `:::foreach`, `:::if`, and expressions (replaces SourceEvaluator)

## 2. Universal Attribute System `{}`

### Attributes on All Elements

- [x] Support `{#id}` and other attributes on ALL elements
- [x] Attributes on Paragraphs
- [x] Attributes on Lists and List Items
- [x] Attributes on Blockquotes
- [x] Attributes on All Inline Elements (Bold, Italic, etc.)
- [x] `||text||{attributes}` - Apply styles to groups of words (Styled Inline Groups)

### Attributes on Text Inline

- [x] `{color=value}` - Text color
- [x] `{size=value}` - Font size
- [x] `{#id}` - Unique identifier
- [x] `{.class}` - CSS classes
- [x] `{background=value}` - Background color
- [x] `{font-weight=value}` - Font weight

### Attributes on Headings

- [x] `{#id}` - Heading ID for cross-references
- [x] `{.class}` - CSS classes
- [x] `{numbered}` - Enable numbering
- [x] `{numbered=false}` - Disable numbering

### Attributes on Images

- [x] `{w=width}` or `{width=value}` - Width (tested in images.e2e.spec.ts)
- [x] `{h=height}` or `{height=value}` - Height (tested in images.e2e.spec.ts)
- [x] `{align=value}` - Alignment (left, center, right)
- [x] `{shadow=value}` - Shadow (tested in images.e2e.spec.ts)
- [x] `{float=value}` - Float

### Image Syntax

- [x] `![alt](src)` - Basic image
- [x] `![alt](src){width=value}` - Image with attributes

### Attributes on Videos

- [x] `{autoplay}` - Autoplay (tested in images.e2e.spec.ts)
- [x] `{loop}` - Loop (tested in images.e2e.spec.ts)
- [x] `{muted}` - Son désactivé (tested in images.e2e.spec.ts)

## 3. Typography & Inline Formatting

### Basic Formatting

- [x] `**text**` → Bold
- [x] `//text//` → Italic
- [x] `__text__` → Underline
- [x] `~~text~~` → Strikethrough
- [x] `^{text}` → Superscript (with nesting support)
- [x] `_{text}` → Subscript (with nesting support)
- [x] `==text==` → Highlight/Mark

### Styled Inline Groups

- [x] `||text||{attributes}` - Apply styles to groups of words

### Character Escaping

- [x] Escape special characters with backslash (tested in escaping.e2e.spec.ts)
- [x] Support double backslash for literal backslash (tested in escaping.e2e.spec.ts)

## 4. Lists

### List Types

- [x] Bullet lists `- item`
- [x] Numbered lists `1. item`
- [x] Task lists `- [ ] task` and `- [x] task`
- [x] Definition lists `: term` / `: definition`
- [x] Plain lists `+ item` (without bullets)

### List Features

- [x] Nested lists (2 spaces or 1 tab indentation)
- [x] Attributes on list items
- [x] Mixed list types

## 5. Links

### Link Types

- [x] External links `[text](url)`
- [x] Links with attributes `[text](url){attributes}`
- [x] Automatic reference links `[text][ref]` with `[ref]: url`
- [x] Internal links/cross-references `[text](@id)`
- [x] Anchor links `[text](#anchor)`
- [x] Highlight target element on anchor navigation
- [x] Links with variables `[text]({$var})`
- [x] Link reference definitions `[ref]: url`

### Link Attributes

- [x] `{target=_blank}` - Open in new tab (tested in images.e2e.spec.ts)
- [x] `{rel=noopener}` - Security for target=_blank (tested in links-security.e2e.spec.ts)
- [x] `{title=value}` - Tooltip (tested in links-security.e2e.spec.ts)

## 6. Blockquotes & Citations

### Blockquote Features

- [x] Simple blockquotes `> text`
- [x] Blockquotes with attributes (on paragraph lines)
- [x] Nested blockquotes `>>` and `>>>`

## 7. Technical Indentation

### Indentation System

- [x] Simple indentation `& text`
- [x] Multiple indentation levels `&&`, `&&&`
- [x] Distinction from blockquotes (`>`)
- [x] Nested indentation levels (returning to previous level)
- [x] Lists inside indentation blocks

## 8. Horizontal Rules

### Rule Types

- [x] `---` - Standard separator
- [x] `***` - Thick separator
- [x] `___` - Thin separator
- [x] Separator with attributes `{color}`, `{style}`, `{width}`, `{align}`

## 9. Structure Blocks

### Triple Colon Blocks `:::`

- [x] Semantic containers: `:::info`, `:::warning`, `:::error`, `:::success`, `:::note`, `:::abstract`
- [x] Optional titles `:::type [Title]`
- [x] Block attributes `{attributes}`
- [x] Details/accordion `:::details [Title]`
- [x] Details attribute `{open=true}`

### Grid Tables

- [x] Basic tables with `|` syntax
- [x] `[[table]]` and `[[/table]]` wrapper
- [x] Header marker `[h]`
- [x] Column merge `[colspan=N]`
- [x] Row merge `[rowspan=N]`
- [x] Alignment markers `:---`, `:---:`, `---:`
- [x] Table attributes `{id=value}`

### Tabs

- [x] `:::tabs` container
- [x] `:::tab [Title]` items
- [x] Tabs container attribute `{default=Name}`
- [x] Tab item attribute `{active=true}`

### Columns

- [x] `:::columns` container
- [x] `:::column` items
- [x] Container attribute `{cols=N}`
- [x] Column attributes `{width=%}`, `{width=px}`

## 10. Media Management

### Media Prefixes

- [x] `![alt](url)` - Images (jpg, png, gif, svg) → `<img>`
- [x] `!![alt](url)` - Videos (mp4, webm, ogg) → `<video>`
- [x] `??[alt](url)` - Audio (mp3, wav, ogg) → `<audio>`
- [x] `@@[alt](url)` - Embeds (YouTube, Vimeo, Spotify) → `<iframe>`
- [x] `&&[alt](url)` - Downloadable files (pdf, doc, zip) → `<a>` with icon

## 11. Calculations & Logic

### Basic Operators

- [x] Addition `{{ a + b }}`
- [x] Subtraction `{{ a - b }}`
- [x] Multiplication `{{ a * b }}`
- [x] Division `{{ a / b }}`
- [x] Modulo `{{ a % b }}`
- [x] Power `{{ a ^ b }}`
- [x] Ternary operator `{{ condition ? trueVal : falseVal }}`
- [x] Operator precedence (parentheses, power, mult/div/mod, add/sub)

### Math Namespace

- [x] `Math.floor(value)`
- [x] `Math.ceil(value)`
- [x] `Math.round(value)`
- [x] `Math.abs(value)`
- [x] `Math.pow(base, exp)`
- [x] `Math.sqrt(value)`
- [x] `Math.min(a, b, ...)`
- [x] `Math.max(a, b, ...)`

### List Namespace

- [x] `List.length(array)`
- [x] `List.first(array)`
- [x] `List.last(array)`
- [x] `List.sum(array)`
- [x] `List.avg(array)`
- [x] `List.count(array)` (alias of length)
- [x] `List.min(array)`
- [x] `List.max(array)`

### String Namespace

- [x] `String.upper(text)`
- [x] `String.lower(text)`
- [x] `String.length(text)`
- [x] `String.trim(text)`
- [x] `String.replace(text, search, replacement)`
- [x] `String.split(text, separator)`
- [x] `String.join(array, separator)`

### Date Namespace

- [x] `Date.format(date, format)` - Format a date with tokens (DD, MM, YYYY, YY, HH, H, hh, h, mm, ss, a, MMMM, MMM,
  dddd, ddd, m, s) and localization support.
- [x] `Date.now()` - Get current timestamp
- [x] `Date.parse(text, format)` - Parse a date string
- [x] `Date.calc(date, duration)` - Calculate a new date using a duration object
- [x] `Date.diff(date1, date2)` - Calculate difference between dates

### Variables

- [x] Variable definitions `$var = value`
- [x] Multiline array/object definitions
- [x] Variable references `{$var}`
- [x] Property access `{$obj.property}`
- [x] Array access `{$arr[index]}`

### Conditionals

- [x] Comparison operators `==`, `!=`, `<`, `<=`, `>`, `>=`
- [x] Logical operators `and`, `or`
- [x] Conditional blocks `:::if {{ condition }}`

## 12. Document Logic

### Footnotes

- [x] Footnote references `[^n]`
- [x] Footnote definitions `[^n]: content`
- [x] Multiple references to same footnote
- [x] Footnotes with attributes

### Abbreviations

- [x] Inline abbreviations `Text{abbr="definition"}`
- [x] Global abbreviation definitions `*[ABBR]: Definition`
- [x] Abbreviations with additional attributes

### Table of Contents

- [x] Basic TOC `[[toc]]`
- [x] TOC with attributes `{depth=N}`, `{from=N}`, `{to=N}`, `{numbered=true}`, `{class=value}`
- [x] Double bracket blocks with attributes `[[toc {id=toc}]]`

### Loops

- [x] `:::foreach {$array as $item}`
- [x] Loop variables: `{$foreach.index}`, `{$foreach.index1}`, `{$foreach.first}`, `{$foreach.last}`, `{$foreach.even}`,
  `{$foreach.odd}`
- [x] Nested loops
- [x] Conditional rendering in loops with `:::if`

### File Inclusion

- [x] `{{include path/to/file.zlt}}`
- [x] Relative path support
- [x] Recursion protection (max depth 10)
- [x] Loop detection
- [x] Variable inheritance from parent

## 13. Code Blocks & Special Functions

### Advanced Code Blocks

- [x] Basic code blocks with triple backticks
- [x] Language-specific code blocks - PARTIAL (parsed but not highlighted)
- [x] Code block attributes: `{title=value}`, `{highlight=N-M}`, `{start=N}`
- [x] Syntaxic coloring
- [x] Add a button to copy code

### Mathematics (LaTeX)

- [x] Inline math `$ formula $`
- [x] Block math `$$ formula $$`

### Diagrams

- [x] `:::mermaid` blocks

### Charts

- [x] `:::chart` container
- [x] `:::chart-line` - Line charts
- [x] `:::chart-bar` - Bar charts
- [x] `:::chart-pie` - Pie charts
- [x] `:::chart-area` - Area charts
- [x] Chart container attributes: `{width}`, `{height}`, `{layout}`
- [x] Chart attributes: `{title}`, `{color-scheme}`, `{legend}`, `{grid}`
- [x] Multi-chart support with horizontal/vertical layout

## 14. Heading Numbering

### Global Numbering

- [x] `$numbering = true` - Enable global numbering
- [x] `$numbering_style = "style"` - Set numbering style

### Local Numbering

- [x] `{numbered}` attribute on headings
- [x] `{numbered=false}` to disable specific sections

### Numbering Styles

- [x] `decimal` - 1, 1.1, 1.1.1
- [x] `roman-lower` - i, ii, iii
- [x] `roman-upper` - I, II, III
- [x] `alpha-lower` - a, b, c
- [x] `alpha-upper` - A, B, C

## 15. Post-Processing

### Automatic Features

- [x] Generate automatic heading IDs for headings without explicit `{#id}`
- [x] Process `:::foreach` loops with automatic variables (AST-based)
- [x] Generate Table of Contents at `[[toc]]` locations
- [x] Resolve cross-references `@ref` (tested in attributes.e2e.spec.ts)
- [x] Generate footnotes

## 16. Error Handling

### Error Resilience

- [x] Continue parsing on syntax errors (handled by Parser catch-and-recover)
- [x] Emit warnings for unknown metadata in file metadata
- [x] Emit warnings for syntax errors (unclosed blocks, invalid attributes)
- [x] Validate attribute syntax (added validation in InlineParser.parseAttributes)
- [x] File not found errors for includes
- [x] Inclusion loop detection errors
- [x] Max depth exceeded errors
- [x] Permission denied errors

## 17. HTML Generation

### Output

- [x] Generate valid HTML5
- [x] Apply CSS classes from attributes
- [x] Apply inline styles from attributes
- [x] Generate semantic HTML for blocks

## 18. Testing & Validation

### Test Coverage

- [x] Unit tests for each inline formatting feature
- [x] Unit tests for each block type
- [x] Unit tests for attributes
- [x] Unit tests for variables
- [x] Unit tests for SourceEvaluator (:::foreach, :::if, :::comment blocks)
- [x] Unit tests for calculations and namespaces
- [x] Unit tests for loops
- [x] Unit tests for file inclusion
- [x] Integration tests for complete documents (charts, mermaid)
- [x] Regression tests for Markdown compatibility

## 19. Documentation

### Developer Documentation

- [x] Update README with usage instructions
- [x] Document parser phases (done in ARCHITECTURE.md)
- [x] Document attribute system (done in spec.md and README.md)
- [x] Document all syntax features (done in spec.md)
- [x] Create migration guide from Markdown (done in README.md)

### Documentation creator

- [x] Rename frontmatter to file metadata
- [x] Project metadata file
- [x] new layout metadata to set layout of current file (in file metadata) or globally (in project metadata file)
- [x] new sidebar markup to define sidebar structure
- [x] new filetree markup to display file tree based on the dependencies of the input file

## 20. Performance & Optimization

### Performance

- [ ] Optimize parsing speed
- [ ] Minimize memory usage
- [ ] Cache parsed results
- [ ] Lazy loading for large documents

## 21. Maintenance & Infrastructure

- [x] Split E2E tests into themed files (`*.e2e.spec.ts`)
- [x] Update `AGENTS.md` with new test patterns
- [x] Clean up unused interfaces in CLI (`BuildOptions`, `LintOptions`)

## 22. CLI Features

- [x] Implement `--watch` option for automatic rebuilding
- [x] Recursive dependency tracking (links and includes) for watch mode
- [x] Automatic output directory creation

## 23. CLI Improvements

- [x] Add color to logs for lint and build commands

---

## Legend

- `[ ]` - Todo (not implemented)
- `[x]` - Completed
- `[*]` - In progress

## Notes

- Each checkbox represents a distinct feature to implement
- Some checkboxes contain multiple sub-features
- Features are organized by logical categories
- Reference spec.md for detailed syntax and behavior requirements
- Last updated: 2026-02-21
