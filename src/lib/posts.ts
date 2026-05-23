import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'content', 'posts');

export type Post = {
  slug: string;
  title: string;
  date: string;
  category: string;
  tags: string[];
  description: string;
  content: string;
};

export function getPostSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) return [];
  return fs.readdirSync(postsDirectory).filter((file) => file.endsWith('.md') || file.endsWith('.mdx'));
}

export function getPostBySlug(slug: string): Post | null {
  try {
    const realSlug = slug.replace(/\.(md|mdx)$/, '');
    const fullPath = path.join(postsDirectory, `${realSlug}.md`);

    let filePath = fullPath;
    if (!fs.existsSync(filePath)) {
      filePath = path.join(postsDirectory, `${realSlug}.mdx`);
    }
    if (!fs.existsSync(filePath)) return null;

    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug: realSlug,
      title: data.title || '',
      date: data.date ? new Date(data.date).toISOString().split('T')[0] : '',
      category: data.category || '未分类',
      tags: data.tags || [],
      description: data.description || '',
      content,
    };
  } catch {
    return null;
  }
}

export function getAllPosts(): Post[] {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug.replace(/\.(md|mdx)$/, '')))
    .filter((post): post is Post => post !== null)
    .sort((a, b) => (a.date > b.date ? -1 : 1));
  return posts;
}

export function getAllCategories(): { name: string; count: number }[] {
  const posts = getAllPosts();
  const categoryMap = new Map<string, number>();
  posts.forEach((post) => {
    categoryMap.set(post.category, (categoryMap.get(post.category) || 0) + 1);
  });
  return Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

export function getPostsByCategory(category: string): Post[] {
  return getAllPosts().filter((post) => post.category === category);
}
