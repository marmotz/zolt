type Value = number | string | boolean | null | Value[] | { [key: string]: Value };

interface Variables {
  [key: string]: Value;
}

export class ExpressionEvaluator {
  private variables: Variables = {};
  private parentEvaluator: ExpressionEvaluator | null = null;

  constructor(variables?: Variables, parent?: ExpressionEvaluator) {
    if (variables) {
      this.variables = { ...variables };
    }
    this.parentEvaluator = parent || null;
  }

  createChildScope(): ExpressionEvaluator {
    return new ExpressionEvaluator({}, this);
  }

  setVariable(name: string, value: Value): void {
    this.variables[name] = value;
  }

  getVariable(name: string): Value {
    if (name in this.variables) {
      return this.variables[name];
    }
    if (this.parentEvaluator) {
      return this.parentEvaluator.getVariable(name);
    }

    return null;
  }

  parseValue(valueStr: string): Value {
    const trimmed = valueStr.trim();

    if (trimmed === 'true') {
      return true;
    }
    if (trimmed === 'false') {
      return false;
    }
    if (trimmed === 'null') {
      return null;
    }

    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return trimmed.slice(1, -1);
    }
    if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
      return trimmed.slice(1, -1);
    }

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      return this.parseArray(trimmed);
    }

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      if (this.looksLikeObject(trimmed)) {
        return this.parseObject(trimmed);
      }
    }

    const num = parseFloat(trimmed);
    if (!isNaN(num)) {
      return num;
    }

    return trimmed;
  }

  private looksLikeObject(str: string): boolean {
    const inner = str.slice(1, -1).trim();
    if (inner === '') {
      return true;
    } // Empty object {}
    // Check if it looks like key: value or "key": value

    return /^[a-zA-Z_]\w*\s*:/.test(inner) || /^['"]/.test(inner);
  }

  private parseArray(str: string): Value[] {
    const inner = str.slice(1, -1).trim();
    if (inner === '') {
      return [];
    }

    const elements: string[] = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < inner.length; i++) {
      const char = inner[i];

      if (inString) {
        current += char;
        if (char === stringChar && (i === 0 || inner[i - 1] !== '\\')) {
          inString = false;
        }
        continue;
      }

      if (char === '"' || char === "'") {
        inString = true;
        stringChar = char;
        current += char;
        continue;
      }

      if (char === '[' || char === '{') {
        depth++;
        current += char;
      } else if (char === ']' || char === '}') {
        depth--;
        current += char;
      } else if (char === ',' && depth === 0) {
        elements.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      elements.push(current.trim());
    }

    return elements.map((el) => this.parseValue(el));
  }

  private parseObject(str: string): { [key: string]: Value } {
    const inner = str.slice(1, -1).trim();
    if (inner === '') {
      return {};
    }

    const result: { [key: string]: Value } = {};
    const pairs: string[] = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < inner.length; i++) {
      const char = inner[i];

      if (inString) {
        current += char;
        if (char === stringChar && (i === 0 || inner[i - 1] !== '\\')) {
          inString = false;
        }
        continue;
      }

      if (char === '"' || char === "'") {
        inString = true;
        stringChar = char;
        current += char;
        continue;
      }

      if (char === '[' || char === '{') {
        depth++;
        current += char;
      } else if (char === ']' || char === '}') {
        depth--;
        current += char;
      } else if (char === ',' && depth === 0) {
        pairs.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      pairs.push(current.trim());
    }

    for (const pair of pairs) {
      const colonIndex = pair.indexOf(':');
      if (colonIndex === -1) continue;

      let key = pair.slice(0, colonIndex).trim();
      if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
        key = key.slice(1, -1);
      }

      const valueStr = pair.slice(colonIndex + 1).trim();
      result[key] = this.parseValue(valueStr);
    }

    return result;
  }

  evaluate(expression: string): Value {
    let trimmed = expression.trim();

    if (!trimmed) {
      return null;
    }

    if (trimmed === 'true') {
      return true;
    }
    if (trimmed === 'false') {
      return false;
    }
    if (trimmed === 'null') {
      return null;
    }

    // Handle logical AND (&& or and)
    if (trimmed.includes(' && ') || trimmed.toLowerCase().includes(' and ')) {
      const parts = trimmed.split(/ && | and /i);
      for (const part of parts) {
        const val = this.evaluate(part);
        if (!this.isTruthy(val)) {
          return false;
        }
      }

      return true;
    }

    // Handle logical OR (|| or or)
    if (trimmed.includes(' || ') || trimmed.toLowerCase().includes(' or ')) {
      const parts = trimmed.split(/ \|\| | or /i);
      for (const part of parts) {
        const val = this.evaluate(part);
        if (this.isTruthy(val)) {
          return true;
        }
      }

      return false;
    }

    // Handle negation !
    if (trimmed.startsWith('!')) {
      const operand = this.evaluate(trimmed.slice(1));

      return !this.isTruthy(operand);
    }

    const conditionalMatch = trimmed.match(/^(.+?)\s*(==|!=|<=?|>=?)\s*(.+)$/);
    if (conditionalMatch) {
      const left = this.evaluate(conditionalMatch[1]);
      const op = conditionalMatch[2];
      const right = this.evaluate(conditionalMatch[3]);

      return this.compare(left, op, right);
    }

    return this.evaluateExpression(trimmed);
  }

  private compare(left: Value, op: string, right: Value): boolean {
    const leftNum = typeof left === 'number' ? left : parseFloat(String(left));
    const rightNum = typeof right === 'number' ? right : parseFloat(String(right));

    switch (op) {
      case '==':
        return left === right || (!isNaN(leftNum) && !isNaN(rightNum) && leftNum === rightNum);
      case '!=':
        return left !== right;
      case '<':
        return leftNum < rightNum;
      case '<=':
        return leftNum <= rightNum;
      case '>':
        return leftNum > rightNum;
      case '>=':
        return leftNum >= rightNum;
      default:
        return false;
    }
  }

  private evaluateExpression(expr: string): Value {
    let trimmed = expr.trim();

    if (trimmed.startsWith('(') && this.findMatchingParen(trimmed, 0) === trimmed.length - 1) {
      return this.evaluateExpression(trimmed.slice(1, -1));
    }

    const namespaceResult = this.tryNamespaceFunction(trimmed);
    if (namespaceResult !== null) {
      return namespaceResult;
    }

    const addSubResult = this.tryAddSub(trimmed);
    if (addSubResult !== null) {
      return addSubResult;
    }

    const mulDivResult = this.tryMulDivMod(trimmed);
    if (mulDivResult !== null) {
      return mulDivResult;
    }

    const powResult = this.tryPower(trimmed);
    if (powResult !== null) {
      return powResult;
    }

    if (trimmed.startsWith('$')) {
      return this.resolveVariable(trimmed);
    }

    return this.parseValue(trimmed);
  }

  private tryNamespaceFunction(expr: string): Value | null {
    const match = expr.match(/^(Math|List|String|Date)\.(\w+)\((.*)\)$/);
    if (!match) {
      return null;
    }

    const namespace = match[1];
    const func = match[2];
    const argsStr = match[3];

    const args = this.parseArguments(argsStr);

    switch (namespace) {
      case 'Math':
        return this.evaluateMathFunction(func, args);
      case 'List':
        return this.evaluateListFunction(func, args);
      case 'String':
        return this.evaluateStringFunction(func, args);
      case 'Date':
        return this.evaluateDateFunction(func, args);
      default:
        return null;
    }
  }

  private parseArguments(argsStr: string): Value[] {
    if (!argsStr.trim()) {
      return [];
    }

    const args: Value[] = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < argsStr.length; i++) {
      const char = argsStr[i];

      if (inString) {
        current += char;
        if (char === stringChar && (i === 0 || argsStr[i - 1] !== '\\')) {
          inString = false;
        }
        continue;
      }

      if (char === '"' || char === "'") {
        inString = true;
        stringChar = char;
        current += char;
        continue;
      }

      if (char === '[' || char === '{' || char === '(') {
        depth++;
        current += char;
      } else if (char === ']' || char === '}' || char === ')') {
        depth--;
        current += char;
      } else if (char === ',' && depth === 0) {
        args.push(this.evaluate(current.trim()));
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      args.push(this.evaluate(current.trim()));
    }

    return args;
  }

  private evaluateMathFunction(func: string, args: Value[]): Value {
    const numArgs = args.map((a) => (typeof a === 'number' ? a : parseFloat(String(a))));

    switch (func) {
      case 'floor':
        return Math.floor(numArgs[0]);
      case 'ceil':
        return Math.ceil(numArgs[0]);
      case 'round':
        return Math.round(numArgs[0]);
      case 'abs':
        return Math.abs(numArgs[0]);
      case 'pow':
        return Math.pow(numArgs[0], numArgs[1]);
      case 'sqrt':
        return Math.sqrt(numArgs[0]);
      case 'min':
        return Math.min(...numArgs);
      case 'max':
        return Math.max(...numArgs);
      default:
        return null;
    }
  }

  private evaluateListFunction(func: string, args: Value[]): Value {
    const list = args[0];
    if (!Array.isArray(list)) {
      return null;
    }

    switch (func) {
      case 'length':
      case 'count':
        return list.length;
      case 'first':
        return list[0] ?? null;
      case 'last':
        return list[list.length - 1] ?? null;
      case 'sum':
        return list.reduce((sum: number, item) => {
          const num = typeof item === 'number' ? item : parseFloat(String(item));

          return sum + (isNaN(num) ? 0 : num);
        }, 0);
      case 'avg': {
        const sum = list.reduce((s: number, item) => {
          const num = typeof item === 'number' ? item : parseFloat(String(item));

          return s + (isNaN(num) ? 0 : num);
        }, 0);

        return list.length > 0 ? sum / list.length : 0;
      }
      case 'min': {
        const nums = list
          .map((item) => (typeof item === 'number' ? item : parseFloat(String(item))))
          .filter((n) => !isNaN(n));

        return nums.length > 0 ? Math.min(...nums) : null;
      }
      case 'max': {
        const nums = list
          .map((item) => (typeof item === 'number' ? item : parseFloat(String(item))))
          .filter((n) => !isNaN(n));

        return nums.length > 0 ? Math.max(...nums) : null;
      }
      default:
        return null;
    }
  }

  private evaluateStringFunction(func: string, args: Value[]): Value {
    const str = String(args[0] ?? '');

    switch (func) {
      case 'upper':
        return str.toUpperCase();
      case 'lower':
        return str.toLowerCase();
      case 'length':
        return str.length;
      case 'trim':
        return str.trim();
      case 'replace': {
        const search = String(args[1] ?? '');
        const replacement = String(args[2] ?? '');

        return str.replace(new RegExp(this.escapeRegex(search), 'g'), replacement);
      }
      case 'split': {
        const separator = String(args[1] ?? '');

        return str.split(separator);
      }
      case 'join': {
        const arr = args[0];
        const sep = String(args[1] ?? '');
        if (Array.isArray(arr)) {
          return arr.join(sep);
        }

        return str;
      }
      default:
        return null;
    }
  }

  private evaluateDateFunction(func: string, args: Value[]): Value {
    switch (func) {
      case 'format': {
        const dateValue = args[0];
        const formatStr = String(args[1] ?? 'YYYY-MM-DD');

        if (dateValue === null || dateValue === undefined) {
          return '';
        }

        let date: Date;
        if (typeof dateValue === 'number') {
          date = new Date(dateValue);
        } else if (typeof dateValue === 'string') {
          // Try to handle ISO date strings or other common formats
          date = new Date(dateValue);
        } else {
          return '';
        }

        if (isNaN(date.getTime())) {
          return '';
        }

        return this.formatDate(date, formatStr);
      }
      case 'now':
        return Date.now();
      default:
        return null;
    }
  }

  private formatDate(date: Date, format: string): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const shortYear = year.toString().slice(-2);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return format
      .replace(/YYYY/g, year.toString())
      .replace(/YY/g, shortYear)
      .replace(/MM/g, month)
      .replace(/DD/g, day)
      .replace(/HH/g, hours)
      .replace(/mm/g, minutes)
      .replace(/ss/g, seconds);
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private tryAddSub(expr: string): Value | null {
    return this.tryBinaryOp(expr, /[+-]/, (left, op, right) => {
      const l = typeof left === 'number' ? left : parseFloat(String(left));
      const r = typeof right === 'number' ? right : parseFloat(String(right));

      return op === '+' ? l + r : l - r;
    });
  }

  private tryMulDivMod(expr: string): Value | null {
    return this.tryBinaryOp(expr, /[*\/%]/, (left, op, right) => {
      const l = typeof left === 'number' ? left : parseFloat(String(left));
      const r = typeof right === 'number' ? right : parseFloat(String(right));
      if (op === '*') {
        return l * r;
      }
      if (op === '/') {
        return r !== 0 ? l / r : 0;
      }

      return l % r;
    });
  }

  private tryPower(expr: string): Value | null {
    const tokens = this.tokenizePower(expr);
    if (tokens.length < 3) {
      return null;
    }

    let result = this.evaluate(tokens[tokens.length - 1]);
    for (let i = tokens.length - 2; i >= 0; i -= 2) {
      const op = tokens[i];
      const operand = this.evaluate(tokens[i - 1]);
      if (op === '^') {
        const l = typeof operand === 'number' ? operand : parseFloat(String(operand));
        const r = typeof result === 'number' ? result : parseFloat(String(result));
        result = Math.pow(l, r);
      }
    }

    return result;
  }

  private tokenizePower(expr: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < expr.length; i++) {
      const char = expr[i];

      if (inString) {
        current += char;
        if (char === stringChar && (i === 0 || expr[i - 1] !== '\\')) {
          inString = false;
        }
        continue;
      }

      if (char === '"' || char === "'") {
        inString = true;
        stringChar = char;
        current += char;
        continue;
      }

      if (char === '(' || char === '[' || char === '{') {
        depth++;
        current += char;
      } else if (char === ')' || char === ']' || char === '}') {
        depth--;
        current += char;
      } else if (char === '^' && depth === 0) {
        if (current.trim()) tokens.push(current.trim());
        tokens.push('^');
        current = '';
      } else {
        current += char;
      }
    }

    if (current.trim()) tokens.push(current.trim());

    return tokens.length >= 3 ? tokens : [];
  }

  private tryBinaryOp(
    expr: string,
    pattern: RegExp,
    evaluate: (left: Value, op: string, right: Value) => Value
  ): Value | null {
    let depth = 0;
    let inString = false;
    let stringChar = '';

    for (let i = expr.length - 1; i >= 0; i--) {
      const char = expr[i];

      if (inString) {
        if (char === stringChar && (i === 0 || expr[i - 1] !== '\\')) {
          inString = false;
        }
        continue;
      }

      if (char === '"' || char === "'") {
        inString = true;
        stringChar = char;
        continue;
      }

      if (char === ')' || char === ']' || char === '}') {
        depth++;
      } else if (char === '(' || char === '[' || char === '{') {
        depth--;
      } else if (depth === 0 && i > 0 && i < expr.length - 1) {
        const op = char;
        if (pattern.test(op)) {
          const left = expr.slice(0, i).trim();
          const right = expr.slice(i + 1).trim();

          if (left && right && !this.isInsideIdentifier(expr, i)) {
            const leftVal = this.evaluate(left);
            const rightVal = this.evaluate(right);

            return evaluate(leftVal, op, rightVal);
          }
        }
      }
    }

    return null;
  }

  private isInsideIdentifier(expr: string, opIndex: number): boolean {
    const prevChar = expr[opIndex - 1];
    const nextChar = expr[opIndex + 1];
    const op = expr[opIndex];
    const isLetter = (c: string) => /[a-zA-Z_]/.test(c);

    if (op === '-' && (prevChar === 'e' || prevChar === 'E') && /\d/.test(nextChar)) {
      return true;
    }

    return isLetter(prevChar) && isLetter(nextChar);
  }

  private resolveVariable(varExpr: string): Value {
    const parts: (string | number)[] = [];
    let current = '';
    let i = 1; // Skip initial $

    while (i < varExpr.length) {
      const char = varExpr[i];

      if (char === '.') {
        if (current) parts.push(current);
        current = '';
        i++;
      } else if (char === '[') {
        if (current) parts.push(current);
        current = '';

        // Find matching ] while handling nested brackets
        let depth = 1;
        let j = i + 1;
        let indexStr = '';
        while (j < varExpr.length && depth > 0) {
          if (varExpr[j] === '[') depth++;
          else if (varExpr[j] === ']') depth--;

          if (depth > 0) indexStr += varExpr[j];
          j++;
        }

        // Evaluate the index expression
        const indexValue = this.evaluate(indexStr);
        if (typeof indexValue === 'number' || typeof indexValue === 'string') {
          parts.push(indexValue as string | number);
        }

        i = j;
      } else {
        current += char;
        i++;
      }
    }

    if (current) parts.push(current);

    if (parts.length === 0) {
      return null;
    }

    let value = this.getVariable(String(parts[0]));

    for (let j = 1; j < parts.length && value !== null; j++) {
      const part = parts[j];
      if (typeof part === 'number') {
        value = Array.isArray(value) ? (value[part] ?? null) : null;
      } else {
        if (Array.isArray(value)) {
          // Allow numeric strings as indices for arrays
          const numIndex = parseInt(String(part));
          value = !isNaN(numIndex) ? (value[numIndex] ?? null) : null;
        } else if (typeof value === 'object') {
          value = (value as Record<string, Value>)[part] ?? null;
        } else {
          value = null;
        }
      }
    }

    return value;
  }

  private findMatchingParen(str: string, start: number): number {
    let depth = 0;
    for (let i = start; i < str.length; i++) {
      if (str[i] === '(') depth++;
      else if (str[i] === ')') {
        depth--;
        if (depth === 0) {
          return i;
        }
      }
    }

    return -1;
  }

  isTruthy(value: Value): boolean {
    if (value === null || value === undefined) {
      return false;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    if (typeof value === 'string') {
      if (value.toLowerCase() === 'false') {
        return false;
      }
      if (value.toLowerCase() === 'null') {
        return false;
      }

      return value.length > 0;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    if (typeof value === 'object') {
      return Object.keys(value).length > 0;
    }

    return true;
  }
}
