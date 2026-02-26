import * as fs from 'fs';
import * as path from 'path';
import { FileMetadataUtils } from './file-metadata';

export interface ProjectNode {
  path: string;
  absPath: string;
  title: string;
  children: ProjectNode[];
}

export class ProjectGraphBuilder {
  private visited = new Set<string>();
  private entryPoint: string = '';

  constructor(entryPoint: string) {
    this.entryPoint = path.resolve(entryPoint);
  }

  public build(): ProjectNode | null {
    if (!fs.existsSync(this.entryPoint)) {
      return null;
    }
    return this.scan(this.entryPoint);
  }

  private scan(currentPath: string): ProjectNode {
    const absPath = path.resolve(currentPath);
    this.visited.add(absPath);

    const content = fs.readFileSync(absPath, 'utf-8');
    const rawMetadata = FileMetadataUtils.extractRaw(content);
    const metadata = rawMetadata ? FileMetadataUtils.parse(rawMetadata) : {};
    const title = metadata.title || path.basename(absPath, '.zlt');

    const children: ProjectNode[] = [];
    const dir = path.dirname(absPath);

    // Simple regex to find links and includes
    // 1. [text](link.zlt)
    // 2. :::include link.zlt
    const links = new Set<string>();

    // Remove code blocks to avoid false positives
    const cleanContent = content.replace(/```[\s\S]*?```/g, '');

    const linkRegex = /\[.*?]\(([^)]+\.zlt)\)|:::include\s+(\S+)/g;
    let match;
    while ((match = linkRegex.exec(cleanContent)) !== null) {
      const link = match[1] || match[2];
      if (link && link.endsWith('.zlt') && !link.startsWith('http')) {
        links.add(link);
      }
    }

    for (const link of links) {
      const childPath = path.resolve(dir, link);
      if (fs.existsSync(childPath) && !this.visited.has(childPath)) {
        children.push(this.scan(childPath));
      }
    }

    return {
      path: path.relative(path.dirname(this.entryPoint), absPath),
      absPath,
      title,
      children,
    };
  }
}
