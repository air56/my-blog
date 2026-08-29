import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

test('学习栏目会在顶部导航中指向 /learning', async () => {
  const header = await fs.readFile(path.join(root, 'src/components/Header.tsx'), 'utf8');
  assert.match(header, /href:\s*['"]\/learning['"][\s\S]*label:\s*['"]学习['"]/);
});

test('计算机网络入门文章属于学习分类并按提问顺序组织', async () => {
  const article = await fs.readFile(path.join(root, 'content/posts/computer-network-basics.md'), 'utf8');
  assert.match(article, /title:\s*["']计算机网络入门["']/);
  assert.match(article, /category:\s*["']学习["']/);

  const headings = [...article.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1]);
  assert.deepEqual(headings.slice(0, 4), [
    '第一次提问：IP、网关、端口与网络安全',
    '第二次提问：ping 1.1.1.1 在做什么',
    '第三次提问：nslookup 与 DNS 地址',
    '第四次提问：MAC 地址与 Wi-Fi 配置',
  ]);
});

test('学习页面会读取学习分类下的文章', async () => {
  const page = await fs.readFile(path.join(root, 'src/app/learning/page.tsx'), 'utf8');
  assert.match(page, /getPostsByCategory\(['"]学习['"]\)/);
});
