import type { StyleDictionary } from 'pdfmake/interfaces';

export const defaultPDFStyles: StyleDictionary = {
  header1: {
    fontSize: 24,
    bold: true,
    margin: [0, 20, 0, 10],
    color: '#333333',
  },
  header2: {
    fontSize: 20,
    bold: true,
    margin: [0, 15, 0, 8],
    color: '#444444',
  },
  header3: {
    fontSize: 16,
    bold: true,
    margin: [0, 12, 0, 6],
    color: '#555555',
  },
  header4: {
    fontSize: 14,
    bold: true,
    margin: [0, 10, 0, 5],
  },
  header5: {
    fontSize: 12,
    bold: true,
    margin: [0, 8, 0, 4],
  },
  header6: {
    fontSize: 11,
    bold: true,
    margin: [0, 6, 0, 3],
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 1.4,
    margin: [0, 5, 0, 5],
  },
  bold: {
    bold: true,
  },
  italic: {
    italics: true,
  },
  underline: {
    decoration: 'underline',
  },
  strikethrough: {
    decoration: 'lineThrough',
  },
  code: {
    font: 'Courier',
    fontSize: 10,
    background: '#f4f4f4',
  },
  codeBlock: {
    font: 'Courier',
    fontSize: 10,
    background: '#f4f4f4',
    margin: [0, 5, 0, 5],
  },
  blockquote: {
    margin: [15, 5, 0, 5],
    color: '#666666',
    italics: true,
  },
  footer: {
    fontSize: 8,
    margin: [0, 10, 0, 0],
    alignment: 'center',
  },
};
