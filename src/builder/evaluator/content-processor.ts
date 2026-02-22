import { ExpressionEvaluator } from './expression-evaluator';

type Value = number | string | boolean | null | Value[] | { [key: string]: Value };

export class ContentProcessor {
  private evaluator: ExpressionEvaluator;

  constructor(evaluator: ExpressionEvaluator) {
    this.evaluator = evaluator;
  }

  processContent(content: string): string {
    if (!content) return '';

    let result = this.processVariableDefinitions(content);
    result = this.processExpressions(result);
    result = this.processVariableReferences(result);

    return result;
  }

  private processVariableDefinitions(content: string): string {
    const lines = content.split('\n');
    const resultLines: string[] = [];
    let pendingDefinition: { varName: string; valueStart: string; isGlobal: boolean } | null = null;
    let pendingLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (pendingDefinition) {
        pendingLines.push(line);
        const combined = pendingLines.join('\n');
        const valuePart = combined.substring(combined.indexOf('=') + 1).trim();

        if (this.isCompleteValue(valuePart)) {
          const value = this.evaluator.parseValue(valuePart);
          this.evaluator.setVariable(pendingDefinition.varName, value);
          for (let j = 0; j < pendingLines.length; j++) {
            resultLines.push('');
          }
          pendingDefinition = null;
          pendingLines = [];
        }
        continue;
      }

      const localVarMatch = trimmed.match(/^\$([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)$/);
      const globalVarMatch = trimmed.match(/^\$\$([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)$/);

      if (localVarMatch) {
        const varName = localVarMatch[1];
        const varValue = localVarMatch[2].trim();

        if (this.isCompleteValue(varValue)) {
          const value = this.evaluator.parseValue(varValue);
          this.evaluator.setVariable(varName, value);
          resultLines.push('');
        } else {
          pendingDefinition = { varName, valueStart: varValue, isGlobal: false };
          pendingLines = [line];
        }
      } else if (globalVarMatch) {
        const varName = globalVarMatch[1];
        const varValue = globalVarMatch[2].trim();

        if (this.isCompleteValue(varValue)) {
          const value = this.evaluator.parseValue(varValue);
          this.evaluator.setVariable(varName, value);
          resultLines.push('');
        } else {
          pendingDefinition = { varName, valueStart: varValue, isGlobal: true };
          pendingLines = [line];
        }
      } else {
        resultLines.push(line);
      }
    }

    return resultLines.join('\n');
  }

  private isCompleteValue(value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed) return true;

    if (trimmed.startsWith('[')) {
      return this.isBalanced(trimmed, '[', ']');
    }
    if (trimmed.startsWith('{') && this.looksLikeObject(trimmed)) {
      return this.isBalanced(trimmed, '{', '}');
    }

    return true;
  }

  private looksLikeObject(str: string): boolean {
    const inner = str.slice(1, -1).trim();
    if (inner === '') return false;
    return /^[a-zA-Z_]\w*\s*:/.test(inner);
  }

  private isBalanced(str: string, open: string, close: string): boolean {
    let depth = 0;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < str.length; i++) {
      const char = str[i];

      if (inString) {
        if (char === stringChar && (i === 0 || str[i - 1] !== '\\')) {
          inString = false;
        }
        continue;
      }

      if (char === '"' || char === "'") {
        inString = true;
        stringChar = char;
        continue;
      }

      if (char === open) depth++;
      else if (char === close) {
        depth--;
        if (depth === 0) return i === str.length - 1;
      }
    }

    return false;
  }

  private processExpressions(content: string): string {
    const expressionRegex = /\{\{\s*(.+?)\s*}}/g;

    return content.replace(expressionRegex, (match, expression) => {
      try {
        const value = this.evaluator.evaluate(expression);
        return this.formatValue(value);
      } catch {
        return match;
      }
    });
  }

  private processVariableReferences(content: string): string {
    const varRefRegex = /\{\$([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*|\[\d+])*)}/g;

    return content.replace(varRefRegex, (match, varPath) => {
      try {
        const value = this.evaluator.evaluate('$' + varPath);
        return this.formatValue(value);
      } catch {
        return match;
      }
    });
  }

  private formatValue(value: Value): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return value.toString();
      }
      const formatted = value.toFixed(10);
      return parseFloat(formatted).toString();
    }
    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  evaluateCondition(condition: string): boolean {
    const expr = condition.replace(/\{\{\s*(.+?)\s*}}/g, (_, expr) => {
      try {
        const value = this.evaluator.evaluate(expr);
        return this.formatValue(value);
      } catch {
        return 'false';
      }
    });

    try {
      const result = this.evaluator.evaluate(expr);
      return this.evaluator.isTruthy(result);
    } catch {
      return false;
    }
  }

  getEvaluator(): ExpressionEvaluator {
    return this.evaluator;
  }

  parseForeach(blockType: string): { collection: string; iterator: string } | null {
    const match = blockType.match(
      /^foreach\s+\{\s*\$([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*|\[\d+])*)\s+as\s+\$([a-zA-Z_][a-zA-Z0-9_]*)\s*}$/
    );
    if (!match) return null;

    return {
      collection: '$' + match[1],
      iterator: match[2],
    };
  }

  getCollection(varPath: string): Value[] {
    try {
      const value = this.evaluator.evaluate(varPath);
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }
}
