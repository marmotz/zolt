import { Token, TokenType } from '../../lexer/token-types';
import { FileMetadataUtils } from '../../utils/file-metadata';
import { FileMetadataNode } from '../types';

export class FileMetadataParser {
  private static readonly KNOWN_KEYS = new Set([
    'title',
    'author',
    'date',
    'version',
    'tags',
    'description',
    'keywords',
    'robots',
    'image',
    'lang',
    'toc',
    'theme',
    'color-scheme',
  ]);

  public parseFileMetadata(
    expect: (type: TokenType) => Token,
    reportWarning: (message: string, line: number, column: number, code: string) => void
  ): FileMetadataNode {
    const token = expect(TokenType.FILE_METADATA);
    const data = FileMetadataUtils.parse(token.value);

    // Validate keys
    const lines = token.value.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^([a-zA-Z0-9_-]+)\s*:/);
      if (match) {
        const key = match[1];
        if (!FileMetadataParser.KNOWN_KEYS.has(key)) {
          reportWarning(`Unknown metadata field: "${key}"`, token.line + i, 1, 'UNKNOWN_METADATA');
        }
      }
    }

    return {
      type: 'FileMetadata',
      data,
    };
  }
}
