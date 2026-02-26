import * as fs from 'fs';
import * as path from 'path';
import { ContentProcessor } from './content-processor';
import { ExpressionEvaluator } from './expression-evaluator';

export class SourceEvaluator {
  private evaluator: ExpressionEvaluator;
  private contentProcessor: ContentProcessor;
  private filePath: string;
  private includeStack: string[];
  private readonly MAX_INCLUDE_DEPTH = 10;

  constructor(evaluator: ExpressionEvaluator, filePath: string = 'unknown', includeStack: string[] = []) {
    this.evaluator = evaluator;
    this.contentProcessor = new ContentProcessor(evaluator);
    this.filePath = filePath;
    this.includeStack = includeStack;
  }

  evaluate(source: string): string {
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

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      // Handle file metadata (frontmatter) at the very beginning
      if (!fileMetadataProcessed && i === firstNonEmptyLineIndex && trimmed === '---') {
        const metadataLines: string[] = [];
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

        // Keep metadata in the output for the Parser to handle properly later
        result.push(...metadataLines);
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

      if (trimmed.startsWith(':::foreach')) {
        const { blockLines, nextIndex } = this.collectBlock(lines, i);
        const blockType = trimmed.substring(3).trim();
        const expanded = this.evaluateForeach(blockType, blockLines.join('\n'));
        result.push(expanded);
        i = nextIndex;
      } else if (trimmed.startsWith(':::if')) {
        const { blockLines, nextIndex } = this.collectBlock(lines, i);
        const condition = trimmed.substring(5).trim();
        if (this.contentProcessor.evaluateCondition(condition)) {
          result.push(this.evaluate(blockLines.join('\n')));
        }
        i = nextIndex;
      } else if (trimmed.startsWith(':::include')) {
        const rawPath = trimmed.substring(10).trim();
        const includePath = this.contentProcessor.processContent(rawPath);
        const expanded = this.evaluateInclude(includePath);
        result.push(expanded);
        i++;
      } else if (trimmed.startsWith(':::comment')) {
        const { nextIndex } = this.collectBlock(lines, i);
        i = nextIndex;
      } else {
        // Variable definitions or normal content
        const processed = this.contentProcessor.processContent(line);
        result.push(processed);
        i++;
      }
    }

    return result.join('\n');
  }

  private processMetadata(lines: string[]): void {
    if (lines.length < 2) return;

    // Simple YAML-like parser for frontmatter
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '---') continue;

      const match = trimmed.match(/^([a-zA-Z_]\w*)\s*:\s*(.*)$/);
      if (match) {
        const key = match[1];
        const value = match[2].trim();

        // Use the evaluator to parse the value (handle numbers, booleans, strings)
        this.evaluator.setVariable(key, this.evaluator.parseValue(value));
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
    const targetPath = path.resolve(currentDir, includePath);

    if (currentIncludeStack.includes(targetPath)) {
      return `:::error Circular inclusion detected: ${includePath}:::`;
    }

    if (!fs.existsSync(targetPath)) {
      return `:::error Included file not found: ${includePath}:::`;
    }

    try {
      const content = fs.readFileSync(targetPath, 'utf8');
      const childEvaluator = new SourceEvaluator(this.evaluator, targetPath, currentIncludeStack);
      return childEvaluator.evaluate(content);
    } catch (err: any) {
      return `:::error Failed to process include: ${includePath} (${err.message}):::`;
    }
  }

  private collectBlock(lines: string[], startIndex: number): { blockLines: string[]; nextIndex: number } {
    const blockLines: string[] = [];
    let i = startIndex + 1;
    let depth = 1;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith(':::') && trimmed.length > 3 && !trimmed.startsWith('::::')) {
        // Only increment depth for blocks that require a matching :::
        // (if, foreach, details, tabs, etc.)
        depth++;
      } else if (trimmed === ':::') {
        depth--;
        if (depth === 0) break;
      }
      blockLines.push(line);
      i++;
    }

    return {
      blockLines,
      nextIndex: i + 1,
    };
  }

  private evaluateForeach(blockType: string, blockContent: string): string {
    const foreachInfo = this.contentProcessor.parseForeach(blockType);
    if (!foreachInfo) {
      return '';
    }

    const collection = this.contentProcessor.getCollection(foreachInfo.collection);
    if (!collection || collection.length === 0) {
      return '';
    }

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

      const childEvaluator = new SourceEvaluator(childScope, this.filePath, this.includeStack);
      results.push(childEvaluator.evaluate(blockContent));
    }

    return results.join('\n');
  }
}
