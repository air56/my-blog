---
title: "AstrBot Docker + WSL 使用备忘录"
date: 2026-08-28
category: "学习"
tags: ["AstrBot", "Docker", "WSL", "备忘录"]
description: "记录 Windows + WSL2 + Docker Desktop 部署 AstrBot 后的启动、管理、常用指令和故障排查流程。"
---

这篇文章只解决一个问题：**以后忘记 AstrBot 怎么启动、怎么进管理面板、怎么查日志时，能快速照着做。**

默认环境是 Windows + WSL2 + Docker Desktop，AstrBot 通过 Docker Compose 运行，项目目录假设为 `~/AstrBot`。

## 1. 命令速查：先把 AstrBot 唤醒

### 1.1 Windows PowerShell：打开 WSL

```powershell
# 打开默认 WSL 发行版
wsl

# 如果安装了多个发行版，指定 Ubuntu
wsl -d Ubuntu
```

如果 Docker Desktop 没有运行，可以在 PowerShell 中尝试启动：

```powershell
Start-Process "$Env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
```

也可以直接从 Windows 开始菜单打开 **Docker Desktop**。等待 Docker Desktop 左下角显示引擎正在运行后，再继续下面的命令。

### 1.2 WSL Shell：确认 Docker 并进入 AstrBot 目录

```bash
# 确认 Docker CLI 可以连接到 Docker Desktop 引擎
docker version
docker info

# 进入 AstrBot 项目目录
cd ~/AstrBot
```

如果你的目录不是 `~/AstrBot`，把最后一行替换成实际路径。`docker info` 能正常输出服务端信息，才说明 WSL 已经连上 Docker 引擎。

### 1.3 WSL Shell：启动 AstrBot

```bash
# 后台启动 Compose 服务
docker compose up -d

# 查看容器状态
docker compose ps

# 查看最近 100 行日志
docker compose logs --tail=100 astrbot

# 持续跟踪日志，按 Ctrl+C 退出跟踪，不会停止容器
docker compose logs -f astrbot
```

看到类似“管理面板已启动”的日志后，说明 AstrBot 服务已经起来了。

### 1.4 Windows PowerShell：打开 AstrBot WebUI

```powershell
explorer.exe http://localhost:6185
```

也可以直接在浏览器地址栏打开：<http://localhost:6185>。

进入聊天页面后，输入下面的 AstrBot 内置指令：

```text
/help
```

注意：`/help` 是发给 AstrBot 的聊天指令，不是在 WSL 终端中执行的命令。

### 1.5 日常停止、重启、更新和备份

下面这些命令适用于 **Docker Compose 部署**，都在 WSL Shell 的 `~/AstrBot` 目录执行：

```bash
# 停止服务，但保留容器和 data 数据
docker compose stop

# 启动已经停止的服务
docker compose start

# 重启服务
docker compose restart

# 拉取最新镜像并重新创建服务
docker compose pull
docker compose up -d

# 备份持久化数据；建议先 stop 再执行
mkdir -p backups
tar -czf "backups/astrbot-data-$(date +%F).tar.gz" data
```

如果是用 `docker run` 创建的单容器，而不是 Compose，则使用下面这一组命令：

```bash
docker start astrbot
docker stop astrbot
docker restart astrbot
docker logs --tail=100 astrbot
docker logs -f astrbot
```

**不要把两套命令混着当成两种部署方式。** 先用 `docker compose ps` 判断项目是否由 Compose 管理；Compose 服务优先使用 `docker compose ...`，单容器才使用 `docker start/stop/restart ...`。

## 2. 第一次部署：记住 compose.yml 长什么样

如果以后需要重新部署，AstrBot 官方 Docker Compose 示例的核心结构如下：

```yaml
services:
  astrbot:
    image: soulter/astrbot:latest
    container_name: astrbot
    restart: always
    ports:
      - "6185:6185"
      - "6199:6199"
    environment:
      - TZ=Asia/Shanghai
    volumes:
      - ./data:/AstrBot/data
```

在 WSL Shell 中，完整流程可以简化为：

```bash
git clone https://github.com/AstrBotDevs/AstrBot.git ~/AstrBot
cd ~/AstrBot
docker compose up -d
docker compose ps
```

这里最重要的是 `./data:/AstrBot/data`。左侧的 `./data` 是 WSL 中 AstrBot 项目目录下的本地数据，右侧是容器内 AstrBot 使用的数据目录。容器删掉或重建后，只要左侧 `data` 还在，配置、插件和会话数据通常就还在。

如果拉取 Docker Hub 镜像很慢，可以把镜像地址替换为官方文档给出的 DaoCloud 镜像地址：

```yaml
image: m.daocloud.io/docker.io/soulter/astrbot:latest
```

## 3. 先理解一次：WSL、Docker Desktop 和 AstrBot 的关系

可以把整套环境记成三层：

| 层 | 作用 | 常用入口 |
| --- | --- | --- |
| Windows | 打开 WSL、打开浏览器、运行 Docker Desktop | PowerShell、开始菜单 |
| WSL2 | 保存项目目录、执行 Linux 命令 | `wsl`、Ubuntu Shell |
| Docker | 管理 AstrBot 容器和镜像 | `docker compose` |

端口映射也要记住：

- `6185:6185`：AstrBot WebUI，浏览器访问 `http://localhost:6185`。
- `6199:6199`：常用于 OneBot v11 / NapCat 连接。
- `./data:/AstrBot/data`：持久化配置、插件和运行数据。

`localhost` 指的是当前访问端口的这台机器。如果 AstrBot 部署在远程服务器，就不能在本地电脑直接访问 `localhost:6185`，需要使用服务器 IP 或域名，并确认服务器防火墙放行对应端口。

## 4. 第一次登录和初始配置

### 登录管理面板

第一次启动时，用户名通常是：

```text
astrbot
```

初始密码会打印在启动日志里。可以在 WSL 中搜索日志：

```bash
docker compose logs astrbot | grep -Ei "password|密码|管理面板|dashboard"
```

登录 `http://localhost:6185` 后，第一件事是修改密码。不要把密码、API Key 或平台 Token 写进公开仓库。

如果忘记管理面板密码，优先尝试 AstrBot CLI 的密码管理命令；Docker 部署也可以按照官方 FAQ 删除 `data/cmd_config.json` 中 dashboard 配置里的 `password` 键值，然后重新启动并使用新的初始密码。

### 配置模型和消息平台

AstrBot 本身只是运行框架，要真正聊天，还需要至少配置：

1. 一个模型提供商和模型，例如 OpenAI 兼容接口或其他官方支持的提供商。
2. 一个消息平台，例如 QQ、Telegram、飞书等。
3. 需要时再安装插件，扩展搜索、工具或平台能力。

这些配置通常在 WebUI 左侧的 **配置**、**平台** 和 **插件** 页面完成。

配置页面修改后要点击 **保存**。如果使用代码编辑配置，流程是：先点击 **应用此配置**，再点击 **保存**；只改文件但不应用，配置不会按预期生效。

## 5. `/help` 和常用聊天指令

这些指令应当发送在 AstrBot 所连接的平台聊天窗口中，而不是 WSL 终端：

| 指令 | 用途 |
| --- | --- |
| `/help` | 查看当前可用指令帮助。 |
| `/sid` | 查看当前会话 ID。 |
| `/name <别名>` | 为当前会话设置别名。 |
| `/reset` | 重置当前会话上下文。 |
| `/stop` | 停止当前正在生成的回复。 |
| `/new` | 新建会话。 |
| `/stats` | 查看模型调用、Token 等统计信息。 |
| `/provider` | 查看或处理当前模型提供商相关信息。 |
| `/dashboard_update` | 更新 AstrBot 管理面板，通常需要管理员权限。 |
| `/set` | 设置配置项。 |
| `/unset` | 删除配置项。 |

有两个容易忘记的细节：

- `/help`、`/set`、`/unset` 默认可能不会完整显示在帮助列表里，但指令仍然可以使用。
- 如果把唤醒前缀从 `/` 改成了 `!`，就要使用 `!help`、`!reset` 这种形式。

## 6. WebUI 日常操作

管理面板可以记成四个区域：

### 配置

修改模型、系统选项和平台配置。改完一定要保存；代码编辑模式下要先应用再保存。

### 插件

在插件市场查看和安装插件，也可以通过 URL 或文件上传安装。插件来自第三方时要先检查来源和权限，不能把插件市场当成绝对安全的软件仓库。

### 数据

可以查看统计、对话、日志和追踪。排查模型调用问题时，先看 WebUI 日志，再结合容器日志：

```bash
docker compose logs --tail=200 astrbot
```

### 指令管理

可以集中查看已注册的指令，并按插件、权限和状态筛选，还可以启用、禁用或重命名指令。

## 7. 日常维护：更新、备份和进入容器

### 更新 AstrBot

```bash
cd ~/AstrBot
docker compose pull
docker compose up -d
docker compose ps
docker compose logs --tail=100 astrbot
```

更新前最好先备份 `data`。如果更新后行为异常，可以先看日志，再回滚到上一个镜像版本或恢复备份，不要第一时间删除数据目录。

### 进入容器临时排查

```bash
docker compose exec astrbot sh
```

容器内的临时修改不等于持久化配置。真正需要保留的配置应当写入挂载出来的 `data` 目录，并通过 WebUI 或官方支持的配置方式修改。

### 关闭并重新创建容器

```bash
docker compose down
docker compose up -d
```

`down` 会删除容器，但不会删除 `./data` 目录。不要随便使用带有 `-v` 的清理命令，也不要直接删除 `data`，除非已经确认备份可用。

## 8. 常见故障排查

### Docker 命令能找到，但连接不上

现象通常是 `Cannot connect to the Docker daemon`。先回到 Windows，确认 Docker Desktop 已启动并且 WSL Integration 已启用，然后在 WSL 中重新检查：

```bash
docker info
```

### `docker compose` 找不到

确认 Docker Desktop 版本支持 Compose，并重新打开 WSL Shell。不要把 `docker-compose` 和新版 `docker compose` 当成完全相同的命令，优先使用官方当前文档中的 `docker compose`。

### WSL 启动时提示 `ext4.vhdx` 拒绝访问

2026 年 8 月 29 日，执行 `wsl -d Ubuntu` 时连续遇到 `E_ACCESSDENIED` 错误，提示无法将 `E:\WSL\Ubuntu\ext4.vhdx` 附加到 WSL2。这个文件是 Ubuntu WSL2 使用的虚拟磁盘；稍后再次执行相同命令时又恢复正常，并成功进入 WSL Shell。这说明问题更可能是虚拟磁盘被其他进程临时占用，或 WSL、Hyper-V 相关服务在系统启动、睡眠唤醒过程中暂时处于异常状态，不一定代表 Ubuntu 数据损坏。

遇到类似问题时，可以先在 Windows PowerShell 中执行 `wsl --shutdown`，再重新运行 `wsl -d Ubuntu`；同时检查 `E:` 盘是否正常、`E:\WSL\Ubuntu\ext4.vhdx` 是否存在，以及 Docker、杀毒软件或备份软件是否正在占用该文件。如果需要启动 Docker Desktop，也要先确认 `Docker Desktop.exe` 的实际安装路径；本次 `Start-Process "$Env:ProgramFiles\Docker\Docker\Docker Desktop.exe"` 报错，是因为指定路径不存在，与 WSL 后续恢复正常属于两个独立问题。
### 6185 端口被占用

```bash
# 查看 6185 是否被 Windows 程序占用
netstat -ano | findstr :6185

# 查看容器状态和端口映射
 docker ps --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
```

如果端口确实被其他程序占用，可以把 compose.yml 左侧端口改成例如 `16185:6185`，然后访问 `http://localhost:16185`。右侧容器端口仍然保持 `6185`。

### WebUI 页面打不开

按顺序排查：

1. `docker compose ps` 是否显示 `astrbot` 正在运行。
2. `docker compose logs --tail=200 astrbot` 是否有启动异常。
3. 访问地址是否写成了 `http://localhost:6185`，而不是错误的容器内部地址。
4. 6185 是否被其他程序占用。
5. 如果是远程服务器，是否使用了服务器 IP，并放行了端口。

### 容器反复重启

```bash
docker compose ps
docker compose logs --tail=300 astrbot
```

重点看镜像启动错误、配置格式错误、端口冲突和平台连接错误。先保留日志，不要反复 `down` 后删除 `data`。

### NapCat 和 AstrBot 都在 Docker 中

两个容器之间通信时，不能把 `127.0.0.1` 当成对方。应该使用 Docker Compose 服务名，例如：

```text
ws://astrbot:6199/ws
```

具体地址以你的消息平台和 Compose 网络配置为准。

## 9. 这次 Blog 网页预览为什么打不开

这里其实有两个不同的网页，最容易混淆：

- `http://localhost:6185/` 是 **AstrBot WebUI**，由 Docker 中的 AstrBot 提供。
- `http://localhost:3000/my-blog` 是 **这个 Blog 的本地开发预览**，由 Next.js 开发服务器提供。

当前仓库的 `main` 分支只有一个 README，所以从 `main` 启动 Next.js 自然没有完整 Blog 页面。完整的 Blog 页面和文章结构在 `feat/ui-enhancement` 分支，文章要放在 `content/posts/`，再通过 frontmatter 的 `category: "学习"` 归类。

预览 Blog 时要在完整 Blog 分支的项目目录执行：

```powershell
npm install
npm run dev
```

然后访问：

```text
http://localhost:3000/my-blog
```

之所以不是 `http://localhost:3000/`，是因为项目配置了 `basePath: "/my-blog"`，用于适配 GitHub Pages 的项目站点路径。

另外，`localhost` 只对当前机器生效。Windows 浏览器、WSL、Docker 容器和 Codex 内置浏览器虽然经常能互通，但它们不是同一个网络环境；如果预览工具打不开，先确认开发服务器是否真的在对应环境中运行，再确认端口、路径和防火墙设置。

## 10. 官方资料

- [AstrBot 官方 GitHub](https://github.com/AstrBotDevs/AstrBot)
- [Docker 部署文档](https://github.com/AstrBotDevs/AstrBot/blob/master/docs/zh/deploy/astrbot/docker.md)
- [CLI 指令文档](https://github.com/AstrBotDevs/AstrBot/blob/master/docs/zh/deploy/astrbot/cli.md)
- [聊天指令文档](https://github.com/AstrBotDevs/AstrBot/blob/master/docs/zh/use/command.md)
- [WebUI 使用文档](https://github.com/AstrBotDevs/AstrBot/blob/master/docs/zh/use/webui.md)
- [AstrBot 常见问题](https://github.com/AstrBotDevs/AstrBot/blob/master/docs/zh/faq.md)

这篇备忘录的核心顺序只有一条：**打开 Docker Desktop → 进入 WSL → `cd ~/AstrBot` → `docker compose up -d` → 看日志 → 打开 `6185` → 在聊天窗口输入 `/help`。**
