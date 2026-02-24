import { describe, expect, test } from 'bun:test';
import { Lexer } from '../lexer/lexer';
import { DefinitionCollector } from './definition-collector';

describe('DefinitionCollector', () => {
  test('should collect abbreviation definitions', () => {
    const lexer = new Lexer('*[Zolt]: A markdown-like language');
    const tokens = lexer.tokenize();
    const collector = new DefinitionCollector();
    const { abbreviations } = collector.collect(tokens);

    expect(abbreviations.get('Zolt')).toBe('A markdown-like language');
  });

  test('should collect global abbreviation definitions', () => {
    const lexer = new Lexer('**[Zolt]: A markdown-like language');
    const tokens = lexer.tokenize();
    const collector = new DefinitionCollector();
    DefinitionCollector.clearGlobalAbbreviations();
    const { globalAbbreviations } = collector.collect(tokens);

    expect(globalAbbreviations.get('Zolt')).toBe('A markdown-like language');
  });

  test('should collect link reference definitions', () => {
    const lexer = new Lexer('[zolt]: https://zolt.example.com');
    const tokens = lexer.tokenize();
    const collector = new DefinitionCollector();
    const { linkReferences } = collector.collect(tokens);

    expect(linkReferences.get('zolt')).toBe('https://zolt.example.com');
  });

  test('should collect inline abbreviation definitions', () => {
    const lexer = new Lexer('Zolt{abbr="A markdown-like language"}');
    const tokens = lexer.tokenize();
    const collector = new DefinitionCollector();
    const { abbreviations } = collector.collect(tokens);

    expect(abbreviations.get('Zolt')).toBe('A markdown-like language');
  });
});
