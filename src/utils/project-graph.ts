import * as fs from 'node:fs';
import * as path from 'node:path';
import { FileMetadataUtils } from './file-metadata';

export interface ProjectNode {
  path: string;
  absPath: string;
  title: string;
  children: ProjectNode[];
}

export class ProjectGraphBuilder {
  private readonly entryPoint: string = '';

  constructor(entryPoint: string) {
    this.entryPoint = path.resolve(entryPoint);
  }

  public build(): ProjectNode[] | null {
    if (!fs.existsSync(this.entryPoint)) {
      return null;
    }

    return this.buildGraph();
  }

  private getLinks(content: string, dir: string): string[] {
    const links: string[] = [];
    const cleanContent = content.replace(/```[\s\S]*?```/g, '');
    const linkRegex = /\[.*?]\(([^)]+\.zlt)\)|:::include\s+(\S+)/g;
    let match = linkRegex.exec(cleanContent);
    while (match !== null) {
      const link = match[1] || match[2];
      if (link?.endsWith('.zlt') && !link.startsWith('http')) {
        const absPath = path.resolve(dir, link);
        if (fs.existsSync(absPath)) {
          links.push(absPath);
        }
      }
      match = linkRegex.exec(cleanContent);
    }

    return links;
  }

  private getTitle(absPath: string): string {
    const content = fs.readFileSync(absPath, 'utf-8');
    const rawMetadata = FileMetadataUtils.extractRaw(content);
    const metadata = rawMetadata ? FileMetadataUtils.parse(rawMetadata) : {};

    const title = metadata.title;

    return typeof title === 'string' ? title : path.basename(absPath, '.zlt');
  }

  private buildGraph(): ProjectNode[] {
    const entryContent = fs.readFileSync(this.entryPoint, 'utf-8');
    const entryDir = path.dirname(this.entryPoint);
    const entryMetadata = FileMetadataUtils.extractRaw(entryContent)
      ? FileMetadataUtils.parse(FileMetadataUtils.extractRaw(entryContent)!)
      : {};
    const metadataTitle = entryMetadata.title;
    const entryTitle = typeof metadataTitle === 'string' ? metadataTitle : path.basename(this.entryPoint, '.zlt');

    const processedPaths = new Set<string>();
    processedPaths.add(this.entryPoint);

    const rootNode: ProjectNode = {
      path: path.relative(entryDir, this.entryPoint),
      absPath: this.entryPoint,
      title: entryTitle,
      children: this.scanNodes(this.entryPoint, processedPaths),
    };

    return [rootNode];
  }

  private scanNodes(currentPath: string, processedPaths: Set<string>): ProjectNode[] {
    const absPath = path.resolve(currentPath);
    const dir = path.dirname(absPath);
    const links = this.getLinks(fs.readFileSync(absPath, 'utf-8'), dir);
    const nodes: ProjectNode[] = [];

    for (const linkPath of links) {
      if (!processedPaths.has(linkPath)) {
        processedPaths.add(linkPath);
        const absPath = path.resolve(linkPath);
        nodes.push({
          path: path.relative(path.dirname(this.entryPoint), absPath),
          absPath,
          title: this.getTitle(absPath),
          children: [],
        });
      }
    }

    return nodes.map((node) => ({
      ...node,
      children: this.scanNodes(node.absPath, processedPaths),
    }));
  }
}
