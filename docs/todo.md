# Zolt v0.2 - Implementation Todo List

## 1. Core Parser & Lexer

### Phase 0: Escaping & Comments

- [ ] Implement escape character handling (`\`)
- [ ] Implement `:::comment` blocks
- [x] Implement inline comments `%% ... %%`

### Phase 0.5: Frontmatter

- [ ] Parse YAML frontmatter at start of file
- [ ] Create automatic variables from frontmatter (`{$title}`, `{$author}`, `{$date}`, `{$version}`, `{$tags}`,
      `{$description}`, `{$lang}`, `{$toc}`, `{$theme}`)

### Phase 1: Variables

- [x] Parse variable definitions `$var = "value"`
- [x] Replace variable occurrences `{$var}` (Note: skipped inside code spans and blocks)
- [ ] Implement automatic date variables (`{$created}`, `{$modified}`)
- [ ] Support date formatting with tokens (`DD`, `MM`, `YYYY`, `YY`, `HH`, `mm`, `ss`)
- [ ] Support timezone configuration

## 2. Universal Attribute System `{}`

### Attributes on Text Inline

- [ ] `{color=value}` - Text color
- [ ] `{size=value}` - Font size
- [ ] `{#id}` - Unique identifier
- [ ] `{.class}` - CSS classes
- [ ] `{background=value}` - Background color
- [ ] `{font-weight=value}` - Font weight

### Attributes on Headings

- [ ] `{#id}` - Heading ID for cross-references
- [ ] `{.class}` - CSS classes
- [ ] `{numbered}` - Enable numbering
- [ ] `{numbered=false}` - Disable numbering

### Attributes on Images

- [x] `{w=width}` or `{width=value}` - Width
- [x] `{h=height}` or `{height=value}` - Height
- [x] `{align=value}` - Alignment (left, center, right)
- [ ] `{shadow=value}` - Shadow
- [x] `{float=value}` - Float

### Image Syntax

- [x] `![alt](src)` - Basic image
- [x] `![alt](src){width=value}` - Image with attributes

### Attributes on Videos

- [ ] `{autoplay}` - Autoplay
- [ ] `{loop}` - Loop
- [ ] `{muted}` - Muted
- [ ] `{controls}` - Show controls

## 3. Typography & Inline Formatting

### Basic Formatting

- [ ] `**text**` → Bold
- [ ] `//text//` → Italic
- [ ] `__text__` → Underline
- [ ] `~~text~~` → Strikethrough
- [x] `^{text}` → Superscript (with nesting support)
- [x] `_{text}` → Subscript (with nesting support)
- [ ] `==text==` → Highlight/Mark

### Styled Inline Groups

- [x] `||text||{attributes}` - Apply styles to groups of words

### Character Escaping

- [ ] Escape special characters with backslash
- [ ] Support double backslash for literal backslash

## 4. Lists

### List Types

- [ ] Bullet lists `- item`
- [ ] Numbered lists `1. item`
- [ ] Task lists `- [ ] task` and `- [ ] task`
- [x] Definition lists `: term` / `: definition`

### List Features

- [ ] Nested lists (2 spaces or 1 tab indentation)
- [ ] Attributes on list items
- [ ] Mixed list types

## 5. Links

### Link Types

- [x] External links `[text](url)`
- [x] Links with attributes `[text](url){attributes}`
- [ ] Automatic reference links `[text][ref]` with `[ref]: url`
- [ ] Internal links/cross-references `[text](@id)`
- [ ] Anchor links `[text](#anchor)`
- [ ] Links with variables `[text]({$var})`

### Link Attributes

- [ ] `{target=_blank}` - Open in new tab
- [ ] `{rel=noopener}` - Security for target=\_blank
- [ ] `{download}` - Force download
- [ ] `{title=value}` - Tooltip

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

- [ ] Basic tables with `|` syntax
- [ ] `[[table]]` and `[[/table]]` wrapper
- [ ] Header marker `[h]`
- [ ] Column merge `[colspan=N]`
- [ ] Row merge `[rowspan=N]`
- [ ] Alignment markers `:---`, `:---:`, `---:`
- [ ] Table attributes `{id=value}`

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

- [ ] Footnote references `[^n]`
- [ ] Footnote definitions `[^n]: content`
- [ ] Multiple references to same footnote
- [ ] Footnotes with attributes

### Abbreviations

- [x] Inline abbreviations `Text{abbr="definition"}`
- [x] Global abbreviation definitions `*[ABBR]: Definition`
- [x] Abbreviations with additional attributes

### Table of Contents

- [ ] Basic TOC `[[toc]]`
- [ ] TOC with attributes `{depth=N}`, `{from=N}`, `{to=N}`, `{numbered=true}`, `{class=value}`

### Loops

- [x] `:::foreach {$array as $item}`
- [x] Loop variables: `{$foreach.index}`, `{$foreach.index1}`, `{$foreach.first}`, `{$foreach.last}`, `{$foreach.even}`,
      `{$foreach.odd}`
- [ ] Nested loops
- [x] Conditional rendering in loops with `:::if`
- [ ] Alternating row styles

### File Inclusion

- [ ] `{{include path/to/file.zlt}}`
- [ ] Relative path support
- [ ] Recursion protection (max depth 10)
- [ ] Loop detection
- [ ] Variable inheritance from parent

## 13. Code Blocks & Special Functions

### Advanced Code Blocks

- [x] Basic code blocks with triple backticks
- [x] Language-specific code blocks - PARTIAL (parsed but not highlighted)
- [x] Code block attributes: `{title=value}`, `{highlight=N-M}`, `{start=N}`

### Mathematics (LaTeX)

- [ ] Inline math `$ formula $`
- [ ] Block math `$$ formula $$`

### Diagrams

- [ ] `:::mermaid` blocks

### Charts

- [ ] `:::chart` container
- [ ] `:::chart-line` - Line charts
- [ ] `:::chart-bar` - Bar charts
- [ ] `:::chart-pie` - Pie charts
- [ ] `:::chart-area` - Area charts
- [ ] Chart container attributes: `{width}`, `{height}`, `{layout}`
- [ ] Chart attributes: `{title}`, `{color-scheme}`, `{legend}`, `{grid}`
- [ ] Multi-chart support with horizontal/vertical layout

## 14. Heading Numbering

### Global Numbering

- [ ] `$numbering = true` - Enable global numbering
- [ ] `$numbering_style = "style"` - Set numbering style

### Local Numbering

- [ ] `{numbered}` attribute on headings
- [ ] `{numbered=false}` to disable specific sections

### Numbering Styles

- [ ] `decimal` - 1, 1.1, 1.1.1
- [ ] `roman-lower` - i, ii, iii
- [ ] `roman-upper` - I, II, III
- [ ] `alpha-lower` - a, b, c
- [ ] `alpha-upper` - A, B, C

## 15. Post-Processing

### Automatic Features

- [ ] Generate automatic heading IDs for headings without explicit `{#id}`
- [ ] Process `:::foreach` loops with automatic variables
- [ ] Generate Table of Contents at `[[toc]]` locations
- [ ] Resolve cross-references `@ref`
- [ ] Generate footnotes

## 16. Error Handling

### Error Resilience

- [ ] Continue parsing on syntax errors (partial - throws errors)
- [ ] Emit warnings for syntax errors
- [ ] Validate attribute syntax
- [ ] File not found errors for includes
- [ ] Inclusion loop detection errors
- [ ] Max depth exceeded errors
- [ ] Permission denied errors

## 17. HTML Generation

### Output

- [x] Generate valid HTML5
- [x] Apply CSS classes from attributes
- [x] Apply inline styles from attributes
- [x] Generate semantic HTML for blocks

## 18. Testing & Validation

### Test Coverage

- [ ] Unit tests for each inline formatting feature
- [ ] Unit tests for each block type
- [ ] Unit tests for attributes
- [ ] Unit tests for variables
- [ ] Unit tests for calculations and namespaces
- [ ] Unit tests for loops
- [ ] Unit tests for file inclusion
- [ ] Integration tests for complete documents
- [ ] Regression tests for Markdown compatibility

### Test Files

- [ ] Create test files for each feature
- [ ] Create example files from spec.md section 12

## 19. Documentation

### Developer Documentation

- [ ] Update README with usage instructions
- [ ] Document parser phases
- [ ] Document attribute system
- [ ] Document all syntax features
- [ ] Create migration guide from Markdown

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
- `[ ]` - Completed
- `[*]` - In progress

## Notes

- Each checkbox represents a distinct feature to implement
- Some checkboxes contain multiple sub-features
- Features are organized by logical categories
- Reference spec.md for detailed syntax and behavior requirements
- Last updated: 2026-02-21
