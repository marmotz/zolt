import { Token, TokenType } from '../lexer/token-types';

export class DefinitionCollector {
  private abbreviationDefinitions: Map<string, string> = new Map();
  private linkReferences: Map<string, string> = new Map();
  private footnoteIds: Set<string> = new Set();
  private globalAbbreviations: Map<string, string> = new Map();

  public static clearGlobalAbbreviations(): void {
    // This method is now effectively a no-op for the static case, 
    // but we'll keep it for API compatibility if needed, 
    // or we can remove it if we update all callers.
  }

  public collect(tokens: Token[], initialGlobalAbbreviations?: Map<string, string>): {
    abbreviations: Map<string, string>;
    linkReferences: Map<string, string>;
    globalAbbreviations: Map<string, string>;
    footnotes: Set<string>;
  } {
    this.abbreviationDefinitions.clear();
    this.linkReferences.clear();
    this.footnoteIds.clear();
    this.globalAbbreviations = new Map(initialGlobalAbbreviations?.entries() || []);

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type === TokenType.FOOTNOTE_DEF) {
        this.footnoteIds.add(token.value);
      } else if (token.type === TokenType.ABBREVIATION_DEF || token.type === TokenType.ABBREVIATION_DEF_GLOBAL) {
        const value = token.value;
        const colonIndex = value.indexOf(':');
        if (colonIndex !== -1) {
          const abbreviation = value.substring(0, colonIndex);
          const definition = value.substring(colonIndex + 1);

          if (token.type === TokenType.ABBREVIATION_DEF_GLOBAL) {
            if (!this.globalAbbreviations.has(abbreviation)) {
              this.globalAbbreviations.set(abbreviation, definition);
            }
          } else {
            if (!this.abbreviationDefinitions.has(abbreviation)) {
              this.abbreviationDefinitions.set(abbreviation, definition);
            }
          }
        }
      } else if (token.type === TokenType.LINK_REF_DEF) {
        const value = token.value;
        const colonIndex = value.indexOf(':');
        if (colonIndex !== -1) {
          const ref = value.substring(0, colonIndex);
          const content = value.substring(colonIndex + 1).trim();

          // If it doesn't look like a URL or a relative path, it might be a footnote definition (even without ^)
          const isUrl = /^https?:\/\//.test(content);
          const isPath = /^\.\.?\//.test(content) || /^[a-zA-Z0-9_-]+\.[a-z]{2,4}$/.test(content);

          if (!isUrl && !isPath) {
            this.footnoteIds.add(ref);
          } else if (!this.linkReferences.has(ref.toLowerCase())) {
            this.linkReferences.set(ref.toLowerCase(), content);
          }
        }
      } else if (
        token.type === TokenType.TEXT ||
        token.type === TokenType.HEADING ||
        token.type === TokenType.BULLET_LIST ||
        token.type === TokenType.ORDERED_LIST ||
        token.type === TokenType.TASK_LIST ||
        token.type === TokenType.DEFINITION
      ) {
        // Inline abbreviations extraction: abbreviation{abbr="definition"}
        const value = token.value;
        const regex = /([A-Za-z0-9μ]+)\{abbr="([^"]+)"[^}]*}/g;
        let match;
        while ((match = regex.exec(value)) !== null) {
          const abbreviation = match[1];
          const definition = match[2];
          if (!this.abbreviationDefinitions.has(abbreviation)) {
            this.abbreviationDefinitions.set(abbreviation, definition);
          }
        }
      }
    }

    return {
      abbreviations: this.abbreviationDefinitions,
      linkReferences: this.linkReferences,
      globalAbbreviations: this.globalAbbreviations,
      footnotes: this.footnoteIds,
    };
  }
}
