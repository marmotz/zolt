import { type Token, TokenType } from '../../lexer/token-types';
import type { InlineParser } from '../inline-parser';
import type {
  ASTNode,
  Attributes,
  ChartDataPoint,
  ChartNode,
  ChartSeriesNode,
  MermaidNode,
  TripleColonBlockNode,
} from '../types';

export class TripleColonParser {
  constructor(private inlineParser: InlineParser) {}

  public parseTripleColonBlock(
    advance: () => Token,
    expect: (type: TokenType) => Token,
    match: (...types: TokenType[]) => boolean,
    skipNewlines: () => void,
    isEof: () => boolean,
    parseBlock: () => ASTNode | null,
    warn: (message: string, code: string) => void
  ): ASTNode {
    const startToken = expect(TokenType.TRIPLE_COLON_START);
    const value = startToken.value;

    // Extract attributes
    let attributes: Attributes | undefined;
    const attrMatch = value.match(/\s+\{([^}]+)}$/);
    let remaining = value;
    if (attrMatch) {
      const attrContent = attrMatch[1];
      const isSpecialBlock = value.trim().startsWith('if ') || value.trim().startsWith('foreach ');
      let shouldSkip =
        attrContent.startsWith('$') ||
        attrContent.startsWith('{') ||
        attrContent.includes(' as $') ||
        attrContent.startsWith('!') ||
        attrContent.startsWith('(');

      if (isSpecialBlock && !shouldSkip) {
        const beforeAttrs = value.substring(0, value.length - attrMatch[0].length);
        if (!beforeAttrs.includes('{')) {
          shouldSkip = true;
        }
      }

      if (!shouldSkip) {
        attributes = this.inlineParser.parseAttributes(attrContent);
        remaining = value.replace(/\s+\{([^}]+)}$/, '').trim();
      }
    }

    // Extract title [Title]
    let title: string | undefined;
    const isSpecialBlock =
      remaining.match(/^(if|foreach)(\s|{|$)/) ||
      remaining === 'if true' ||
      remaining === 'if false' ||
      remaining === 'if null';
    const titleMatch = !isSpecialBlock ? remaining.match(/\s+\[([^\]]+)]$/) : null;
    let blockType = remaining;
    if (titleMatch) {
      title = titleMatch[1];
      blockType = remaining.replace(/\s+\[([^\]]+)]$/, '').trim();
    }

    // Handle Mermaid blocks
    if (blockType === 'mermaid') {
      return this.parseMermaidBlock(advance, match, isEof);
    }

    // Handle Chart blocks
    if (blockType === 'chart' || blockType.startsWith('chart-')) {
      return this.parseChartBlock(blockType, title, attributes, advance, match, skipNewlines, isEof);
    }

    const children: ASTNode[] = [];
    skipNewlines();

    while (!isEof() && !match(TokenType.TRIPLE_COLON_END)) {
      const block = parseBlock();
      if (block) {
        children.push(block);
      }
      skipNewlines();
    }

    if (match(TokenType.TRIPLE_COLON_END)) {
      advance();
    } else {
      warn(`Unclosed triple colon block starting with :::${blockType}`, 'UNCLOSED_TRIPLE_COLON_BLOCK');
    }

    return {
      type: 'TripleColonBlock',
      blockType,
      title,
      children,
      attributes,
    } as TripleColonBlockNode;
  }

  private parseMermaidBlock(
    advance: () => Token,
    match: (...types: TokenType[]) => boolean,
    isEof: () => boolean
  ): MermaidNode {
    const content: string[] = [];

    while (!isEof() && !match(TokenType.TRIPLE_COLON_END)) {
      const token = advance();
      content.push(token.value);
    }

    if (match(TokenType.TRIPLE_COLON_END)) {
      advance();
    }

    return {
      type: 'Mermaid',
      content: content.join('').trim(),
    };
  }

  private parseChartBlock(
    blockType: string,
    title: string | undefined,
    attributes: Attributes | undefined,
    advance: () => Token,
    match: (...types: TokenType[]) => boolean,
    skipNewlines: () => void,
    isEof: () => boolean
  ): ChartNode {
    const isDirectChartType = blockType.startsWith('chart-');

    if (isDirectChartType) {
      const chartType = blockType.replace('chart-', '') as ChartSeriesNode['chartType'];
      const data = this.parseChartDataDirect(advance, match, isEof);

      if (match(TokenType.TRIPLE_COLON_END)) {
        advance();
      }

      const series: ChartSeriesNode = {
        type: 'ChartSeries',
        chartType,
        title,
        data,
        attributes,
      };

      return {
        type: 'Chart',
        children: [series],
        attributes: {},
        layout: undefined,
      };
    }

    const series: ChartSeriesNode[] = [];
    skipNewlines();

    while (!isEof() && !match(TokenType.TRIPLE_COLON_END)) {
      if (match(TokenType.TRIPLE_COLON_START)) {
        const chartStartToken = advance();
        const chartValue = chartStartToken.value;

        let chartAttributes: Attributes | undefined;
        const chartAttrMatch = chartValue.match(/\s+\{([^}]+)}$/);
        let chartRemaining = chartValue;
        if (chartAttrMatch) {
          chartAttributes = this.inlineParser.parseAttributes(chartAttrMatch[1]);
          chartRemaining = chartValue.replace(/\s+\{([^}]+)}$/, '').trim();
        }

        let chartTitle: string | undefined;
        const chartTitleMatch = chartRemaining.match(/\s+\[([^\]]+)]$/);
        let chartBlockType = chartRemaining;
        if (chartTitleMatch) {
          chartTitle = chartTitleMatch[1];
          chartBlockType = chartRemaining.replace(/\s+\[([^\]]+)]$/, '').trim();
        }

        if (chartBlockType.startsWith('chart-')) {
          const chartType = chartBlockType.replace('chart-', '') as ChartSeriesNode['chartType'];
          const data = this.parseChartDataDirect(advance, match, isEof);

          if (match(TokenType.TRIPLE_COLON_END)) {
            advance();
          }

          series.push({
            type: 'ChartSeries',
            chartType,
            title: chartTitle,
            data,
            attributes: chartAttributes,
          });

          skipNewlines();
          continue;
        } else {
          this.skipTripleColonBlock(advance, match, isEof);
        }
      } else {
        advance();
      }
      skipNewlines();
    }

    if (match(TokenType.TRIPLE_COLON_END)) {
      advance();
    }

    return {
      type: 'Chart',
      children: series,
      attributes,
      layout: attributes?.layout as 'horizontal' | 'vertical' | undefined,
    };
  }

  private skipTripleColonBlock(
    advance: () => Token,
    match: (...types: TokenType[]) => boolean,
    isEof: () => boolean
  ): void {
    let depth = 1;
    while (depth > 0 && !isEof()) {
      if (match(TokenType.TRIPLE_COLON_START)) {
        depth++;
        advance();
      } else if (match(TokenType.TRIPLE_COLON_END)) {
        depth--;
        advance();
      } else {
        advance();
      }
    }
  }

  private parseChartDataDirect(
    advance: () => Token,
    match: (...types: TokenType[]) => boolean,
    isEof: () => boolean
  ): ChartDataPoint[] {
    const data: ChartDataPoint[] = [];
    this.skipNewlinesWithAdvance(advance, match);

    while (!isEof() && !match(TokenType.TRIPLE_COLON_END)) {
      if (match(TokenType.NEWLINE)) {
        advance();
        continue;
      }

      const lineText = this.readUntilNewline(advance, match, isEof);
      if (lineText.trim()) {
        const dataPoint = this.parseChartDataLine(lineText.trim());
        if (dataPoint) {
          data.push(dataPoint);
        }
      }

      if (match(TokenType.NEWLINE)) {
        advance();
      }
    }

    return data;
  }

  private readUntilNewline(
    advance: () => Token,
    match: (...types: TokenType[]) => boolean,
    isEof: () => boolean
  ): string {
    let text = '';
    while (!isEof() && !match(TokenType.NEWLINE) && !match(TokenType.TRIPLE_COLON_END)) {
      text += advance().value;
    }

    return text;
  }

  private skipNewlinesWithAdvance(advance: () => Token, match: (...types: TokenType[]) => boolean): void {
    while (match(TokenType.NEWLINE)) {
      advance();
    }
  }

  private parseChartDataLine(line: string): ChartDataPoint | null {
    const trimmed = line.trim();
    if (!trimmed) {
      return null;
    }

    const match = trimmed.match(/^([^:]+):\s*(.+)$/);
    if (!match) {
      return null;
    }

    const [, label, rawValue] = match;
    const value = this.parseChartValue(rawValue.trim());

    return { label: label.trim(), value };
  }

  private parseChartValue(rawValue: string): string | number {
    const numMatch = rawValue.match(/^[\d,.]+$/);
    if (numMatch) {
      const cleaned = rawValue.replace(/,/g, '');
      const num = parseFloat(cleaned);
      if (!Number.isNaN(num)) {
        return num;
      }
    }

    return rawValue;
  }
}
