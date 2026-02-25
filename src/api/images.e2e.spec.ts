import { describe, expect, test } from 'bun:test';
import { buildString } from './index';

describe('API: Images', () => {
  test('should build basic image', async () => {
    const html = await buildString('![Alt text](image.jpg)');
    expect(html).toContain('<img src="image.jpg" alt="Alt text">');
  });

  test('should build image with attributes', async () => {
    const html = await buildString('![Alt text](image.jpg){width=100px height=50px}');
    expect(html).toContain('<img src="image.jpg" alt="Alt text" style="width: 100px; height: 50px">');
  });

  test('should build image with class and id', async () => {
    const html = await buildString('![Alt text](image.jpg){.my-class #my-id}');
    expect(html).toContain('<img src="image.jpg" alt="Alt text" id="my-id" class="my-class">');
  });

  test('should build image in a paragraph', async () => {
    const html = await buildString('Here is an image: ![Avatar](avatar.jpg) in text.');
    expect(html).toContain('<p>Here is an image: <img src="avatar.jpg" alt="Avatar"> in text.</p>');
  });

  test('should build image with mixed attributes and CSS', async () => {
    const html = await buildString('![Avatar](avatar.jpg){width=50px .rounded loading=lazy}');
    expect(html).toContain('<img src="avatar.jpg" alt="Avatar" style="width: 50px" class="rounded" loading="lazy">');
  });

  test('should build video', async () => {
    const html = await buildString('!![Video](video.mp4){autoplay}');
    expect(html).toContain('<video src="video.mp4" autoplay>Video</video>');
  });

  test('should automatically embed YouTube videos', async () => {
    const html = await buildString('!![Intro](https://www.youtube.com/watch?v=dQw4w9WgXcQ)');
    expect(html).toContain('<iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"');
    expect(html).toContain('title="Intro"');
    expect(html).toContain('style="border: 0"');
    expect(html).toContain('referrerpolicy="strict-origin-when-cross-origin"');
    expect(html).toContain('allowfullscreen');
  });

  test('should automatically embed Vimeo videos', async () => {
    const html = await buildString('!![Demo](https://vimeo.com/123456789)');
    expect(html).toContain('<iframe src="https://player.vimeo.com/video/123456789"');
    expect(html).toContain('title="Demo"');
    expect(html).toContain('style="border: 0"');
    expect(html).toContain('referrerpolicy="strict-origin-when-cross-origin"');
  });

  test('should build audio', async () => {
    const html = await buildString('??[Audio](audio.mp3){controls}');
    expect(html).toContain('<audio src="audio.mp3" controls>Audio</audio>');
  });

  test('should build embed', async () => {
    const html = await buildString('@@[Title](https://youtube.com/embed/123){width=100%}');
    expect(html).toContain('<iframe src="https://youtube.com/embed/123" title="Title" style="width: 100%; border: 0"');
  });

  test('should build downloadable file', async () => {
    const html = await buildString('&&[Download](doc.pdf){class=download-btn}');
    expect(html).toContain('<a href="doc.pdf" class="download-btn">Download</a>');
  });

  test('should build link with attributes', async () => {
    const html = await buildString('[Link](url.zlt){color=red target=_blank}');
    expect(html).toContain('<a href="url.html" style="color: red" target="_blank">Link</a>');
  });

  test('should handle shadow attribute on images', async () => {
    const html = await buildString('![Alt](img.jpg){shadow=true}');
    expect(html).toContain('style="box-shadow: 0 4px 12px var(--zlt-color-shadow)"');
  });

  test('should handle custom shadow value', async () => {
    const html = await buildString('![Alt](img.jpg){shadow="10px 10px 5px grey"}');
    expect(html).toContain('style="box-shadow: 10px 10px 5px grey"');
  });

  test('should handle shorthand w and h attributes', async () => {
    const html = await buildString('![Alt](img.jpg){w=300 h=200}');
    expect(html).toContain('style="width: 300px; height: 200px"');
  });

  test('should add margin-left to float:right images', async () => {
    const html = await buildString('![Alt](img.jpg){float=right}');
    expect(html).toContain('style="float: right; margin-left: 1rem"');
  });

  test('should add margin-right to float:left images', async () => {
    const html = await buildString('![Alt](img.jpg){float=left}');
    expect(html).toContain('style="float: left; margin-right: 1rem"');
  });

  test('should not add automatic margin if explicitly provided', async () => {
    const html = await buildString('![Alt](img.jpg){float=right margin-left=2rem}');
    expect(html).toContain('style="float: right; margin-left: 2rem"');
    expect(html).not.toContain('margin-left: 1rem');
  });

  test('should NOT lose slashes in YouTube URLs', async () => {
    const html = await buildString('!![Kittens](https://www.youtube.com/watch?v=y0sF5xhGreA)');
    expect(html).toContain('src="https://www.youtube-nocookie.com/embed/y0sF5xhGreA"');
  });
});
