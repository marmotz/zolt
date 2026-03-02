import * as fs from 'node:fs';
import * as path from 'node:path';
import { FileMetadataUtils } from '../../utils/file-metadata';
import { ContentProcessor } from './content-processor';
import type { ExpressionEvaluator, Value } from './expression-evaluator';

export class SourceEvaluator {
  private evaluator: ExpressionEvaluator;
  private contentProcessor: ContentProcessor;
  private filePath: string;
  private includeStack: string[];
  private contentToInject?: string;
  private isLayoutProcessing: boolean;
  private allowLayout: boolean;
  private readonly MAX_INCLUDE_DEPTH = 10;

  constructor(
    evaluator: ExpressionEvaluator,
    filePath: string = 'unknown',
    includeStack: string[] = [],
    contentToInject?: string,
    isLayoutProcessing: boolean = false,
    allowLayout: boolean = false
  ) {
    this.evaluator = evaluator;
    this.contentProcessor = new ContentProcessor(evaluator);
    this.filePath = filePath;
    this.includeStack = includeStack;
    this.contentToInject = contentToInject;
    this.isLayoutProcessing = isLayoutProcessing;
    this.allowLayout = allowLayout;
  }

  evaluate(source: string, allowRootLayout = this.allowLayout): string {
    const lines = source.split('\n');
    const result: string[] = [];
    let i = 0;
    let inCodeBlock = false;

    let firstNonEmptyLineIndex = -1;
    for (let j = 0; j < lines.length; j++) {
      if (lines[j].trim() !== '') {
        firstNonEmptyLineIndex = j;
        break;
      }
    }

    let fileMetadataProcessed = false;
    const metadataLines: string[] = [];
    let rootLayout: string | undefined;

    // Initial check for layout from project metadata
    if (allowRootLayout && !this.isLayoutProcessing) {
      const layoutVar = this.evaluator.getVariable('layout');
      if (typeof layoutVar === 'string') {
        rootLayout = layoutVar;
      }
    }

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Handle file metadata at the very beginning
      if (!fileMetadataProcessed && i === firstNonEmptyLineIndex && trimmed === '---') {
        metadataLines.push(line);
        i++;
        while (i < lines.length && lines[i].trim() !== '---') {
          metadataLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) {
          metadataLines.push(lines[i]);
          i++;
        }

        // Process metadata to extract variables
        this.processMetadata(metadataLines);

        // Update root layout if defined in file metadata
        if (allowRootLayout && !this.isLayoutProcessing) {
          const layoutVar = this.evaluator.getVariable('layout');
          if (typeof layoutVar === 'string') {
            rootLayout = layoutVar;
          }
        }

        fileMetadataProcessed = true;
        continue;
      }

      if (trimmed !== '') {
        fileMetadataProcessed = true;
      }

      if (trimmed.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        result.push(line);
        i++;
        continue;
      }

      if (inCodeBlock) {
        result.push(line);
        i++;
        continue;
      }

      let processedLine = line;
      if (this.contentToInject !== undefined && processedLine.includes(':::content:::')) {
        processedLine = processedLine.replace(/:::content:::/g, () => this.contentToInject!);
        result.push(processedLine);
        i++;
        continue;
      }

      const trimmedProcessed = processedLine.trim();

      if (trimmedProcessed.startsWith(':::foreach')) {
        const { branches, nextIndex } = this.collectMultipartBlock(lines, i, ['else']);
        const expanded = this.evaluateForeachMultipart(branches);
        result.push(expanded);
        i = nextIndex;
      } else if (trimmedProcessed.startsWith(':::if')) {
        const { branches, nextIndex } = this.collectMultipartBlock(lines, i, ['elseif', 'else']);
        const expanded = this.evaluateIfMultipart(branches);
        result.push(expanded);
        i = nextIndex;
      } else if (trimmedProcessed.startsWith(':::elseif') || trimmedProcessed.startsWith(':::else')) {
        // Discard standalone branching block
        const { nextIndex } = this.collectMultipartBlock(lines, i, ['elseif', 'else']);
        i = nextIndex;
      } else if (trimmedProcessed.startsWith(':::include')) {
        const rawPath = trimmedProcessed.substring(10).trim();
        const includePath = this.contentProcessor.processContent(rawPath);
        const expanded = this.evaluateInclude(includePath);
        result.push(expanded);
        i++;
      } else if (trimmedProcessed.startsWith('{{include') && trimmedProcessed.endsWith('}}')) {
        const rawPath = trimmedProcessed.substring(9, trimmedProcessed.length - 2).trim();
        const includePath = this.contentProcessor.processContent(rawPath);
        const expanded = this.evaluateInclude(includePath);
        result.push(expanded);
        i++;
      } else if (trimmedProcessed.startsWith(':::comment')) {
        const { nextIndex } = this.collectMultipartBlock(lines, i, []);
        i = nextIndex;
      } else {
        // Variable definitions or normal content
        const processed = this.contentProcessor.processContent(processedLine);
        result.push(processed);
        i++;
      }
    }

    const expandedBody = result.join('\n');

    // Only apply layout if we are allowed to (typically at the root level)
    if (rootLayout) {
      return this.evaluateLayout(rootLayout, expandedBody, metadataLines);
    }

    if (metadataLines.length > 0) {
      return `${metadataLines.join('\n')}\n${expandedBody}`;
    }

    return expandedBody;
  }

  private evaluateLayout(layoutPath: string, contentToInject: string, documentMetadataLines: string[]): string {
    const currentIncludeStack = [...this.includeStack];

    if (this.filePath !== 'unknown') {
      const absoluteFilePath = path.resolve(this.filePath);
      if (!currentIncludeStack.includes(absoluteFilePath)) {
        currentIncludeStack.push(absoluteFilePath);
      }
    }

    const currentDir = this.filePath !== 'unknown' ? path.dirname(this.filePath) : process.cwd();
    const targetPath = this.findLayout(currentDir, layoutPath);

    if (!targetPath) {
      const metadata = documentMetadataLines.length > 0 ? `${documentMetadataLines.join('\n')}\n` : '';

      return `${metadata}:::error Layout file not found: ${layoutPath}:::\n${contentToInject}`;
    }

    try {
      const layoutContent = fs.readFileSync(targetPath, 'utf8');

      const layoutEvaluator = new SourceEvaluator(
        this.evaluator,
        targetPath,
        currentIncludeStack,
        contentToInject,
        true,
        false
      );
      const expandedLayout = layoutEvaluator.evaluate(layoutContent);

      let layoutMetadata: string[] = [];
      let layoutBody = expandedLayout;

      if (expandedLayout.startsWith('---')) {
        const secondDashIndex = expandedLayout.indexOf('---', 3);
        if (secondDashIndex !== -1) {
          const endOfSecondDash = expandedLayout.indexOf('\n', secondDashIndex);
          const metadataContent = expandedLayout.substring(expandedLayout.indexOf('\n') + 1, secondDashIndex).trim();
          if (metadataContent) {
            layoutMetadata = metadataContent.split('\n');
          }
          layoutBody = expandedLayout.substring(endOfSecondDash !== -1 ? endOfSecondDash + 1 : secondDashIndex + 3);
        }
      }

      const docMetadata = documentMetadataLines.filter((l) => l.trim() !== '---');
      const mergedMetadata = [...layoutMetadata, ...docMetadata];

      if (mergedMetadata.length > 0) {
        return `---\n${mergedMetadata.join('\n')}\n---${layoutBody}`;
      }

      return layoutBody;
    } catch (err: any) {
      const metadata = documentMetadataLines.length > 0 ? `${documentMetadataLines.join('\n')}\n` : '';

      return `${metadata}:::error Failed to process layout: ${layoutPath} (${err.message}):::\n${contentToInject}`;
    }
  }

  private findLayout(startDir: string, layoutPath: string): string | null {
    let currentDir = startDir;

    while (true) {
      const targetPath = path.resolve(currentDir, layoutPath);
      if (fs.existsSync(targetPath)) {
        return targetPath;
      }

      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) {
        // We've reached the root directory
        break;
      }
      currentDir = parentDir;
    }

    return null;
  }

  private processMetadata(lines: string[]): void {
    if (lines.length < 2) {
      return;
    }

    const content = lines.join('\n');
    const data = FileMetadataUtils.parse(content);

    for (const [key, value] of Object.entries(data)) {
      // If we are processing a layout, we don't want to override variables
      // already set by the document or project metadata.
      if (this.isLayoutProcessing) {
        if (this.evaluator.getVariable(key) === undefined) {
          this.evaluator.setVariable(key, value as Value);
        }
      } else {
        this.evaluator.setVariable(key, value as Value);
      }
    }
  }

  private evaluateInclude(includePath: string): string {
    const currentIncludeStack = [...this.includeStack];

    if (this.filePath !== 'unknown') {
      const absoluteFilePath = path.resolve(this.filePath);
      if (!currentIncludeStack.includes(absoluteFilePath)) {
        currentIncludeStack.push(absoluteFilePath);
      }
    }

    if (currentIncludeStack.length >= this.MAX_INCLUDE_DEPTH) {
      return `:::error Max inclusion depth reached: ${this.MAX_INCLUDE_DEPTH}:::`;
    }

    const currentDir = this.filePath !== 'unknown' ? path.dirname(this.filePath) : process.cwd();
    const targetPath = this.findInclude(currentDir, includePath);

    if (!targetPath) {
      return `:::error Included file not found: ${includePath}:::`;
    }

    if (currentIncludeStack.includes(targetPath)) {
      return `:::error Circular inclusion detected: ${includePath}:::`;
    }

    try {
      const content = fs.readFileSync(targetPath, 'utf8');
      const childEvaluator = new SourceEvaluator(
        this.evaluator,
        targetPath,
        currentIncludeStack,
        undefined,
        false,
        false
      );

      return childEvaluator.evaluate(content);
    } catch (err: any) {
      return `:::error Failed to process include: ${includePath} (${err.message}):::`;
    }
  }

  private findInclude(startDir: string, includePath: string): string | null {
    let currentDir = startDir;

    while (true) {
      const targetPath = path.resolve(currentDir, includePath);
      if (fs.existsSync(targetPath)) {
        return targetPath;
      }

      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) {
        break;
      }
      currentDir = parentDir;
    }

    return null;
  }

  private collectMultipartBlock(
    lines: string[],
    startIndex: number,
    branchKeywords: string[]
  ): { branches: { keyword: string; content: string[] }[]; nextIndex: number } {
    const branches: { keyword: string; content: string[] }[] = [];

    const firstLine = lines[startIndex];
    let currentKeyword = firstLine.trim().substring(3).trim();
    let currentContent: string[] = [];

    let i = startIndex + 1;
    let depth = 1;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed === ':::') {
        depth--;
        if (depth === 0) {
          branches.push({ keyword: currentKeyword, content: currentContent });
          return { branches, nextIndex: i + 1 };
        }
        currentContent.push(line);
      } else if (trimmed.startsWith(':::') && trimmed.length > 3 && !trimmed.startsWith('::::')) {
        const keywordPart = trimmed.substring(3).trim();
        const keyword = keywordPart.split(/\s|{/)[0];

        if (depth === 1 && branchKeywords.includes(keyword)) {
          // New branch at same level
          branches.push({ keyword: currentKeyword, content: currentContent });
          currentKeyword = keywordPart;
          currentContent = [];
        } else {
          // If it's a branching keyword but depth > 1, it's nested, treat as normal block starter
          // If it's a known branching keyword, it doesn't increment depth
          if (keyword !== 'else' && keyword !== 'elseif') {
            depth++;
          }
          currentContent.push(line);
        }
      } else {
        currentContent.push(line);
      }
      i++;
    }

    // Unclosed block
    branches.push({ keyword: currentKeyword, content: currentContent });

    return { branches, nextIndex: i };
  }

  private evaluateIfMultipart(branches: { keyword: string; content: string[] }[]): string {
    for (let i = 0; i < branches.length; i++) {
      const branch = branches[i];
      const kw = branch.keyword.trim();

      if (kw.startsWith('if')) {
        const condition = kw.substring(2).trim();
        if (this.contentProcessor.evaluateCondition(condition)) {
          return this.evaluate(branch.content.join('\n'), false);
        }
      } else if (kw.startsWith('elseif')) {
        const condition = kw.substring(6).trim();
        if (this.contentProcessor.evaluateCondition(condition)) {
          return this.evaluate(branch.content.join('\n'), false);
        }
      } else if (kw === 'else') {
        return this.evaluate(branch.content.join('\n'), false);
      }
    }

    return '';
  }

  private evaluateForeachMultipart(branches: { keyword: string; content: string[] }[]): string {
    const mainBranch = branches[0];
    const foreachInfo = this.contentProcessor.parseForeach(mainBranch.keyword);
    if (!foreachInfo) {
      return '';
    }

    const collection = this.contentProcessor.getCollection(foreachInfo.collection);
    if (collection && collection.length > 0) {
      const results: string[] = [];

      for (let i = 0; i < collection.length; i++) {
        const item = collection[i];

        const childScope = this.evaluator.createChildScope();
        childScope.setVariable(foreachInfo.iterator, item);
        childScope.setVariable('foreach', {
          index: i,
          index1: i + 1,
          first: i === 0,
          last: i === collection.length - 1,
          even: i % 2 === 0,
          odd: i % 2 === 1,
        });

        const childEvaluator = new SourceEvaluator(
          childScope,
          this.filePath,
          this.includeStack,
          undefined,
          false,
          false
        );
        results.push(childEvaluator.evaluate(mainBranch.content.join('\n'), false));
      }

      return results.join('\n');
    }

    // Look for else branch if collection is empty
    const elseBranch = branches.find((b) => b.keyword.trim() === 'else');
    if (elseBranch) {
      return this.evaluate(elseBranch.content.join('\n'), false);
    }

    return '';
  }
}
