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

    it('should parse arrays', () => {
      const raw = 'tags: [tag1, tag2, tag3]';
      const data = FileMetadataUtils.parse(raw);
      expect(data.tags).toEqual(['tag1', 'tag2', 'tag3']);
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
