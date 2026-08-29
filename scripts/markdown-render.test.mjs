import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from '../src/lib/markdown.ts';

test('renders fenced code as a real code block without paragraph nesting', () => {
  const html = renderMarkdown('```powershell\nwsl -l -v\n```');

  assert.match(html, /<pre><code class="language-powershell">[\s\S]*wsl -l -v[\s\S]*<\/code><\/pre>/);
  const codeBlocks = html.match(/<pre>[\s\S]*?<\/pre>/g) || [];
  assert.ok(codeBlocks.length > 0);
  assert.ok(codeBlocks.every((block) => !/<p>/.test(block)));
  assert.doesNotMatch(html, /```/);
});

test('keeps inline code separate from fenced code', () => {
  const html = renderMarkdown('运行 `docker ps -a` 查看容器。');

  assert.match(html, /<p>运行 <code>docker ps -a<\/code> 查看容器。<\/p>/);
  assert.doesNotMatch(html, /<pre>/);
});

test('renders headings, lists, blockquotes, and tables as structured HTML', () => {
  const html = renderMarkdown([
    '## 排错清单',
    '',
    '- 检查网络',
    '- 检查容器',
    '',
    '> 先确认上一层正常。',
    '',
    '| 现象 | 优先检查 |',
    '| --- | --- |',
    '| 超时 | 代理 |',
  ].join('\n'));

  assert.match(html, /<h2 id="排错清单">排错清单<\/h2>/);
  assert.match(html, /<ul>[\s\S]*<li>检查网络<\/li>[\s\S]*<li>检查容器<\/li>[\s\S]*<\/ul>/);
  assert.match(html, /<blockquote>[\s\S]*先确认上一层正常。[\s\S]*<\/blockquote>/);
  assert.match(html, /<table>[\s\S]*<th>现象<\/th>[\s\S]*<td>代理<\/td>[\s\S]*<\/table>/);
});

test('uses the same deterministic heading ids as the article sidebar', () => {
  const html = renderMarkdown('## Docker / WSL：网络问题');

  assert.match(html, /<h2 id="docker--wsl网络问题">Docker \/ WSL：网络问题<\/h2>/);
});

test('renders the target article without malformed fence artifacts', async () => {
  const fs = await import('node:fs/promises');
  const source = await fs.readFile(new URL('../content/posts/wsl-astrbot-bangumi.md', import.meta.url), 'utf8');
  const content = source.replace(/^---[\s\S]*?---\s*/, '');
  const html = renderMarkdown(content);

  const codeBlocks = html.match(/<pre>[\s\S]*?<\/pre>/g) || [];
  assert.ok(codeBlocks.length > 0);
  assert.ok(codeBlocks.every((block) => !/<p>/.test(block)));
  assert.doesNotMatch(html, /<p>\s*<h[1-6]/);
  assert.doesNotMatch(html, /<p>\s*<li>/);
  assert.match(html, /<pre><code class="language-powershell">/);
  assert.match(html, /<pre><code class="language-json">/);
});

test('renders every published article with valid code-block structure', async () => {
  const fs = await import('node:fs/promises');
  const postsDirectory = new URL('../content/posts/', import.meta.url);
  const filenames = (await fs.readdir(postsDirectory)).filter((name) => name.endsWith('.md'));

  for (const filename of filenames) {
    const source = await fs.readFile(new URL(filename, postsDirectory), 'utf8');
    const content = source.replace(/^---[\s\S]*?---\s*/, '');
    const html = renderMarkdown(content);
    const codeBlocks = html.match(/<pre>[\s\S]*?<\/pre>/g) || [];

    assert.doesNotMatch(html, /```/g, filename);
    assert.ok(codeBlocks.every((block) => !/<p>/.test(block)), filename);
    assert.doesNotMatch(html, /<p>\s*<h[1-6]/, filename);
    assert.doesNotMatch(html, /<p>\s*<li>/, filename);
  }
});