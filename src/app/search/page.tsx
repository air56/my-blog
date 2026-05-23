import { getAllPosts } from '@/lib/posts';
import type { Metadata } from 'next';
import SearchClient from '@/components/SearchBar';

export const metadata: Metadata = {
  title: '搜索',
  description: '搜索文章',
};

export default function SearchPage() {
  const posts = getAllPosts();
  return <SearchClient posts={posts} />;
}
