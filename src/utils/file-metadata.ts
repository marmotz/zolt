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
    const data: Record<string, any> = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === '---') continue;

      const match = trimmed.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
      if (match) {
        const key = match[1];
        const rawValue = match[2].trim();
        data[key] = this.parseValue(rawValue);
      }
    }

    return data;
  }

  public static parseValue(value: string): any {
    if (value === 'true') {
      return true;
    }
    if (value === 'false') {
      return false;
    }
    if (value === 'null') {
      return null;
    }

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }

    if (value.startsWith('[') && value.endsWith(']')) {
      const inner = value.slice(1, -1).trim();
      if (!inner) {
        return [];
      }

      return inner.split(',').map((v) => this.parseValue(v.trim()));
    }

    if (!isNaN(Number(value)) && value !== '') {
      return Number(value);
    }

    return value;
  }

  public static extractRaw(content: string): string | null {
    const match = content.match(/^---\n([\s\S]+?)\n---/);

    return match ? match[1] : null;
  }
}
