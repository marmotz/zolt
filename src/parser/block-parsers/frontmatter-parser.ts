import { Token, TokenType } from '../../lexer/token-types';
import { FrontmatterNode } from '../types';

export class FrontmatterParser {
  public parseFrontmatter(expect: (type: TokenType) => Token): FrontmatterNode {
    const token = expect(TokenType.FRONTMATTER);
    const content = token.value;
    const data: Record<string, any> = {};

    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === '---') continue;

      const match = trimmed.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
      if (match) {
        const key = match[1];
        const rawValue = match[2].trim();
        data[key] = this.parseYamlValue(rawValue);
      }
    }

    return {
      type: 'Frontmatter',
      data,
    };
  }

  private parseYamlValue(value: string): any {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }

    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1).trim();
      if (!inner) return [];
      return inner.split(',').map((v) => this.parseYamlValue(v.trim()));
    }

    if (!isNaN(Number(value)) && value !== '') {
      return Number(value);
    }

    return value;
  }
}
