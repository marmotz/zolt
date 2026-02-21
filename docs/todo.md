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

- [ ] Parse variable definitions `$var = "value"`
- [ ] Replace variable occurrences `{$var}`
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

- [ ] `{w=width}` or `{width=value}` - Width
- [ ] `{h=height}` or `{height=value}` - Height
- [ ] `{align=value}` - Alignment (left, center, right)
- [ ] `{shadow=value}` - Shadow
- [ ] `{float=value}` - Float

### Image Syntax

- [ ] `![alt](src)` - Basic image
- [ ] `![alt](src){width=value}` - Image with attributes

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
- [ ] `^{text}` → Superscript (with nesting support)
- [ ] `_{text}` → Subscript (with nesting support)
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
- [ ] Links with attributes `[text](url){attributes}`
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

- [ ] Simple blockquotes `> text`
- [ ] Blockquotes with attributes
- [ ] Nested blockquotes `>>` and `>>>`

## 7. Technical Indentation

### Indentation System

- [ ] Simple indentation `& text`
- [ ] Multiple indentation levels `&&`, `&&&`
- [ ] Distinction from blockquotes (`>`)

## 8. Horizontal Rules

### Rule Types

- [ ] `---` - Standard separator
- [ ] `***` - Thick separator
- [ ] `___` - Thin separator
- [ ] Separator with attributes `{color}`, `{style}`, `{width}`, `{align}`

## 9. Structure Blocks

### Triple Colon Blocks `:::`

- [ ] Semantic containers: `:::info`, `:::warning`, `:::error`, `:::success`, `:::note`, `:::abstract`
- [ ] Optional titles `:::type [Title]`
- [ ] Block attributes `{attributes}`
- [ ] Details/accordion `:::details [Title]`
- [ ] Details attribute `{open=true}`

### Grid Tables

- [ ] Basic tables with `|` syntax
- [ ] `[[table]]` and `[[/table]]` wrapper
- [ ] Header marker `[h]`
- [ ] Column merge `[colspan=N]`
- [ ] Row merge `[rowspan=N]`
- [ ] Alignment markers `:---`, `:---:`, `---:`
- [ ] Table attributes `{id=value}`

### Tabs

- [ ] `:::tabs` container
- [ ] `:::tab [Title]` items
- [ ] Tabs container attribute `{default=Name}`
- [ ] Tab item attribute `{active=true}`

### Columns

- [ ] `:::columns` container
- [ ] `:::column` items
- [ ] Container attribute `{cols=N}`
- [ ] Column attributes `{width=%}`, `{width=px}`

## 10. Media Management

### Media Prefixes

- [ ] `![alt](url)` - Images (jpg, png, gif, svg) → `<img>`
- [ ] `!![alt](url)` - Videos (mp4, webm, ogg) → `<video>`
- [ ] `??[alt](url)` - Audio (mp3, wav, ogg) → `<audio>`
- [ ] `@@[alt](url)` - Embeds (YouTube, Vimeo, Spotify) → `<iframe>`
- [ ] `&&[alt](url)` - Downloadable files (pdf, doc, zip) → `<a>` with icon

## 11. Calculations & Logic

### Basic Operators

- [ ] Addition `{{ a + b }}`
- [ ] Subtraction `{{ a - b }}`
- [ ] Multiplication `{{ a * b }}`
- [ ] Division `{{ a / b }}`
- [ ] Modulo `{{ a % b }}`
- [ ] Power `{{ a ^ b }}`
- [ ] Operator precedence (parentheses, power, mult/div/mod, add/sub) - PARTIAL

### Math Namespace

- [ ] `Math.floor(value)`
- [ ] `Math.ceil(value)`
- [ ] `Math.round(value)`
- [ ] `Math.abs(value)`
- [ ] `Math.pow(base, exp)`
- [ ] `Math.sqrt(value)`
- [ ] `Math.min(a, b)`
- [ ] `Math.max(a, b)`

### List Namespace

- [ ] `List.length(array)`
- [ ] `List.first(array)`
- [ ] `List.last(array)`
- [ ] `List.sum(array)`
- [ ] `List.avg(array)`
- [ ] `List.count(array)`

### String Namespace

- [ ] `String.upper(text)` - NOT TESTED
- [ ] `String.lower(text)` - NOT TESTED
- [ ] `String.length(text)` - NOT TESTED
- [ ] `String.trim(text)` - NOT TESTED
- [ ] `String.replace(text, search, replacement, limit?, offset?)`

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

- [ ] `:::foreach {$array as $item}`
- [ ] Loop variables: `{$foreach.index}`, `{$foreach.index1}`, `{$foreach.first}`, `{$foreach.last}`, `{$foreach.even}`,
  `{$foreach.odd}`
- [ ] Nested loops
- [ ] Conditional rendering in loops with `:::if`
- [ ] Alternating row styles

### File Inclusion

- [ ] `{{include path/to/file.zlt}}`
- [ ] Relative path support
- [ ] Recursion protection (max depth 10)
- [ ] Loop detection
- [ ] Variable inheritance from parent

## 13. Code Blocks & Special Functions

### Advanced Code Blocks

- [ ] Basic code blocks with triple backticks
- [ ] Language-specific code blocks - PARTIAL (parsed but not highlighted)
- [ ] Code block attributes: `{title=value}`, `{highlight=N-M}`, `{start=N}`

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
