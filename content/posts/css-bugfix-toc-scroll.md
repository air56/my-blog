---
title: "记一次 Blog 翻车：目录漂移与滚动卡死"
date: 2026-05-24
category: "技术"
tags: ["CSS", "Debug", "writing-mode", "scroll-behavior"]
description: "修了两个 CSS Bug：writing-mode 导致目录横向溢出，scroll-behavior: smooth 导致滚轮卡死。"
---

## 背景

上篇 Claude Code Hook 的文章写完，点进去一看，两个 Bug。

## Bug 1：目录漂移到正文里

左侧目录栏压在正文上。短文章标题少看不出来，这篇十个标题直接炸了。

`PostSidebar` 的 CSS：

```css
.nav {
  display: flex;
  flex-direction: column;
  writing-mode: vertical-rl;
}
```

`writing-mode: vertical-rl` 把块轴变成了水平方向，`flex-direction: column` 跟着块轴走——导航按钮横向排列，十个按钮加起来 ~200px，sidebar 只有 60px，溢出部分侵入正文。

**修复：** `writing-mode` 只加在按钮上，不要加在容器上。

```css
.nav {
  display: flex;
  flex-direction: column;
  /* writing-mode 删掉 */
}
.navItem {
  writing-mode: vertical-rl; /* 保留 */
}
```

## Bug 2：滚轮滚到一半卡死

鼠标滚轮往下滚，页面不动，进度条也不动。点一下鼠标，内容"唰"地跳到应有位置。

两个因素叠加：

**一、`html { scroll-behavior: smooth }`** 让鼠标滚轮也走 smooth 动画。Chrome 的已知问题：滚轮产生的连续小步长动画排队积压，主线程卡死。

**二、Header 的 scroll 事件没节流。** 每次事件都 `scrollHeight`（强制 layout）+ 两次 `setState`（两次 React 重渲染）。

**修复：** 删掉全局 `scroll-behavior: smooth`，scroll 事件加 `requestAnimationFrame` 节流。

## 总结

两个 CSS 属性都是对的，靶点不对就成了 Bug。`writing-mode` 不该加容器上，`scroll-behavior: smooth` 不该全局生效，scroll 事件不该裸奔。
