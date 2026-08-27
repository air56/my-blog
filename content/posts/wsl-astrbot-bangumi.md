---
title: "从双系统到 AstrBot：WSL、Docker 与 Bangumi 番剧机器人的完整排坑记录"
date: 2026-08-28
category: "技术"
tags: ["WSL", "Ubuntu", "Docker", "AstrBot", "Bangumi"]
description: "记录从 Windows/Ubuntu 双系统规划，到 WSL、Docker、AstrBot 微信接入和 Bangumi 番剧卡片调试的完整过程。"
---

## 背景

这次折腾的目标并不是单独安装一个 Ubuntu，而是搭建一套可以长期运行的个人 AI 机器人环境：

- Windows 保留日常使用；
- Ubuntu 提供 Linux 开发和服务环境；
- AstrBot 接入微信；
- Docker 负责部署和运行；
- Bangumi 插件负责查询番剧、追番和生成信息卡片。

实际过程比预想复杂。最开始讨论的是双系统，后来转向 WSL；WSL 安装完成后又遇到了 GUI、存储位置、Docker 网络、微信好友消息和番剧图片渲染等问题。

这篇文章把整个过程串起来，记录最终得到的方案和踩过的坑。

## 一、双系统还是 WSL：先确定使用目标

一开始的想法是在 Windows 电脑上安装 Ubuntu 双系统。

如果目标是完整的 Ubuntu 桌面体验，双系统仍然是最直接的方案。基本流程是：

1. 备份 Windows 中的重要文件；
2. 保存 BitLocker 恢复密钥；
3. 关闭 BitLocker；
4. 关闭 Windows 快速启动；
5. 使用磁盘管理压缩 Windows 分区；
6. 留出未分配空间；
7. 制作 Ubuntu 启动 U 盘；
8. 以 UEFI 模式从 U 盘启动；
9. 选择与 Windows 共存安装。

安装时最危险的选项是：

```text
Erase disk and install Ubuntu
```

这个选项可能清空整个目标磁盘。第一次安装双系统时，不建议直接使用手动分区，也不要把准备给 Ubuntu 的空间提前格式化成 NTFS。

### WSL 更适合服务和开发

后来实际选择了 WSL。WSL 的优点是：

- 不需要修改磁盘分区；
- 不需要重启切换系统；
- 可以直接访问 Windows 文件；
- 适合运行 Linux 命令、Docker 和后台服务；
- 与 Windows 开发工具结合方便。

但 WSL 的 GUI 有一个容易误解的地方。

WSLg 主要提供的是“单独运行 Linux 图形应用”的能力，并不是完整的 Ubuntu 桌面。它更接近：

```text
Windows 桌面
└── WSLg
    └── Linux GUI 应用
```

而不是：

```text
Ubuntu
└── GNOME/KDE/Xfce 完整桌面
    ├── 面板
    ├── 开始菜单
    ├── 文件管理器
    └── 系统设置
```

因此，使用 WSLg 启动 `gnome-text-editor` 时，界面看起来可能不符合传统 Linux 桌面的预期。这不一定是安装错误，而是 WSLg 的设计目标本来就不是提供完整桌面会话。

如果只是开发、运行服务或使用少量 Linux GUI 软件，WSL 很合适。如果想要完整 Ubuntu 桌面，应优先考虑双系统或虚拟机。

## 二、把 WSL Ubuntu 从 C 盘迁移到其他磁盘

WSL 发行版默认会占用系统盘空间。直接去 Windows 的应用目录中剪切 Ubuntu 文件并不安全，推荐使用导出和重新导入的方式。

先查看发行版名称：

```powershell
wsl -l -v
```

关闭所有 WSL 实例：

```powershell
wsl --shutdown
```

创建目标目录：

```powershell
New-Item -ItemType Directory -Force "D:\WSL\Ubuntu"
```

把 Ubuntu 导出到 D 盘：

```powershell
wsl --export Ubuntu "D:\WSL\Ubuntu\ext4.vhdx" --format vhd
```

确认文件已经生成：

```powershell
Get-Item "D:\WSL\Ubuntu\ext4.vhdx"
```

确认备份无误后，注销旧发行版：

```powershell
wsl --unregister Ubuntu
```

最后从新位置导入：

```powershell
wsl --import-in-place Ubuntu "D:\WSL\Ubuntu\ext4.vhdx"
```

检查结果：

```powershell
wsl -l -v
wsl -d Ubuntu
```

最重要的注意事项是：

> 只有确认导出的 `ext4.vhdx` 存在并且大小正常后，才能执行 `wsl --unregister`。

`--unregister` 会删除当前注册的发行版和原数据。备份文件不存在时，不要继续执行。

## 三、Docker 网络问题：能访问 GitHub，不代表能访问 Docker Hub

在 Ubuntu 中执行：

```bash
sudo docker run hello-world
```

如果看到：

```text
Unable to find image 'hello-world:latest' locally
```

这句话本身不是错误，意思是本地没有这个镜像，Docker 准备从镜像仓库下载。

真正需要关注的是后续有没有出现：

```text
Hello from Docker!
```

如果拉取过程中出现：

```text
Connection timed out
TLS handshake timeout
Connection reset by peer
SSL connection failed
```

这通常说明 Docker Hub 的连接链路有问题，不一定单纯是“丢包”。可能原因包括：

- Docker Hub 与 GitHub 使用了不同的网络链路；
- WSL 没有继承 Windows 代理；
- Docker 守护进程没有配置代理；
- DNS 解析异常；
- 防火墙或网络运营商重置连接；
- Docker 官方软件源连接失败。

可以先测试 Docker Hub：

```bash
curl -I --connect-timeout 15 https://registry-1.docker.io/v2/
```

如果返回 `401 Unauthorized`，反而说明 Registry 已经可以访问。对于 Registry 接口来说，未认证返回 401 是正常现象。

如果只是 Docker 官方 APT 源无法访问，可以暂时使用 Ubuntu 软件源中的 Docker 包：

```bash
sudo apt update
sudo apt install -y docker.io docker-compose-v2
```

网络排查时要记住：

> Windows 能打开网页、WSL 能访问 GitHub，并不代表 Docker 守护进程和容器一定能访问同一个目标地址。

## 四、AstrBot 微信接入：为什么自己能触发，朋友却没有反应

AstrBot 接入个人微信后，消息链路大致是：

```text
微信好友发送消息
        ↓
微信适配器接收事件
        ↓
AstrBot 判断是否允许处理
        ↓
调用聊天模型
        ↓
回复微信消息
```

如果自己和机器人对话时有日志，但朋友发送消息时完全没有变化，优先检查消息是否进入了 AstrBot，而不是先检查大模型。

常见原因包括：

- 扫码绑定的不是预期微信账号；
- 微信适配器没有接收到好友私聊事件；
- 私聊消息需要唤醒前缀；
- ID 白名单拦截了好友；
- 当前配置只允许机器人所有者使用；
- 好友消息事件和自己发送的消息事件类型不同；
- 微信适配器本身存在平台限制。

排查顺序应该是：

1. 确认扫码绑定的微信账号；
2. 确认好友发送的是私聊消息；
3. 查看 AstrBot 是否收到事件日志；
4. 检查私聊唤醒配置；
5. 检查 ID 白名单；
6. 再检查模型调用和回复发送。

如果连“收到消息”的日志都没有，说明问题发生在适配器或平台事件层，不是模型回答质量问题。

## 五、Docker 中查看 AstrBot 状态和日志

如果容器名是 `astrbot`，可以使用：

```bash
docker ps -a
```

启动容器：

```bash
docker start astrbot
```

实时查看最近日志：

```bash
docker logs -f --tail=200 astrbot
```

查看最近 300 行：

```bash
docker logs --tail=300 astrbot
```

进入容器：

```bash
docker exec -it astrbot bash
```

如果容器中没有 Bash：

```bash
docker exec -it astrbot sh
```

进入容器后，也可以查看 AstrBot 文件日志：

```bash
tail -f /AstrBot/data/logs/astrbot.log
```

如果不知道容器的真实名称：

```bash
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

实时查看日志时按 `Ctrl+C` 只会退出日志查看，不会停止容器。

AstrBot 管理面板通常可以通过以下地址访问：

```text
http://localhost:6185
```

如果无法打开，先查看启动日志中实际监听的地址和端口。

## 六、AstrBot 开机自启不是只有一个开关

如果 AstrBot 运行在 WSL 的 Docker 中，开机自启实际上包含两层：

```text
Windows 启动
    ↓
WSL 发行版启动
    ↓
Docker 服务启动
    ↓
AstrBot 容器启动
```

只给容器设置重启策略还不够，因为 WSL 发行版本身可能在没有进程运行时退出。

容器层可以设置：

```bash
docker update --restart unless-stopped astrbot
```

这表示 Docker 服务恢复后，容器会自动尝试启动。

但如果希望电脑开机后 AstrBot 真正运行，还需要让 Windows 启动 WSL，或者使用任务计划程序执行类似命令：

```powershell
wsl -d Ubuntu -- bash -lc "docker start astrbot"
```

如果 Docker 服务还没有启动，就需要先启动 Docker 服务。实际配置时还要考虑：

- `sudo` 是否需要输入密码；
- WSL 是否启用了 systemd；
- Docker 服务是否已经准备好；
- 网络代理是否已经监听；
- AstrBot 是否需要等待代理和网络恢复。

比较可靠的思路是：

1. Docker 容器设置 `unless-stopped`；
2. WSL 启动后确保 Docker 服务运行；
3. AstrBot 连接失败时具有重试能力；
4. Windows 侧负责唤醒 WSL。

## 七、Bangumi 插件的功能结构

本次使用的插件是 `astrbot_plugin_bangumi`。当前项目文件显示，它是基于 AstrBot 的 Bangumi 查询和追番插件，主要功能包括：

- 搜索番剧、电影和漫画；
- 查看 Bangumi 条目信息；
- 查看每日放送表；
- 订阅番剧更新；
- 自动推送新集；
- 生成番剧信息卡片；
- 生成单集更新卡片；
- 将较长的文本响应渲染为图片。

插件的主要命令包括：

```text
/bgm <关键词>
/bgm番剧 <关键词>
/bgm电影 <关键词>
/bgm漫画 <关键词>
/calendar
/today
/追番 <番剧名或ID>
/弃坑 <番剧名或ID>
/bgm模板 [1|2|3]
/放送时间
```

分类命令必须连续书写，例如：

```text
/bgm番剧 进击的巨人
```

不要写成：

```text
/bgm 番剧 进击的巨人
```

因为插件注册的是 `bgm番剧` 这个完整命令。

## 八、Bangumi API 和图片渲染配置

插件配置中比较重要的字段如下：

```json
{
  "access_token": "Bangumi Token",
  "max_fuzzy_results": 5,
  "proxy_http": "",
  "port": "",
  "max_retries": 3,
  "render_mode": "pillow",
  "episode_card_template": "pastel_lightbox",
  "auto_translate_episode_summary": false,
  "auto_translate_subject_summary": false
}
```

### Token 不要重复添加 Bearer

从插件源码看，插件会自动构造请求头：

```python
self.headers["Authorization"] = f"Bearer {normalized_token}"
```

因此配置中应该填写原始 Token：

```text
xxxxxxxxxxxxxxxx
```

不要填写：

```text
Bearer xxxxxxxxxxxxxxxx
```

否则插件可能构造出重复的认证前缀。

### 三种渲染模式

插件支持三种图片渲染方式：

| 模式 | 特点 |
|---|---|
| `pillow` | 本地 Pillow 渲染，依赖少，稳定性最好 |
| `playwright` | 使用本地浏览器渲染，适合复杂 HTML 样式 |
| `rpc` | 使用远程 RPC 渲染服务，失败时可回退到 Pillow |

如果目标是先稳定使用，推荐：

```json
{
  "render_mode": "pillow"
}
```

插件还支持三种卡片风格：

```text
pastel_lightbox
editorial_digest
cinematic_poster
```

也可以直接在机器人中切换：

```text
/bgm模板 1
/bgm模板 2
/bgm模板 3
```

模板只改变视觉风格，不会修复 API 网络问题。

## 九、为什么返回的是错误图片，而不是番剧预览图

这次最关键的排查结果是：返回的图片并不是正常的番剧卡片，而是错误文本被渲染成了图片。

插件的处理链路大致如下：

```text
输入 /bgm番剧 恶女不才
        ↓
请求 Bangumi API
        ↓
API 连接超时
        ↓
生成错误文本
        ↓
错误文本超过 30 个字符
        ↓
ResponseRenderer 将文本渲染成图片
```

源码中的判断逻辑类似：

```python
def should_render_text_as_image(text: str) -> bool:
    return bool(text) and ("\n" in text or len(text) > 30)
```

因此，类似下面的错误信息：

```text
❌ 处理失败: Connection timeout ...
```

也会被转换成图片。

图片上的：

```text
CINEMATIC RESPONSE
Bangumi Response
Connection timeout
```

并不代表番剧卡片生成成功，而是说明请求失败后走了“长文本响应卡片”流程。

正确的排查顺序应该是：

1. 先确认 AstrBot 容器能访问 Bangumi API；
2. 再检查代理；
3. 确认 Token 格式；
4. 重载插件或重启 AstrBot；
5. 最后再调整图片模板。

如果 AstrBot 在 Docker 中，而代理运行在宿主机上，不要直接写：

```json
{
  "proxy_http": "127.0.0.1",
  "port": "7890"
}
```

因为容器里的 `127.0.0.1` 指向的是容器自身，不是 Windows 宿主机。

可以尝试：

```json
{
  "proxy_http": "host.docker.internal",
  "port": "7890"
}
```

或者填写宿主机的局域网 IP：

```json
{
  "proxy_http": "192.168.1.100",
  "port": "7890"
}
```

前提是代理软件允许局域网连接。

网络恢复后，再测试：

```text
/bgm番剧 恶女不才
```

正常结果应该包含：

- 番剧封面；
- 标题；
- 评分；
- 排名；
- 简介；
- 集数或播放进度。

## 十、最终排错清单

| 现象 | 优先检查 |
|---|---|
| WSL 占用 C 盘 | 使用导出、注销、重新导入 |
| 想要完整 Linux 桌面 | 使用双系统或虚拟机，不要把 WSLg 当完整桌面 |
| `hello-world` 找不到本地镜像 | 这是 Docker 正在尝试拉取镜像 |
| Docker Hub 超时 | 检查 Docker 守护进程、WSL 网络和代理 |
| AstrBot 自己能对话，朋友不触发 | 检查微信适配器、白名单和唤醒配置 |
| 容器不知道是否运行 | `docker ps -a` |
| 查看 AstrBot 日志 | `docker logs -f --tail=200 astrbot` |
| 修改配置后不生效 | 重载插件或重启 AstrBot |
| Bangumi 返回错误图片 | 先修复 API 连接，不要先改模板 |
| Docker 中代理失效 | 使用 `host.docker.internal`，不要直接使用容器内的 `127.0.0.1` |

## 总结

这次最大的经验是：不要把所有问题都归因于应用本身。

WSL 的 GUI 问题，本质上是“完整桌面”和“GUI 应用集成”的概念差异；Docker 的问题，本质上是不同网络层之间的代理和连接路径不同；Bangumi 的问题，则是 API 请求失败后，错误文本被插件继续渲染成了图片。

最终比较稳定的架构是：

```text
Windows
└── WSL Ubuntu
    └── Docker
        └── AstrBot
            ├── 微信适配器
            └── Bangumi 插件
                ├── Bangumi API
                └── Pillow 卡片渲染
```

排查这类系统时，最好始终按照下面的顺序：

```text
系统环境
→ 网络连接
→ Docker 容器
→ AstrBot 平台适配器
→ 插件 API
→ 图片渲染
```

先确认上一层正常，再继续检查下一层，通常比直接反复修改插件配置更快。
