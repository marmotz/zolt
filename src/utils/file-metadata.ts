import { parse as parseYaml } from 'yaml';

export interface FileMetadata {
  created: Date;
  modified: Date;
}

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
  'color-scheme',
  'layout',
  'icon',
  'favicon',
  'icon_png',
  'icon_svg',
  'icon_ico',
  'icon_apple',
  'manifest',
  'site_name',
  'og_title',
  'og_description',
  'og_type',
  'url',
  'og_image_width',
  'og_image_height',
  'twitter_site',
  'twitter_creator',
]);

export function createFileDateVariables(metadata: FileMetadata): { created: string; modified: string } {
  return {
    created: metadata.created.toISOString(),
    modified: metadata.modified.toISOString(),
  };
}

export class FileMetadataUtils {
  public static parse(content: string): Record<string, any> {
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

      return data;
    } catch {
      return {};
    }
  }

  public static parseValue(value: string): any {
    try {
      return parseYaml(value);
    } catch {
      return value;
    }
  }

  public static extractRaw(content: string): string | null {
    const match = content.match(/^---\n([\s\S]+?)\n---/);

    return match ? match[1] : null;
  }
}
