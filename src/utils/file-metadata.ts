import { parse as parseYaml } from 'yaml';

export const KNOWN_METADATA_KEYS = new Set([
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
  'colorScheme',
  'layout',
  'sidebar',
  'projectTitle',
  'icon',
  'favicon',
  'iconPng',
  'iconSvg',
  'iconIco',
  'iconApple',
  'manifest',
  'siteName',
  'ogTitle',
  'ogDescription',
  'ogType',
  'url',
  'ogImageWidth',
  'ogImageHeight',
  'twitterSite',
  'twitterCreator',
]);

export const FileMetadataUtils = {
  parse(content: string): Record<string, unknown> {
    try {
      // Remove leading/trailing delimiters if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('---')) {
        cleanContent = cleanContent.replace(/^---+\n?/, '');
      }
      if (cleanContent.endsWith('---')) {
        cleanContent = cleanContent.replace(/\n?---+\s*$/, '');
      }

      const data = parseYaml(cleanContent);
      if (typeof data !== 'object' || data === null) {
        return {};
      }

      return data as Record<string, unknown>;
    } catch {
      return {};
    }
  },

  parseValue(value: string): unknown {
    try {
      return parseYaml(value);
    } catch {
      return value;
    }
  },

  extractRaw(content: string): string | null {
    const match = content.match(/^---\n([\s\S]+?)\n---/);

    return match ? match[1] : null;
  },
};
