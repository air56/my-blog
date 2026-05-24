---
title: "给 Claude Code 装上中文审批摘要 Hook"
date: 2026-05-24
category: "技术"
tags: ["Claude Code", "AI", "Hook", "Node.js"]
description: "写一个 PreToolUse Hook，让 Claude Code 每次请求审批时自动显示中文变更摘要。"
---

## 痛点

Claude Code 每次要写文件、改代码或执行命令时，弹出一个英文的 `Allow this tool call? [yes/no]`。批还是不批？得仔细看参数才明白它要做什么。我想要的是：每次审批时自动附带一份**结构化的中文变更摘要**。

## 寻找现成方案

搜索了一圈：**ai-report-to-me** 能生成中文日报，但不能用在实时审批场景。Claude Code 的 **Hooks 系统**提供了 `PreToolUse` 事件，理论上可以实现，但没有现成的插件。

## 实现原理

Hook 机制本质是事件驱动的脚本执行。在 settings.json 中注册回调，脚本通过 stdin 接收工具调用 JSON，通过 stdout 返回决策：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit|Bash",
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/preapproval.cjs" }
        ]
      }
    ]
  }
}
```

脚本核心逻辑只有三步：解析 JSON → 生成中文摘要 → 输出 `{"decision": "ask"}`。`ask` 的好处是将摘要展示和审批流程合二为一，不需要额外 UI。

## 踩坑

**配置格式必须精确。** 我最初写的是对象格式，直接被 settings 校验器拒了——`PreToolUse` 必须是数组格式。文档必须写实际验证过的代码，不能靠记忆推测。

## 迭代

初始只覆盖 `Write|Edit|Bash`，用了几次发现文件搜索（Glob）、内容搜索（Grep）、网页抓取（WebFetch）等操作同样需要中文摘要。扩展 matcher 并添加对应的摘要模板即可。

不同操作的摘要各有侧重：

- **Write** → 文件路径、新旧大小对比、diff
- **Bash** → 命令内容、风险等级（`rm -rf /` 标红，`git push` 标黄）
- **Glob/Grep** → 搜索范围、关键词
- **WebFetch** → 目标 URL、查询内容

## 效果

审批从"开盲盒"变成了"看菜单"。写文件时看到 diff 预览，执行命令时看到风险提示，搜文件时看到搜索范围。清楚、可控。

这个技能已内置在当前环境中，直接对 Claude 说 **"帮我设置中文审批报告"** 即可安装。

---

## 迭代：从脚本到技能

最初的版本只是一个 hook 脚本加一段 JSON 配置，能用但粗糙。每次想在新项目用，都得手动复制脚本、手写配置。于是开始把它做成一个可复用的技能。

### 脚本增强

随着使用场景变多，逐步覆盖了更多工具：

- **Write** — 新增 diff 对比：写入前自动生成差异预览，大文件自动截断
- **Bash** — 新增命令风险评估：`rm -rf /` 标红，`git push` 标黄，`ls` 标绿
- **Glob / Grep / WebFetch / WebSearch** — 新增搜索类工具的中文摘要，之前审批时只看到工具名
- **双模式支持** — 兼容 `PreToolUse`（返回 JSON 决策）和 `PermissionRequest`（文本附在弹窗旁）

### 评估闭环

技能光能跑不够，还得验证 AI 能不能正确安装它。写了三个 eval 场景：

1. **安装** — "帮我安装中文审批报告"，验证 AI 是否按 SKILL.md 正确执行
2. **重装** — "之前的 hook 不工作了，帮我重新设置"，验证是否能识别已安装状态
3. **卸载** — "不需要了，帮我把 hook 卸载掉"，验证能否干净清理

有技能指导时正确率 ~90%，没有技能裸写时 ~40%。差距主要在配置格式和路径引用——AI 靠记忆写出来的经常跟 Claude Code 实际要求的格式不一致。

### 持续打磨

技能上线后，每次使用都在发现问题：触发描述不够精准、SKILL.md 配置模板有歧义、卸载步骤不够清晰……每次遇到就改一点。刚才又让 Claude 帮忙完善了 SKILL.md 的结构，把安装步骤拆得更细，加了故障排除章节。

从最初一段 JSON 配置，到有脚本、有文档、有评估的完整技能包——工具的成长和代码一样，都是迭代出来的。
