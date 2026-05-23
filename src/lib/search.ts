import Fuse from 'fuse.js';
import type { Post } from './posts';

export function createSearcher(posts: Post[]) {
  return new Fuse(posts, {
    keys: [
      { name: 'title', weight: 2 },
      { name: 'description', weight: 1 },
      { name: 'category', weight: 1 },
      { name: 'tags', weight: 1.5 },
      { name: 'content', weight: 0.5 },
    ],
    threshold: 0.4,
    includeScore: true,
    minMatchCharLength: 1,
  });
}

export function searchPosts(searcher: Fuse<Post>, query: string): Post[] {
  if (!query.trim()) return [];
  return searcher.search(query.trim()).map((r) => r.item);
}
