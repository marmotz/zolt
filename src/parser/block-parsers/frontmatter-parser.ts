import { Token, TokenType } from '../../lexer/token-types';
import { FrontmatterNode } from '../types';
import { FrontmatterUtils } from '../../utils/frontmatter';

export class FrontmatterParser {
  public parseFrontmatter(expect: (type: TokenType) => Token): FrontmatterNode {
    const token = expect(TokenType.FRONTMATTER);
    const data = FrontmatterUtils.parse(token.value);

    return {
      type: 'Frontmatter',
      data,
    };
  }
}
