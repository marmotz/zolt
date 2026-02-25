import { describe, expect, test } from 'bun:test';
import { Lexer } from './lexer';
import { TokenType } from './token-types';

describe('Lexer - Include', () => {
  test('should tokenize simple include', () => {
    const lexer = new Lexer('{{include header.zlt}}');
    const tokens = lexer.tokenize();

    expect(tokens[0].type).toBe(TokenType.INCLUDE);
    expect(tokens[0].value).toBe('header.zlt');
  });

  test('should tokenize include with path', () => {
    const lexer = new Lexer('{{include ./shared/footer.zlt}}');
    const tokens = lexer.tokenize();

    expect(tokens[0].type).toBe(TokenType.INCLUDE);
    expect(tokens[0].value).toBe('./shared/footer.zlt');
  });

  test('should tokenize include with spaces', () => {
    const lexer = new Lexer('{{include   config.zlt   }}');
    const tokens = lexer.tokenize();

    expect(tokens[0].type).toBe(TokenType.INCLUDE);
    expect(tokens[0].value).toBe('config.zlt');
  });
});
