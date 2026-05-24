---
title: "给 Claude 写了个 Blog 写作 Skill"
date: 2026-05-24
category: "技术"
tags: ["Claude Code", "Skill", "Blog", "自动化", "skill-creator"]
description: "用 skill-creator 把博客写作流程做成可复用的 skill，基准测试 with_skill 满分 vs without_skill 87.5%。"
---

## 背景

每次让 Claude 帮忙写博客，都要在 prompt 里重复"精简一点""用表格总结""标题加冒号"。写上一篇 bug 修复 blog 时，第一版偏长，说了"精简一些"才缩到满意。

决定把它做成 skill——固化风格，省掉每次重复约束。

## 设计

跟 Claude 聊了三个问题把需求定下来：

- **什么时候触发？** "写成博客""记录成文章""把修改整理出来"
- **输入是什么？** 对话上下文，不需要额外提供素材
- **输出是什么？** 先展示审阅，确认后写入 `content/posts/`，构建后推 GitHub

写作风格从已有的两篇 blog 提取模板：背景 → 分析 → 修复 → 总结表格。代码片段是核心，段落短，标题用冒号分隔。

## 评测

skill-creator 框架要求跑 with_skill vs without_skill 对照测试。设计了 3 个用例：

| 用例 | 场景 |
|------|------|
| CSS bug 修复 | writing-mode + scroll-behavior 两个坑 |
| 暗色模式实现 | next-themes + hydration 闪烁 |
| ESLint 配置 | flat config + prettier 版本冲突 |

6 个 agent 并行跑。用 8 个客观指标评分：frontmatter 完整性、日期格式、代码块、章节结构、总结段落、水词检查、标题格式、长度控制。

## 结果

| | With Skill | Without Skill |
|---|---|---|
| Pass Rate | **100%** | 87.5% |
| 超长 | 0 篇 | 2 篇 |
| 水词 | 0 篇 | 1 篇 |
| 平均耗时 | 235s | 337s |

带 skill 的三篇全部满分。不带 skill 的暗色模式和 ESLint 两篇都超过 5000 字符，暗色模式那篇还出现了啰嗦的开场白。

时间上快了 30%。有明确结构约束，模型不需要自己琢磨格式和篇幅。

## 总结

做这个 skill 的收益不在于让模型"写得更漂亮"——模型还是那个模型。收益在于：

1. **风格稳定**：不会这篇精简下篇啰嗦，每次格式一致
2. **省掉重复指令**：不用再说"精简一点""用表格"
3. **审阅 + 推送一步走**：确认即发布，不用手动 git 操作

这个 skill 已经内置在当前环境，直接说 **"把这次的修改写成博客"** 就会触发。
