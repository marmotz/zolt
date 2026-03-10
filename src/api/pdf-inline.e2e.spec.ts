import { describe, expect, test } from 'bun:test';
import { buildString } from '../index';

describe('PDF Build - Section 1 Inline Syntax', () => {
  const options = { type: 'pdf' as const };

  test('should process all inline syntax elements without error', async () => {
    const input = `
# Inline Syntax Test

**Bold**, //Italic//, __Underline__, ~~Strikethrough~~, \`Code\`
^{Superscript}, _{Subscript}, ==Highlight==
[Link](https://zolt.dev), ![Image](img.png)
!![Video](v.mp4), ??[Audio](a.mp3), @@[Embed](e.html), &&[File](f.pdf)
[^1]
abbr{abbr="Z", definition="Zolt"}
%% Secret %%
$E=mc^2$
Line\\ break
\\*Escaped\\*
    `;

    // Le builder PDF retourne le JSON pour pdfmake
    const result = await buildString(input, options);
    const docDef = JSON.parse(result);

    expect(docDef.content).toBeDefined();
    // On vérifie quelques éléments clés dans la structure pdfmake
    const content = docDef.content;

    // On cherche les éléments par style ou contenu
    const flatContent = JSON.stringify(content);

    expect(flatContent).toContain('Bold');
    expect(flatContent).toContain('Italic');
    expect(flatContent).toContain('Underline');
    expect(flatContent).toContain('Strikethrough');
    expect(flatContent).toContain('Code');
    expect(flatContent).toContain('Superscript');
    expect(flatContent).toContain('Subscript');
    expect(flatContent).toContain('Highlight');
    expect(flatContent).toContain('https://zolt.dev');
    expect(flatContent).toContain('v.mp4');
    expect(flatContent).toContain('a.mp3');
    expect(flatContent).toContain('e.html');
    expect(flatContent).toContain('f.pdf');
    expect(flatContent).toContain('fn-1');
    expect(flatContent).not.toContain('Secret');
    expect(flatContent).toContain('E=mc^2');
  });
});
