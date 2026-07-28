/** giscus 评论系统配置
 *
 * 使用前需要：
 * 1. 在 GitHub 仓库启用 Discussions
 * 2. 安装 giscus GitHub App：https://github.com/apps/giscus
 * 3. 访问 https://giscus.app 配置并获取 repoId 和 categoryId
 */
export const commentConfig = {
  /** GitHub 仓库名 */
  repo: 'air56/my-blog',
  /** GitHub 仓库 ID（需从 giscus.app 获取） */
  repoId: process.env.NEXT_PUBLIC_GISCUS_REPO_ID ?? '',
  /** Discussions 分类名 */
  category: 'General',
  /** Discussions 分类 ID（需从 giscus.app 获取） */
  categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID ?? '',
  /** 映射方式：使用页面路径匹配 */
  mapping: 'pathname' as const,
  /** 启用表情反应 */
  reactionsEnabled: '1' as const,
  /** 评论输入位置：顶部 */
  inputPosition: 'top' as const,
  /** 主题 */
  theme: 'dark' as const,
  /** 语言 */
  lang: 'zh-CN' as const,
};
