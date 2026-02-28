import { describe, expect, it } from 'bun:test';
import { FileMetadataUtils } from './file-metadata';

describe('FileMetadataUtils', () => {
  describe('extractRaw', () => {
    it('should extract file metadata from a document', () => {
      const content = '---\ntitle: "Test"\nauthor: "Me"\n---\nBody content';
      const raw = FileMetadataUtils.extractRaw(content);
      expect(raw).toBe('title: "Test"\nauthor: "Me"');
    });

    it('should return null if no file metadata is found', () => {
      const content = '# No File Metadata';
      const raw = FileMetadataUtils.extractRaw(content);
      expect(raw).toBeNull();
    });
  });

  describe('parse', () => {
    it('should parse simple key-value pairs', () => {
      const raw = 'title: "Test Document"\nversion: 1.0\npublic: true';
      const data = FileMetadataUtils.parse(raw);
      expect(data).toEqual({
        title: 'Test Document',
        version: 1,
        public: true,
      });
    });

    it('should parse arrays with commas inside quoted strings', () => {
      const raw = 'tags: ["tag1, with comma", "tag2"]';
      const data = FileMetadataUtils.parse(raw);
      expect(data.tags).toEqual(['tag1, with comma', 'tag2']);
    });

    it('should parse multi-line strings with |', () => {
      const raw = 'description: |\n  Line 1\n  Line 2';
      const data = FileMetadataUtils.parse(raw);
      expect(data.description).toBe('Line 1\nLine 2\n');
    });

    it('should ignore comments', () => {
      const raw = 'title: "Test" # This is a comment\nauthor: Me # Another comment';
      const data = FileMetadataUtils.parse(raw);
      expect(data.title).toBe('Test');
      expect(data.author).toBe('Me');
    });

    it('should parse nested objects', () => {
      const raw = 'author:\n  name: Zolt\n  twitter: "@zolt"';
      const data = FileMetadataUtils.parse(raw);
      expect(data.author).toEqual({
        name: 'Zolt',
        twitter: '@zolt',
      });
    });

    it('should handle robustly the --- delimiters', () => {
      const raw = '---\ntitle: "Test"\n---';
      const data = FileMetadataUtils.parse(raw);
      expect(data.title).toBe('Test');
    });

    it('should parse lowerCamelCase keys as-is', () => {
      const raw = 'siteName: "Zolt"\nogImageWidth: 1024\nauthor: "Marmotz"';
      const data = FileMetadataUtils.parse(raw);
      expect(data).toEqual({
        siteName: 'Zolt',
        ogImageWidth: 1024,
        author: 'Marmotz',
      });
    });
  });

  describe('parseValue', () => {
    it('should parse booleans', () => {
      expect(FileMetadataUtils.parseValue('true')).toBe(true);
      expect(FileMetadataUtils.parseValue('false')).toBe(false);
    });

    it('should parse numbers', () => {
      expect(FileMetadataUtils.parseValue('123')).toBe(123);
      expect(FileMetadataUtils.parseValue('12.34')).toBe(12.34);
    });

    it('should parse quoted strings', () => {
      expect(FileMetadataUtils.parseValue('"quoted value"')).toBe('quoted value');
      expect(FileMetadataUtils.parseValue("'single quoted'")).toBe('single quoted');
    });

    it('should parse null', () => {
      expect(FileMetadataUtils.parseValue('null')).toBeNull();
    });
  });
});
