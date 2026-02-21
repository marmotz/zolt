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

  test('should build audio', async () => {
    const html = await buildString('??[Audio](audio.mp3){controls}');
    expect(html).toContain('<audio src="audio.mp3" controls>Audio</audio>');
  });

  test('should build embed', async () => {
    const html = await buildString('@@[Title](https://youtube.com/embed/123){width=100%}');
    expect(html).toContain('<iframe src="https://youtube.com/embed/123" title="Title" style="width: 100%"></iframe>');
  });

  test('should build downloadable file', async () => {
    const html = await buildString('&&[Download](doc.pdf){class=download-btn}');
    expect(html).toContain('<a href="doc.pdf" class="download-btn">Download</a>');
  });

  test('should build link with attributes', async () => {
    const html = await buildString('[Link](url.zlt){color=red target=_blank}');
    expect(html).toContain('<a href="url.html" style="color: red" target="_blank">Link</a>');
  });
});
