import { ExpressionEvaluator } from './expression-evaluator';

type Value = number | string | boolean | null | Value[] | { [key: string]: Value };

export class ContentProcessor {
  private evaluator: ExpressionEvaluator;
  private pendingDefinition: { varName: string; valueStart: string; isGlobal: boolean } | null = null;
  private pendingLines: string[] = [];

  constructor(evaluator: ExpressionEvaluator) {
    this.evaluator = evaluator;
  }

  processContent(content: string): string {
    if (!content && !this.pendingDefinition) return '';

    const lines = content.split('\n');
    const resultLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (this.pendingDefinition) {
        this.pendingLines.push(line);
        const combined = this.pendingLines.join('\n');
        const valuePart = combined.substring(combined.indexOf('=') + 1).trim();

        if (this.isCompleteValue(valuePart)) {
          const value = this.parseOrEvaluateValue(valuePart);
          this.evaluator.setVariable(this.pendingDefinition.varName, value);
          for (let j = 0; j < this.pendingLines.length; j++) {
            resultLines.push('');
          }
          this.pendingDefinition = null;
          this.pendingLines = [];
        }
        continue;
      }

      const localVarMatch = trimmed.match(/^\$([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)$/);
      const globalVarMatch = trimmed.match(/^\$\$([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)$/);

      if (localVarMatch) {
        const varName = localVarMatch[1];
        const varValue = localVarMatch[2].trim();

        if (this.isCompleteValue(varValue)) {
          const value = this.parseOrEvaluateValue(varValue);
          this.evaluator.setVariable(varName, value);
          resultLines.push('');
        } else {
          this.pendingDefinition = { varName, valueStart: varValue, isGlobal: false };
          this.pendingLines = [line];
        }
      } else if (globalVarMatch) {
        const varName = globalVarMatch[1];
        const varValue = globalVarMatch[2].trim();

        if (this.isCompleteValue(varValue)) {
          const value = this.parseOrEvaluateValue(varValue);
          this.evaluator.setVariable(varName, value);
          resultLines.push('');
        } else {
          this.pendingDefinition = { varName, valueStart: varValue, isGlobal: true };
          this.pendingLines = [line];
        }
      } else {
        let processedLine = this.processExpressions(line);
        processedLine = this.processVariableReferences(processedLine);
        resultLines.push(processedLine);
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

  private parseOrEvaluateValue(value: string): Value {
    let trimmed = value.trim();

    const commentIndex = trimmed.indexOf(' # ');
    if (commentIndex !== -1) {
      trimmed = trimmed.substring(0, commentIndex).trim();
    }

    if (trimmed.startsWith('[') || (trimmed.startsWith('{') && this.looksLikeObject(trimmed))) {
      return this.evaluator.parseValue(trimmed);
    }

    if (trimmed.startsWith('"') || trimmed.startsWith("'")) {
      return this.evaluator.parseValue(trimmed);
    }

    if (this.isExpression(trimmed)) {
      try {
        return this.evaluator.evaluate(trimmed);
      } catch {
        return this.evaluator.parseValue(trimmed);
      }
    }

    return this.evaluator.parseValue(trimmed);
  }

  private isExpression(value: string): boolean {
    const trimmed = value.trim();

    if (trimmed.startsWith('$')) return true;

    if (/[+\-*/%^]/.test(trimmed)) {
      const numOnly = /^-?\d+(?:\.\d+)?$/.test(trimmed);
      if (!numOnly) return true;
    }

    if (/^Math\.\w+\(/.test(trimmed)) return true;
    if (/^List\.\w+\(/.test(trimmed)) return true;
    if (/^String\.\w+\(/.test(trimmed)) return true;

    return false;
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
    const combinedRegex = /`[^`]*`|\{\{\s*(.+?)\s*}}/g;

    return content.replace(combinedRegex, (match, expression) => {
      if (match.startsWith('`')) {
        return match;
      }
      try {
        const value = this.evaluator.evaluate(expression);
        return this.formatValue(value);
      } catch {
        return match;
      }
    });
  }

  private processVariableReferences(content: string): string {
    const combinedRegex = /`[^`]*`|\{\$([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*|\[\d+])*)}/g;

    return content.replace(combinedRegex, (match, varPath) => {
      if (match.startsWith('`')) {
        return match;
      }
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
    let expr = condition.trim();
    if (expr.startsWith('{') && expr.endsWith('}')) {
      // Only strip if it's a single group and not a special marker
      let depth = 0;
      let singleGroup = true;
      for (let i = 0; i < expr.length; i++) {
        if (expr[i] === '{') depth++;
        else if (expr[i] === '}') depth--;
        if (depth === 0 && i < expr.length - 1) {
          singleGroup = false;
          break;
        }
      }

      if (singleGroup && !expr.startsWith('{{') && !expr.startsWith('{$')) {
        expr = expr.slice(1, -1).trim();
      }
    }

    expr = expr.replace(/\{\{\s*(.+?)\s*}}/g, (_, expr) => {
      try {
        const value = this.evaluator.evaluate(expr);
        return this.formatValue(value);
      } catch {
        return 'false';
      }
    });

    expr = expr.replace(/\{\$([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*|\[\d+])*)}/g, (_, varPath) => {
      try {
        const value = this.evaluator.evaluate('$' + varPath);
        return this.formatValue(value);
      } catch {
        return 'null';
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
