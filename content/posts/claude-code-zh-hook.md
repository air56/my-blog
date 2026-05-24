---
title: "给 Claude Code 装上中文审批摘要 Hook"
date: 2026-05-24
category: "技术"
tags: ["Claude Code", "AI", "Hook", "Node.js", "调试"]
description: "写一个中文审批摘要 Hook，从字段名写错、事件类型选错到发现 reason 字段——完整的踩坑、迭代与 debug 记录。"
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

---

## 调试：Hook 为什么还是不触发

装好之后用了几天，发现不对劲——明明配置好了，为什么从来没看到过中文摘要？让 Claude 检查了四五轮，每次都回复"没问题啊，应该能跑"，但实际就是不生效。

### 线索一：debug 日志

加了一行 debug log 把 stdin 原样写到文件：

```js
const LOG = '~/.claude/hooks/preapproval.log';
function debug(...args) {
  fs.appendFileSync(LOG, new Date().toISOString() + ' ' + args.join(' ') + '\n');
}
```

日志显示 hook **确实在跑**，每次工具调用都有记录。说明 hook 注册和触发机制都没问题，问题出在脚本内部。

### 定位：JSON 字段名不匹配

对比日志中的原始 JSON 和脚本解析逻辑，发现根本原因：

Claude Code 实际传的 JSON 结构是：

```json
{
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": { "command": "ls ..." }
}
```

而脚本最初写的解析逻辑是：

```js
const toolCall = input.tool_call || {};           // → undefined → {}
const tool = (toolCall.tool || input.tool);       // → undefined → 'unknown'
const args = (toolCall.arguments || input.arguments); // → undefined → {}
```

脚本在找 `tool_call.tool`，实际字段是 `tool_name`——两者从来没有对上过。结果所有工具都被识别为 `unknown`，参数永远为空对象，摘要退化成一串无意义的泛用文本。之前几次迭代都意识到了"可能需要兼容不同格式"，加了 fallback，但 fallback 优先级排错了——`input.tool` 又不存在，始终落到兜底值。

### 根源二：PreToolUse 的 output 不嵌入审批弹窗

字段名修好后测试，脚本输出完全正确——但真正触发审批时，弹窗依然是纯英文。

原因是 PreToolUse hook 返回的 JSON 中，`output` 字段**不会嵌入 Claude Code 原生的 permission prompt**。它可能被记录到某处，但用户在 yes/no 弹窗里根本看不到。SKILL.md 其实写了："PermissionRequest hook 的输出会附加在已有的权限弹窗旁"——当初安装时配置错了事件类型。

### 走弯路：PostToolUse

发现 PreToolUse 不显示，我第一反应是换成 `PostToolUse`——每次工具执行完都输出摘要。但这完全是方向性错误：PostToolUse 在工具**执行之后**才触发，而审批弹窗在**执行之前**就已经关了。摘要永远追不上弹窗。

### 弯路尽头：PermissionRequest

回头看 SKILL.md，正确的事件是 `PermissionRequest`——它专门用于在权限弹窗旁附加信息。不需要 matcher，不需要返回 JSON 决策，只需要向 stdout 打印文本：

```json
{
  "hooks": {
    "PermissionRequest": [
      {
        "hooks": [{ "type": "command", "command": "node .claude/hooks/preapproval.cjs" }]
      }
    ]
  }
}
```

换上去之后，中文摘要确实出现在弹窗旁边了。但 PermissionRequest 有个限制：它只负责在弹窗旁"贴一段文本"，无法通过返回 JSON 来控制审批流程——脚本只能打印，不能做拦截或自动决策。

### 终极方案：PreToolUse + reason 字段

用了一段时间 PermissionRequest，总觉得不够优雅。直到某天重读 Claude Code Hook 文档，发现 PreToolUse 的 JSON 返回值中有一个被我忽略的字段：`reason`。

Hook 返回的 JSON 结构是：

```json
{
  "decision": "ask",
  "reason": "这里写的内容会嵌入到审批弹窗中"
}
```

`reason` 字段的内容**会直接显示在审批弹窗的提示文字里**——这不就是我一开始想要的效果吗？之前只关注了 `output` 字段，完全没注意到 `reason`。

于是最终方案又回到了 PreToolUse，但这次参数对了：

1. **事件**：`PreToolUse`（拦截工具调用，返回决策）
2. **matcher**：`Write|Edit|Bash|Glob|Grep|Read|WebFetch|WebSearch`
3. **输出**：JSON `{ decision: "ask", reason: summary }`

脚本同时兼容两种模式——检测到事件是 `permissionrequest` 时打印纯文本，否则返回 JSON：

```js
if (event === 'permissionrequest') {
  console.log(summary);               // 纯文本附加
} else {
  console.log(JSON.stringify({        // JSON 嵌入弹窗
    decision: 'ask',
    reason: summary
  }));
}
```

### 教训

三道防线全被绕过：

- **第一道**：JSON 字段名写错了，一开始就没有正确识别工具
- **第二道**：安装时选错了事件类型（PreToolUse 而非 PermissionRequest）
- **第三道**：修到 PermissionRequest 就以为到终点了，没继续探索 PreToolUse 的 `reason` 字段

事后看每一步都"明显"，但当时没有任何可见反馈——hook 的 stdout 不直接展示给用户，出问题时完全黑盒。能定位全靠那行 debug log。**给以后写 hook 的自己：先加日志，不要相信"看起来能跑"。**
