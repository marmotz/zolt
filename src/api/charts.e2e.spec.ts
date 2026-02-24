import { describe, expect, test } from 'bun:test';
import { buildString } from '../index';

describe('Charts and Diagrams E2E', () => {
  describe('Mermaid Diagrams', () => {
    test('should render basic mermaid diagram', async () => {
      const input = `
:::mermaid
graph TD
    A[Début] --> B[Processus]
    B --> C[Fin]
:::`;

      const html = await buildString(input);
      expect(html).toContain('class="zolt-mermaid"');
      expect(html).toContain('class="mermaid"');
      expect(html).toContain('graph TD');
      expect(html).toContain('mermaid.min.js');
    });

    test('should render complex mermaid diagram', async () => {
      const input = `
:::mermaid
sequenceDiagram
    participant Alice
    participant Bob
    Alice->>Bob: Hello Bob, how are you?
    Bob-->>Alice: I am good thanks!
:::`;

      const html = await buildString(input);
      expect(html).toContain('sequenceDiagram');
      expect(html).toContain('Alice-&gt;&gt;Bob');
    });

    test('should include mermaid.js only once', async () => {
      const input = `
:::mermaid
graph TD
    A --> B
:::

:::mermaid
graph LR
    C --> D
:::`;

      const html = await buildString(input);
      const matches = html.match(/mermaid\.min\.js/g);
      expect(matches?.length).toBe(1);
    });
  });

  describe('Line Charts', () => {
    test('should render basic line chart', async () => {
      const input = `
:::chart
:::chart-line {title="Sales Over Time"}
Jan: 100
Feb: 120
Mar: 150
Apr: 180
:::
:::`;

      const html = await buildString(input);
      expect(html).toContain('class="zolt-chart"');
      expect(html).toContain('data-chart-type="line"');
      expect(html).toContain('data-title="Sales Over Time"');
      expect(html).toContain('Jan');
      expect(html).toContain('100');
      expect(html).toContain('chart.js');
    });

    test('should render line chart with color scheme', async () => {
      const input = `
:::chart
:::chart-line {color-scheme=cool}
Jan: 10
Feb: 20
Mar: 30
:::
:::`;

      const html = await buildString(input);
      expect(html).toContain('data-scheme="cool"');
    });

    test('should render line chart with legend', async () => {
      const input = `
:::chart
:::chart-line {title="Growth" legend=true}
Q1: 100
Q2: 150
Q3: 200
:::
:::`;

      const html = await buildString(input);
      expect(html).toContain('data-legend="true"');
      expect(html).toContain('data-title="Growth"');
    });

    test('should render line chart with grid', async () => {
      const input = `
:::chart
:::chart-line {title="Detailed View" grid=true}
Jan: 100
Feb: 150
Mar: 200
:::
:::`;

      const html = await buildString(input);
      expect(html).toContain('data-grid="true"');
    });
  });

  describe('Bar Charts', () => {
    test('should render basic bar chart', async () => {
      const input = `
:::chart
:::chart-bar {title="Product Sales"}
Widget A: 150
Widget B: 200
Widget C: 175
Widget D: 220
:::
:::`;

      const html = await buildString(input);
      expect(html).toContain('data-chart-type="bar"');
      expect(html).toContain('Widget A');
      expect(html).toContain('150');
    });
  });

  describe('Pie Charts', () => {
    test('should render pie chart with percentages', async () => {
      const input = `
:::chart
:::chart-pie {title="Market Share"}
Company A: 35%
Company B: 25%
Company C: 20%
Company D: 15%
Others: 5%
:::
:::`;

      const html = await buildString(input);
      expect(html).toContain('data-chart-type="pie"');
      expect(html).toContain('35%');
      expect(html).toContain('Company A');
    });
  });

  describe('Area Charts', () => {
    test('should render area chart', async () => {
      const input = `
:::chart
:::chart-area {title="Traffic Over Time"}
Morning: 120
Afternoon: 200
Evening: 180
Night: 50
:::
:::`;

      const html = await buildString(input);
      expect(html).toContain('data-chart-type="area"');
      expect(html).toContain('Morning');
    });
  });

  describe('Multi-Chart Containers', () => {
    test('should render multiple charts in container', async () => {
      const input = `
:::chart
:::chart-line {title="Revenue"}
2020: 50000
2021: 75000
2022: 100000
:::

:::chart-bar {title="Expenses"}
2020: 30000
2021: 35000
2022: 40000
:::
:::`;

      const html = await buildString(input);
      expect(html).toContain('data-chart-type="line"');
      expect(html).toContain('data-chart-type="bar"');
      expect(html).toContain('Revenue');
      expect(html).toContain('Expenses');
    });

    test('should render horizontal layout', async () => {
      const input = `
:::chart {layout=horizontal}
:::chart-pie {title="Répartition"}
Alpha: 30%
Beta: 45%
Gamma: 25%
:::

:::chart-bar {title="Comparaison"}
2024: 1200
2025: 1450
2026: 1680
:::
:::`;

      const html = await buildString(input);
      expect(html).toContain('data-layout="horizontal"');
    });
  });

  describe('Chart Data Formats', () => {
    test('should handle numeric values', async () => {
      const input = `
:::chart
:::chart-line
A: 100
B: 200
C: 300
:::
:::`;

      const html = await buildString(input);
      expect(html).toContain('A');
      expect(html).toContain('100');
    });

    test('should handle percentage values', async () => {
      const input = `
:::chart
:::chart-pie
X: 45%
Y: 30%
Z: 25%
:::
:::`;

      const html = await buildString(input);
      expect(html).toContain('45%');
    });

    test('should handle monetary values', async () => {
      const input = `
:::chart
:::chart-bar
Item: $1,200
Other: $3,400
:::
:::`;

      const html = await buildString(input);
      expect(html).toContain('$1,200');
    });
  });

  describe('Chart Attributes', () => {
    test('should handle container attributes', async () => {
      const input = `
:::chart {width=100% height=400px}
:::chart-line
Jan: 100
Feb: 120
:::
:::`;

      const html = await buildString(input);
      expect(html).toContain('class="zolt-chart"');
    });

    test('should handle all chart attributes', async () => {
      const input = `
:::chart
:::chart-line {title="Évolution" color-scheme=cool legend=true grid=true}
Jan: 20
Feb: 35
Mar: 50
:::
:::`;

      const html = await buildString(input);
      expect(html).toContain('data-title="Évolution"');
      expect(html).toContain('data-scheme="cool"');
      expect(html).toContain('data-legend="true"');
      expect(html).toContain('data-grid="true"');
    });
  });

  describe('Direct Chart Type', () => {
    test('should render chart-* without chart container', async () => {
      const input = `
:::chart-line {title="Direct Line"}
A: 10
B: 20
C: 30
:::`;

      const html = await buildString(input);
      expect(html).toContain('class="zolt-chart"');
      expect(html).toContain('data-chart-type="line"');
      expect(html).toContain('Direct Line');
    });
  });

  describe('Real-World Examples from Spec', () => {
    test('should render complete financial report', async () => {
      const input = `
# Rapport de Ventes

:::chart
:::chart-line {title="Évolution mensuelle" color-scheme=blue grid=true}
Janvier: 20000
Février: 25000
Mars: 23000
Avril: 28000
Mai: 32000
:::

:::chart-bar {title="Par catégorie" color-scheme=warm}
Électronique: 45000
Vêtements: 32000
Alimentation: 28000
Autres: 15000
:::

:::chart-pie {title="Répartition canal" color-scheme=pastel}
En ligne: 45%
Magasin: 35%
Distributeurs: 20%
:::
:::`;

      const html = await buildString(input);
      expect(html).toContain('Évolution mensuelle');
      expect(html).toContain('Par catégorie');
      expect(html).toContain('Répartition canal');
      expect(html).toContain('Janvier');
      expect(html).toContain('Électronique');
      expect(html).toContain('En ligne');
    });
  });
});
