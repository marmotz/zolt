import { describe, expect, it } from 'bun:test';
import { FrontmatterUtils } from './frontmatter';

describe('FrontmatterUtils', () => {
  describe('extractRaw', () => {
    it('should extract frontmatter from a document', () => {
      const content = '---\ntitle: "Test"\nauthor: "Me"\n---\nBody content';
      const raw = FrontmatterUtils.extractRaw(content);
      expect(raw).toBe('title: "Test"\nauthor: "Me"');
    });

    it('should return null if no frontmatter is found', () => {
      const content = '# No Frontmatter';
      const raw = FrontmatterUtils.extractRaw(content);
      expect(raw).toBeNull();
    });
  });

  describe('parse', () => {
    it('should parse simple key-value pairs', () => {
      const raw = 'title: "Test Document"\nversion: 1.0\npublic: true';
      const data = FrontmatterUtils.parse(raw);
      expect(data).toEqual({
        title: 'Test Document',
        version: 1,
        public: true,
      });
    });

    it('should parse arrays', () => {
      const raw = 'tags: [tag1, tag2, tag3]';
      const data = FrontmatterUtils.parse(raw);
      expect(data.tags).toEqual(['tag1', 'tag2', 'tag3']);
    });
  });

  describe('parseValue', () => {
    it('should parse booleans', () => {
      expect(FrontmatterUtils.parseValue('true')).toBe(true);
      expect(FrontmatterUtils.parseValue('false')).toBe(false);
    });

    it('should parse numbers', () => {
      expect(FrontmatterUtils.parseValue('123')).toBe(123);
      expect(FrontmatterUtils.parseValue('12.34')).toBe(12.34);
    });

    it('should parse quoted strings', () => {
      expect(FrontmatterUtils.parseValue('"quoted value"')).toBe('quoted value');
      expect(FrontmatterUtils.parseValue("'single quoted'")).toBe('single quoted');
    });

    it('should parse null', () => {
      expect(FrontmatterUtils.parseValue('null')).toBeNull();
    });
  });
});
