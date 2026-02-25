import { describe, expect, test } from 'bun:test';
import { buildString } from './index';

describe('API: Resource Variables', () => {
  test('should replace variables in image src and alt', async () => {
    const zolt = `
$src = "img.jpg"
$alt = "Description"
![{$alt}]({$src})
    `;
    const html = await buildString(zolt);
    expect(html).toContain('<img src="img.jpg" alt="Description">');
  });

  test('should replace variables in link href and title', async () => {
    const zolt = `
$url = "https://zolt.marmotz.dev"
$title = "Go to Example"
[Link]({$url}){title={$title}}
    `;
    const html = await buildString(zolt);
    expect(html).toContain('<a href="https://zolt.marmotz.dev" title="Go to Example">Link</a>');
  });

  test('should replace variables in attributes', async () => {
    const zolt = `
$w = "100%"
$id = "my-img"
![Alt](img.jpg){width={$w} id={$id}}
    `;
    const html = await buildString(zolt);
    expect(html).toContain('<img src="img.jpg" alt="Alt" style="width: 100%" id="my-img">');
  });

  test('should replace variables in foreach loop', async () => {
    const zolt = `
$gallery = [
  {src: "img1.jpg", caption: "Sunset"}
]

:::foreach {$gallery as $photo}
![{$photo.caption}]({$photo.src}){width=100%}
:::
    `;
    const html = await buildString(zolt);
    expect(html).toContain('<img src="img1.jpg" alt="Sunset" style="width: 100%">');
  });

  test('should handle nested attributes with variables', async () => {
    const zolt = `
$w = "100%"
![Alt](img.jpg){width={$w}}
    `;
    const html = await buildString(zolt);
    expect(html).toContain('<img src="img.jpg" alt="Alt" style="width: 100%">');
  });

  test('should handle video, audio, embed, file with variables', async () => {
    const zolt = `
$v = "video.mp4"
$a = "audio.mp3"
$e = "https://youtube.com/123"
$f = "doc.pdf"
!![Video]({$v})
??[Audio]({$a})
@@[Embed]({$e})
&&[File]({$f})
    `;
    const html = await buildString(zolt);
    expect(html).toContain('<video src="video.mp4" class="zolt-video">Video</video>');
    expect(html).toContain('<audio src="audio.mp3">Audio</audio>');
    expect(html).toContain('<iframe src="https://youtube.com/123" title="Embed" style="border: 0" class="zolt-embed"');
    expect(html).toContain('<a href="doc.pdf" target="_blank" rel="noopener">File</a>');
  });

  test('should handle nested loops', async () => {
    const zolt = `
$categories = [
  {name: "Tech", items: [{name: "Laptop"}]}
]
:::foreach {$categories as $cat}
# {$cat.name}
:::foreach {$cat.items as $item}
- {$item.name}
:::
:::
    `;
    const html = await buildString(zolt);
    expect(html).toMatch(/<h1[^>]*>Tech<\/h1>/);
    expect(html).toContain('<li>Laptop</li>');
  });
});
