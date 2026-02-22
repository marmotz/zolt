import { describe, expect, test } from 'bun:test';
import { buildString } from './index';

describe('Calculations: Basic Arithmetic', () => {
  test('should evaluate addition', async () => {
    const html = await buildString('{{ 10 + 5 }}');
    expect(html).toContain('15');
  });

  test('should evaluate subtraction', async () => {
    const html = await buildString('{{ 20 - 8 }}');
    expect(html).toContain('12');
  });

  test('should evaluate multiplication', async () => {
    const html = await buildString('{{ 3 * 4 }}');
    expect(html).toContain('12');
  });

  test('should evaluate division', async () => {
    const html = await buildString('{{ 15 / 3 }}');
    expect(html).toContain('5');
  });

  test('should evaluate modulo', async () => {
    const html = await buildString('{{ 10 % 3 }}');
    expect(html).toContain('1');
  });
});

describe('Calculations: Power Operator', () => {
  test('should evaluate power', async () => {
    const html = await buildString('{{ 2 ^ 8 }}');
    expect(html).toContain('256');
  });

  test('should evaluate power with base 10', async () => {
    const html = await buildString('{{ 10 ^ 2 }}');
    expect(html).toContain('100');
  });

  test('should evaluate power with same number', async () => {
    const html = await buildString('{{ 3 ^ 3 }}');
    expect(html).toContain('27');
  });

  test('should evaluate power with exponent 0', async () => {
    const html = await buildString('{{ 5 ^ 0 }}');
    expect(html).toContain('1');
  });

  test('should evaluate chained power (right associative)', async () => {
    const html = await buildString('{{ 2 ^ 3 ^ 2 }}');
    expect(html).toContain('512');
  });
});

describe('Calculations: Operator Precedence', () => {
  test('should evaluate multiplication before addition', async () => {
    const html = await buildString('{{ 3 + 2 * 5 }}');
    expect(html).toContain('13');
  });

  test('should evaluate parentheses first', async () => {
    const html = await buildString('{{ (3 + 2) * 5 }}');
    expect(html).toContain('25');
  });

  test('should evaluate power before multiplication', async () => {
    const html = await buildString('{{ 2 * 3 ^ 2 }}');
    expect(html).toContain('18');
  });

  test('should evaluate division and multiplication left to right', async () => {
    const html = await buildString('{{ 20 / 4 * 2 }}');
    expect(html).toContain('10');
  });

  test('should evaluate addition and subtraction left to right', async () => {
    const html = await buildString('{{ 10 - 3 + 2 }}');
    expect(html).toContain('9');
  });

  test('should handle nested parentheses', async () => {
    const html = await buildString('{{ ((2 + 3) * (4 - 1)) }}');
    expect(html).toContain('15');
  });
});

describe('Calculations: Variables', () => {
  test('should define and use local variable', async () => {
    const html = await buildString('$price = 100\nTotal: {$price}');
    expect(html).toContain('Total: 100');
  });

  test('should use variable in expression', async () => {
    const html = await buildString('$price = 29.99\nTotal: {{ $price * 3 }}');
    expect(html).toContain('89.97');
  });

  test('should use multiple variables in expression', async () => {
    const html = await buildString('$a = 10\n$b = 20\nSum: {{ $a + $b }}');
    expect(html).toContain('Sum: 30');
  });

  test('should support variable in calculation with parentheses', async () => {
    const html = await buildString('$price = 100\n$tax = 0.08\nTotal: {{ $price * (1 + $tax) }}');
    expect(html).toContain('108');
  });
});

describe('Calculations: Math Namespace', () => {
  test('should evaluate Math.floor', async () => {
    const html = await buildString('{{ Math.floor(3.7) }}');
    expect(html).toContain('3');
  });

  test('should evaluate Math.ceil', async () => {
    const html = await buildString('{{ Math.ceil(3.2) }}');
    expect(html).toContain('4');
  });

  test('should evaluate Math.round up', async () => {
    const html = await buildString('{{ Math.round(3.5) }}');
    expect(html).toContain('4');
  });

  test('should evaluate Math.round down', async () => {
    const html = await buildString('{{ Math.round(3.4) }}');
    expect(html).toContain('3');
  });

  test('should evaluate Math.abs with negative', async () => {
    const html = await buildString('{{ Math.abs(-5) }}');
    expect(html).toContain('5');
  });

  test('should evaluate Math.abs with positive', async () => {
    const html = await buildString('{{ Math.abs(10) }}');
    expect(html).toContain('10');
  });

  test('should evaluate Math.min', async () => {
    const html = await buildString('{{ Math.min(10, 5, 8) }}');
    expect(html).toContain('5');
  });

  test('should evaluate Math.max', async () => {
    const html = await buildString('{{ Math.max(10, 5, 8) }}');
    expect(html).toContain('10');
  });

  test('should evaluate Math.pow', async () => {
    const html = await buildString('{{ Math.pow(2, 8) }}');
    expect(html).toContain('256');
  });

  test('should evaluate Math.sqrt', async () => {
    const html = await buildString('{{ Math.sqrt(16) }}');
    expect(html).toContain('4');
  });
});

describe('Calculations: List Namespace', () => {
  test('should evaluate List.length', async () => {
    const html = await buildString('$numbers = [10, 20, 30, 40, 50]\nLength: {{ List.length($numbers) }}');
    expect(html).toContain('Length: 5');
  });

  test('should evaluate List.first', async () => {
    const html = await buildString('$numbers = [10, 20, 30]\nFirst: {{ List.first($numbers) }}');
    expect(html).toContain('First: 10');
  });

  test('should evaluate List.last', async () => {
    const html = await buildString('$numbers = [10, 20, 30]\nLast: {{ List.last($numbers) }}');
    expect(html).toContain('Last: 30');
  });

  test('should evaluate List.sum', async () => {
    const html = await buildString('$numbers = [10, 20, 30]\nSum: {{ List.sum($numbers) }}');
    expect(html).toContain('Sum: 60');
  });

  test('should evaluate List.avg', async () => {
    const html = await buildString('$numbers = [10, 20, 30]\nAvg: {{ List.avg($numbers) }}');
    expect(html).toContain('Avg: 20');
  });

  test('should evaluate List.count', async () => {
    const html = await buildString('$numbers = [10, 20, 30]\nCount: {{ List.count($numbers) }}');
    expect(html).toContain('Count: 3');
  });

  test('should evaluate List.min', async () => {
    const html = await buildString('$scores = [85, 92, 78]\nLowest: {{ List.min($scores) }}');
    expect(html).toContain('Lowest: 78');
  });

  test('should evaluate List.max', async () => {
    const html = await buildString('$scores = [85, 92, 78]\nHighest: {{ List.max($scores) }}');
    expect(html).toContain('Highest: 92');
  });
});

describe('Calculations: String Namespace', () => {
  test('should evaluate String.upper', async () => {
    const html = await buildString('{{ String.upper("hello") }}');
    expect(html).toContain('HELLO');
  });

  test('should evaluate String.lower', async () => {
    const html = await buildString('{{ String.lower("HELLO") }}');
    expect(html).toContain('hello');
  });

  test('should evaluate String.length', async () => {
    const html = await buildString('{{ String.length("text") }}');
    expect(html).toContain('4');
  });

  test('should evaluate String.trim', async () => {
    const html = await buildString('{{ String.trim("  text  ") }}');
    expect(html).toContain('>text<');
  });

  test('should evaluate String.replace', async () => {
    const html = await buildString('{{ String.replace("hello", "l", "r") }}');
    expect(html).toContain('herro');
  });
});

describe('Calculations: Lists and Objects', () => {
  test('should parse and render simple list', async () => {
    const html = await buildString('$items = [1, 2, 3]');
    expect(html).toBeDefined();
  });

  test('should parse and render object', async () => {
    const html = await buildString('$item = {name: "Widget", price: 19.99}');
    expect(html).toBeDefined();
  });

  test('should access object property', async () => {
    const html = await buildString('$item = {name: "Widget"}\nName: {$item.name}');
    expect(html).toContain('Name: Widget');
  });

  test('should access nested object property', async () => {
    const html = await buildString('$person = {name: "John", address: {city: "Paris"}}\nCity: {$person.address.city}');
    expect(html).toContain('City: Paris');
  });

  test('should access array element by index', async () => {
    const html = await buildString('$items = [10, 20, 30]\nFirst: {$items[0]}');
    expect(html).toContain('First: 10');
  });

  test('should access object property in array', async () => {
    const html = await buildString('$items = [{name: "A"}, {name: "B"}]\nName: {$items[0].name}');
    expect(html).toContain('Name: A');
  });
});

describe('Calculations: Foreach Loops', () => {
  test('should iterate over simple list', async () => {
    const html = await buildString('$items = [1, 2, 3]\n:::foreach {$items as $item}\nItem: {$item}\n:::');
    expect(html).toContain('Item: 1');
    expect(html).toContain('Item: 2');
    expect(html).toContain('Item: 3');
  });

  test('should iterate over object list', async () => {
    const html = await buildString(
      '$products = [{name: "Laptop"}, {name: "Mouse"}]\n:::foreach {$products as $product}\nProduct: {$product.name}\n:::'
    );
    expect(html).toContain('Product: Laptop');
    expect(html).toContain('Product: Mouse');
  });

  test('should provide foreach.index variable', async () => {
    const html = await buildString('$items = [10, 20]\n:::foreach {$items as $item}\nIndex: {$foreach.index}\n:::');
    expect(html).toContain('Index: 0');
    expect(html).toContain('Index: 1');
  });

  test('should provide foreach.index1 variable', async () => {
    const html = await buildString('$items = [10, 20]\n:::foreach {$items as $item}\nIndex: {$foreach.index1}\n:::');
    expect(html).toContain('Index: 1');
    expect(html).toContain('Index: 2');
  });

  test('should provide foreach.first variable', async () => {
    const html = await buildString('$items = [10, 20]\n:::foreach {$items as $item}\nFirst: {$foreach.first}\n:::');
    expect(html).toContain('First: true');
    expect(html).toContain('First: false');
  });

  test('should provide foreach.last variable', async () => {
    const html = await buildString('$items = [10, 20]\n:::foreach {$items as $item}\nLast: {$foreach.last}\n:::');
    expect(html).toContain('Last: false');
    expect(html).toContain('Last: true');
  });

  test('should provide foreach.even variable', async () => {
    const html = await buildString('$items = [10, 20, 30]\n:::foreach {$items as $item}\nEven: {$foreach.even}\n:::');
    expect(html).toContain('Even: true');
    expect(html).toContain('Even: false');
  });

  test('should provide foreach.odd variable', async () => {
    const html = await buildString('$items = [10, 20, 30]\n:::foreach {$items as $item}\nOdd: {$foreach.odd}\n:::');
    expect(html).toContain('Odd: true');
    expect(html).toContain('Odd: false');
  });

  test('should use item in calculation', async () => {
    const html = await buildString(
      '$items = [{price: 10}, {price: 20}]\n:::foreach {$items as $item}\nTotal: {{ $item.price * 2 }}\n:::'
    );
    expect(html).toContain('Total: 20');
    expect(html).toContain('Total: 40');
  });
});

describe('Calculations: Scientific Notation', () => {
  test('should parse positive exponent', async () => {
    const html = await buildString('{{ 1.23e5 }}');
    expect(html).toContain('123000');
  });

  test('should parse negative exponent', async () => {
    const html = await buildString('{{ 1.23e-3 }}');
    expect(html).toContain('0.00123');
  });

  test('should use scientific notation in calculation', async () => {
    const html = await buildString('{{ 2 * 1.5e2 }}');
    expect(html).toContain('300');
  });
});

describe('Calculations: Conditional', () => {
  test('should evaluate if block when condition is true', async () => {
    const html = await buildString('$value = 10\n:::if {{ $value > 5 }}\nGreater\n:::');
    expect(html).toContain('Greater');
  });

  test('should not evaluate if block when condition is false', async () => {
    const html = await buildString('$value = 3\n:::if {{ $value > 5 }}\nGreater\n:::');
    expect(html).not.toContain('Greater');
  });

  test('should evaluate equality check', async () => {
    const html = await buildString('$divisor = 0\n:::if {{ $divisor == 0 }}\nZero\n:::');
    expect(html).toContain('Zero');
  });

  test('should evaluate inequality check', async () => {
    const html = await buildString('$divisor = 5\n:::if {{ $divisor != 0 }}\nNon-zero\n:::');
    expect(html).toContain('Non-zero');
  });

  test('should combine conditions with and', async () => {
    const html = await buildString('$a = 5\n$b = 10\n:::if {{ $a > 3 }} and {{ $b < 20 }}\nBoth true\n:::');
    expect(html).toContain('Both true');
  });
});

describe('Calculations: Complex Examples', () => {
  test('should calculate shopping cart total', async () => {
    const html = await buildString(
      '$item_price = 29.99\n$quantity = 3\n$tax_rate = 0.08\n' +
        'Total: {{ $item_price * $quantity * (1 + $tax_rate) }}'
    );
    expect(html).toContain('97.1676');
  });

  test('should calculate temperature conversion', async () => {
    const html = await buildString('$celsius = 25\nFahrenheit: {{ $celsius * 9/5 + 32 }}');
    expect(html).toContain('Fahrenheit: 77');
  });

  test('should calculate percentage', async () => {
    const html = await buildString('$total = 150\n$part = 45\nPercentage: {{ ($part / $total) * 100 }}%');
    expect(html).toContain('Percentage: 30%');
  });

  test('should use nested functions', async () => {
    const html = await buildString('$scores = [85, 92, 78]\nAverage: {{ Math.round(List.avg($scores)) }}');
    expect(html).toContain('Average: 85');
  });

  test('should calculate compound interest', async () => {
    const html = await buildString(
      '$principal = 1000\n$rate = 0.05\n$n = 12\n$t = 3\n' + 'Amount: {{ $principal * Math.pow(1 + $rate/$n, $n*$t) }}'
    );
    expect(html).toContain('Amount:');
    expect(html).toContain('1161');
  });

  test('should calculate simple interest with variables', async () => {
    const html = await buildString(
      '$principal = 1000\n$rate = 0.05\n$years = 3\n' + 'Simple Interest: {{ $principal * $rate * $years }}'
    );
    expect(html).toContain('Simple Interest: 150');
  });

  test('should calculate total amount with simple interest', async () => {
    const html = await buildString(
      '$principal = 1000\n$rate = 0.05\n$years = 3\n' + 'Total Amount: {{ $principal + ($principal * $rate * $years) }}'
    );
    expect(html).toContain('Total Amount: 1150');
  });

  test('should use variable values at time of calculation, not final values', async () => {
    const html = await buildString(
      '$principal = 1000\n' +
        '$rate = 0.05\n' +
        '$years = 3\n' +
        'First: {{ $principal * $rate * $years }}\n' +
        '$principal = 200000\n' +
        '$rate = 0.045\n' +
        'Second: {{ $principal * $rate * $years }}'
    );
    expect(html).toContain('First: 150');
    expect(html).toContain('Second: 27000');
  });

  test('should evaluate expressions in variable definitions at definition time', async () => {
    const html = await buildString(
      '$base = 100\n' +
        '$multiplier = 3\n' +
        '$result = $base * $multiplier\n' +
        'Result: {$result}\n' +
        '$base = 500\n' +
        '$multiplier = 2\n' +
        'New base: {$base}, New multiplier: {$multiplier}, Result unchanged: {$result}'
    );
    expect(html).toContain('Result: 300');
    expect(html).toContain('New base: 500');
    expect(html).toContain('New multiplier: 2');
    expect(html).toContain('Result unchanged: 300');
  });
});
