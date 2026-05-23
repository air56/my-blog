---
title: "AI辅助搭建个人Blog"
date: 2026-05-23
category: "技术"
tags: ["博客", "Next.js", "GitHub Pages", "踩坑"]
description: "从设计到部署，记录用AI辅助搭建个人博客遇到的几个坑。"
---

## 从零开始

参考《明日方舟：终末地》官网的暗色工业风设计，用 **Next.js 14** 搭建了一个个人随笔博客，Markdown 写文章，静态生成后部署到 GitHub Pages。

## 一路踩过的坑

### 1. 仓库公开才能用 GitHub Pages

GitHub Pages 免费版只支持**公开仓库**，私有仓库需要付费。把仓库改为公开后就能用了。

### 2. GitHub Actions 分支策略

第一次部署报错：
```
Branch "master" is not allowed to deploy to github-pages
```
需要在仓库 Settings → Pages 里正确选择 **GitHub Actions** 作为部署源，而不是默认的 "Deploy from a branch"。

### 3. 部署后 UI 全崩

推送到 GitHub 后网站样式全没了——白色背景加一堆超链接。原因是 GitHub Pages 项目站点的路径是 `/my-blog/`，但 Next.js 默认的资源路径是 `/_next/static/...`，浏览器自然找不到 CSS/JS。

修复：在 `next.config.js` 加上 `basePath: '/my-blog'`。

### 4. Chrome 能打开，Edge 不行（最诡异的坑）

Edge 会把地址栏输入的 `https://air56.github.io/my-blog/` 自动替换成 `http://myblog.rin/`（502 错误）。但如果从**搜索栏**进入却正常。

排查后发现：之前曾在 GitHub Pages 设置过自定义域名 `myblog.rin`，虽然删除了配置，但 **Edge 已经缓存了那条 301 永久重定向**，每次输入网址都在本地直接跳转，请求根本没发出去。

搜索栏能打开，是因为搜索请求经过了搜索引擎中转，形成了新的导航上下文，绕过了本地 301 缓存。

Chrome 没事，是因为配置 `myblog.rin` 时 Chrome 根本没访问过那个网站，压根没缓存那条 301。

修复：清除 Edge 缓存即可。

---

从代码配置到部署流程再到浏览器缓存机制，每个坑背后都有值得了解的知识点。记录下来，希望帮到有类似遭遇的人。
