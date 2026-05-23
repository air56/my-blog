'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { createSearcher, searchPosts } from '@/lib/search';
import type { Post } from '@/lib/posts';
import styles from '@/styles/Search.module.css';

type Props = {
  posts: Post[];
};

function SearchClient({ posts }: Props) {
  const [query, setQuery] = useState('');
  const searcher = useMemo(() => createSearcher(posts), [posts]);

  const results = useMemo(() => searchPosts(searcher, query), [searcher, query]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const highlightText = (text: string, keyword: string) => {
    if (!keyword.trim()) return text;
    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className={styles.highlight}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>搜索</h1>
        <p className={styles.subtitle}>Search</p>
        <div className={styles.divider} />
      </div>

      <div className={styles.inputWrapper}>
        <span className={styles.inputIcon}>◆</span>
        <input
          type="text"
          className={styles.input}
          placeholder="搜索文章..."
          value={query}
          onChange={handleChange}
          autoFocus
        />
      </div>

      {query.trim() ? (
        results.length > 0 ? (
          <>
            <p className={styles.resultCount}>找到 {results.length} 个结果</p>
            {results.map((post) => (
              <Link key={post.slug} href={`/posts/${post.slug}`} className={styles.resultItem}>
                <div className={styles.resultTitle}>{highlightText(post.title, query)}</div>
                <div className={styles.resultMeta}>
                  {post.date} · {post.category}
                </div>
                {post.description && (
                  <div className={styles.resultDescription}>
                    {highlightText(post.description, query)}
                  </div>
                )}
              </Link>
            ))}
          </>
        ) : (
          <div className={styles.empty}>
            <p>未找到相关内容</p>
            <p style={{ fontSize: '0.875rem', marginTop: 'var(--space-sm)' }}>
              试试其他关键词
            </p>
          </div>
        )
      ) : (
        <div className={styles.empty}>
          <p style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>◇</p>
          <p>输入关键词搜索文章</p>
        </div>
      )}
    </div>
  );
}

export default SearchClient;
