---
title: "Telegram 接入 Bot 并实现远程控制电脑"
date: 2026-08-09
category: "技术"
tags: ["Telegram", "DeepSeek", "aiogram", "Python", "远程控制"]
description: "把 Telegram bot 接入 DeepSeek AI：TDD 实现、三个真 Bug、代理与开机自启，下一步扩展远程控制电脑。"
---

## 背景

想在自己的 Telegram 里随时和 AI 对话，顺便为"远程控制电脑"打基础。于是先做了第一步：写一个 Telegram bot，用户发消息，bot 透传给 DeepSeek，把回答发回来。

技术栈：Python + aiogram 3.x，本机 Windows 跑，长轮询模式。

## 设计

核心是一个工厂函数，方便测试注入：

```
Telegram 用户 → bot.py → handlers.py → deepseek.py → DeepSeek API
```

- `handlers.py`：白名单校验 → typing 指示 → 调 DeepSeek → 分段回复
- `deepseek.py`：`chat/completions` 客户端，超时/错误归一化
- `config.py`：从 `.env` 读配置

数据流：

```json
POST https://api.deepseek.com/chat/completions
{
  "model": "deepseek-chat",
  "messages": [{"role": "user", "content": "你好"}],
  "stream": false
}
```

按 TDD 写，6 个任务、15 个单测全绿。但真正的问题都在"跑起来"之后暴露。

## 真 Bug 1：`.env` 没被加载

bot 启动报"缺少 BOT_TOKEN"，但 `.env` 里明明写了。测试全过，线上不认。

原因：`config.py` 用 `os.getenv()` 读配置，但**从没调用 `load_dotenv()`**。单测用 `monkeypatch` 直接设环境变量，掩盖了这个坑。

```python
# 修复前
import os
from dataclasses import dataclass, field

# 修复后
import os
from dotenv import load_dotenv
load_dotenv()
```

**教训**：单测永远测不到"环境变量从哪来"这一步。配置加载要单独验证。

## 真 Bug 2：国内网络连不上 Telegram

bot 能启动，但一连接 `api.telegram.org:443` 就超时崩溃。`WinError 121 信号灯超时时间已到`。

根因：直连被墙。Telegram 必须走代理。

我的机器上 Clash 监听 `127.0.0.1:7890`。aiogram 的 `AiohttpSession` 支持 `proxy` 参数：

```python
from aiogram.client.session.aiohttp import AiohttpSession

session = AiohttpSession(proxy="http://127.0.0.1:7890")
bot = Bot(token=settings.bot_token, session=session)
```

代理地址做成配置项，放在 `.env` 里。

**教训**：网络环境差异单测测不出来。先 `curl` 验证连通性，再写连接代码。

## 真 Bug 3：白名单为空的提示自相矛盾

`bot.py` 里，白名单为空时打警告然后 `return`，警告文案却是"请先给 bot 发一条消息，再从日志读 chat_id"。但 bot 都不启动，用户怎么发消息？

修复：白名单为空时**不要 return**，让 bot 跑起来（非白名单消息被静默忽略），用户发了消息，我加一行日志读出 chat_id，填进 `.env` 重启。

```python
# 修复前
if not settings.allowed_chat_ids:
    logging.warning("...请先给 bot 发一条消息...")
    return  # ← bot 不启动，根本收不到消息

# 修复后
if not settings.allowed_chat_ids:
    logging.warning("...请先给 bot 发一条消息，然后从日志中读取 chat_id...")
    # 不 return，让 bot 跑起来
```

## 开机自启：让 bot 真正"常驻"

代码跑通了，但 bot 是我用后台进程临时拉起来的，**依赖我的会话，会话关了 bot 就停**。要像客户端 LLM 一样随时对话，得做成系统级常驻。

### 依赖顺序问题

bot 连 Telegram 必须走 Clash（`127.0.0.1:7890`）。开机时如果 Clash 还没起来，bot 直接崩。两个方案：

1. 让启动脚本等 7890 就绪再启动 bot
2. 给 bot 加**自动重连**：连不上就每 5 秒重试

我两个都做了。`start-clash.bat` 等端口就绪，`bot.py` 的 `_poll_with_retry` 兜底：

```python
async def _poll_with_retry(bot, dp):
    while True:
        try:
            await dp.start_polling(bot)
            return
        except TelegramNetworkError as exc:
            logging.warning("连接 Telegram 失败，%s 秒后重试…", RETRY_DELAY_SECONDS)
            await asyncio.sleep(RETRY_DELAY_SECONDS)
```

### 开机自启方式

试了 `schtasks` 计划任务，提示"拒绝访问"（需要管理员权限）。改用**启动文件夹**，用户级、免管理员：

`%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\`

放一个快捷方式，指向 `start-all.bat`：

```bat
call start-clash.bat    :: 启动 Clash + 等 7890 就绪
call start-bot.bat      :: 启动 bot（带 PID 单实例保护）
```

### 单实例保护

`start-bot.bat` 用 PID 文件防止重复启动：

```bat
if exist "%PID_FILE%" (
  set /p OLD_PID=<"%PID_FILE%"
  tasklist /FI "PID eq !OLD_PID!" | findstr "!OLD_PID!" >nul
  if not errorlevel 1 (
    echo Bot already running
    exit /b 0
  )
)
```

踩过一个 bat 的坑：**`set /p` 在 `if` 括号块内要用延迟展开 `!OLD_PID!`**，否则 `%OLD_PID%` 在解析整块时还是空的，导致 `FINDSTR: 没有搜索字符串`。

## 下一步：远程控制电脑

到这里，Telegram 接入 bot 这条链路已经跑通：随时对话、开机自启、不依赖任何会话。

下一阶段的目标是把这条链路**扩展成远程控制**：

- 在 bot 里加命令白名单，比如 `/cmd` 执行指定命令、`/open` 打开程序
- 复用现有的白名单校验——只有自己的 chat_id 能触发控制指令
- 执行结果用现在这套分段发送逻辑回传

入口已经有了，接下来是给 `handlers.py` 加"指令处理器"，让 bot 从"只会对话"变成"能动手"。

## 总结

| 根因 | 修复 | 教训 |
| --- | --- | --- |
| 忘了 `load_dotenv()` | 补上 | 配置加载要单独验证，单测覆盖不到 |
| 国内网络连不上 Telegram | 代理 + 重连 | 先 curl 验证连通性 |
| 白名单空时提示自相矛盾 | 不 return，先跑起来 | 提示要可执行 |
| 会话关闭 bot 就停 | 开机自启 + PID 保护 | 常驻服务要独立于会话 |
| bat 变量在括号内失效 | 延迟展开 | Windows 批处理的老坑 |

Telegram 接入 bot 只是第一步。真正让"远程控制"可用，靠的是这条链路**跑得稳**——开机自启、自动重连、单实例保护，再加上白名单做安全边界。下一篇文章，等远程控制写完见。
