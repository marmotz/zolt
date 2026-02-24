import { Token, TokenType } from '../lexer/token-types';

export class DefinitionCollector {
  private abbreviationDefinitions: Map<string, string> = new Map();
  private linkReferences: Map<string, string> = new Map();
  public static globalAbbreviations: Map<string, string> = new Map();

  public static clearGlobalAbbreviations(): void {
    this.globalAbbreviations.clear();
  }

  public collect(tokens: Token[]): {
    abbreviations: Map<string, string>;
    linkReferences: Map<string, string>;
    globalAbbreviations: Map<string, string>;
  } {
    this.abbreviationDefinitions.clear();
    this.linkReferences.clear();

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type === TokenType.ABBREVIATION_DEF || token.type === TokenType.ABBREVIATION_DEF_GLOBAL) {
        const value = token.value;
        const colonIndex = value.indexOf(':');
        if (colonIndex !== -1) {
          const abbreviation = value.substring(0, colonIndex);
          const definition = value.substring(colonIndex + 1);

          if (token.type === TokenType.ABBREVIATION_DEF_GLOBAL) {
            if (!DefinitionCollector.globalAbbreviations.has(abbreviation)) {
              DefinitionCollector.globalAbbreviations.set(abbreviation, definition);
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
          const url = value.substring(colonIndex + 1);
          if (!this.linkReferences.has(ref.toLowerCase())) {
            this.linkReferences.set(ref.toLowerCase(), url);
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
      globalAbbreviations: DefinitionCollector.globalAbbreviations,
    };
  }
}
