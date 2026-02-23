import { ContentProcessor } from './content-processor';
import { ExpressionEvaluator } from './expression-evaluator';

export class SourceEvaluator {
  private evaluator: ExpressionEvaluator;
  private contentProcessor: ContentProcessor;

  constructor(evaluator: ExpressionEvaluator) {
    this.evaluator = evaluator;
    this.contentProcessor = new ContentProcessor(evaluator);
  }

  evaluate(source: string): string {
    const lines = source.split('\n');
    const result: string[] = [];
    let i = 0;
    let inCodeBlock = false;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

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

  private collectBlock(lines: string[], startIndex: number): { blockLines: string[]; nextIndex: number } {
    const blockLines: string[] = [];
    let i = startIndex + 1;
    let depth = 1;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith(':::') && trimmed.length > 3 && !trimmed.startsWith('::::')) {
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
    if (!foreachInfo) return '';

    const collection = this.contentProcessor.getCollection(foreachInfo.collection);
    if (!collection || collection.length === 0) return '';

    const results: string[] = [];

    for (let i = 0; i < collection.length; i++) {
      const item = collection[i];

      const childEvaluator = this.evaluator.createChildScope();
      childEvaluator.setVariable(foreachInfo.iterator, item);
      childEvaluator.setVariable('foreach', {
        index: i,
        index1: i + 1,
        first: i === 0,
        last: i === collection.length - 1,
        even: i % 2 === 0,
        odd: i % 2 === 1,
      });

      const childEvaluatorWrapper = new SourceEvaluator(childEvaluator);
      results.push(childEvaluatorWrapper.evaluate(blockContent));
    }

    return results.join('\n');
  }
}
