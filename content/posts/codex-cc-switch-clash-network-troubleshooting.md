---
title: "Codex 网络异常排查：从前置超时到 CC Switch 502"
date: 2026-10-08
category: "学习"
tags: ["Codex", "CC Switch", "Clash", "DNS", "网络排查"]
description: "先用 doctor、端口和 TCP 状态定位故障，再区分 ChatGPT 前置网络超时与 CC Switch 上游 502，附 PowerShell 命令及 DNS/TUN 配置。"
---

## 先检查：按顺序执行这些命令

以下命令在 Windows PowerShell 中执行，命令与示例输出分开，代码块可直接复制。`15721` 是本次 CC Switch 的本地端口，其他环境按实际配置替换。

**先定位故障发生在哪一段，再决定是否开启 Clash。**

**1. 检查 Codex 前置网络。**

```powershell
codex doctor --json
```

重点查看 `network.provider_reachability`。本次失败时的关键信息如下，已摘录为文本：

```text
network.provider_reachability
status: fail
ChatGPT base URL: https://chatgpt.com/backend-api/
request timed out
```

如果同时出现上述超时和 CC 无模型请求，先查 DNS、ChatGPT 网络路径、Clash/TUN 状态及节点可用性。`doctor` 和输出字段以实际 Codex 版本为准。

**2. 检查 CC Switch 本地端口与监听进程。**

```powershell
Test-NetConnection 127.0.0.1 -Port 15721

Get-NetTCPConnection -LocalPort 15721 -State Listen |
    Format-Table LocalAddress, LocalPort, State, OwningProcess

Get-NetTCPConnection -LocalPort 15721 -State Listen |
    Select-Object -ExpandProperty OwningProcess -Unique |
    ForEach-Object { Get-Process -Id $_ } |
    Format-List Id, ProcessName, Path
```

端口连通时应看到 `TcpTestSucceeded : True`；再确认监听进程是 `cc-switch`。如果端口不通，先处理本地服务；端口连通只证明能建立 TCP 连接，不能证明上游可用。

也可以用下面的命令查看监听 PID：

```powershell
netstat -ano | findstr :15721
```

**3. 检查 Codex 与 CC 是否已经建立连接。**

```powershell
Get-NetTCPConnection -State Established -ErrorAction SilentlyContinue |
    Where-Object { $_.LocalPort -eq 15721 -or $_.RemotePort -eq 15721 } |
    Format-Table LocalAddress, LocalPort, RemoteAddress, RemotePort, State, OwningProcess
```

本次曾看到如下两行，PID 和临时端口只是当时的示例：

```text
LocalAddress LocalPort RemoteAddress RemotePort State       OwningProcess
127.0.0.1    55436     127.0.0.1     15721      Established 20616
127.0.0.1    15721     127.0.0.1     55436      Established 29228
```

两行是同一条 TCP 连接的两端。核对 `OwningProcess` 后，才能确认连接的另一端是否属于 Codex。查询单个 PID 时，把数字替换成实际结果：

```powershell
Get-Process -Id 20616 | Format-List Id, ProcessName, Path
```

**Established 证明 TCP 通道存在，不代表某条模型请求已经成功。**

**4. 前置网络失败时，再检查 DNS 与 443 端口。**

```powershell
Resolve-DnsName chatgpt.com -Type A
Test-NetConnection chatgpt.com -Port 443
```

需要比较解析结果时，可指定当前网络中实际使用的 DNS 地址。下面两个地址来自本次记录，不适用于所有电脑：

```powershell
Resolve-DnsName chatgpt.com -Server 172.19.241.1 -Type A
Resolve-DnsName chatgpt.com -Server 10.252.0.6 -Type A
```

记录每次测试的 Clash/TUN 状态。开启 TUN 后，测试可能已经经过代理路径，不能再把结果当作纯直连证据。

**5. 如果返回本地接口的 502，转查 CC 到上游。**

```text
502 Bad Gateway
http://127.0.0.1:15721/v1/responses
```

确认 `15721` 的监听者是 CC Switch 后，这个响应说明本地接口已经返回了 HTTP 错误，应重点查 CC 日志、供应商配置、认证、上游响应和出站网络。

对照测试时保持供应商和登录方式一致，比较 Clash/TUN 开关前后的结果，再切换一个已知可用的供应商。如果只影响一个供应商，优先查该供应商及其网络路径；如果多个供应商都失败，优先查 CC 的共同出站路径。

**本地接口返回 502 是排查方向，不是“TUN 一定有问题”的证明。**

| 观察结果 | 优先检查 |
|---|---|
| Codex 超时，doctor 显示 backend-api 超时，CC 无模型请求 | ChatGPT 前置网络、DNS、代理路径 |
| `127.0.0.1:15721` 无法建立 TCP 连接 | CC 本地服务、监听地址、端口配置 |
| 本地连接存在，`/v1/responses` 返回 502 | CC 日志、上游配置、认证及出站网络 |

## 当时恢复前置网络的 DNS/TUN 配置

下面是当时使用的 DNS Mixin，保留原配置并补全 YAML 缩进和列表格式。适用于支持这些字段的 mihomo 内核；保存后检查客户端最终生效配置。

```yaml
dns:
  enable: true
  ipv6: false
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16

  default-nameserver:
    - 223.5.5.5
    - 119.29.29.29

  proxy-server-nameserver:
    - https://doh.pub/dns-query
    - https://dns.alidns.com/dns-query

  nameserver:
    - https://1.1.1.1/dns-query#RULES
    - https://8.8.8.8/dns-query#RULES
```

`default-nameserver` 用于解析 DNS 服务器的域名；`proxy-server-nameserver` 用于代理节点域名；`nameserver` 用于默认域名查询。`#RULES` 表示 DoH 连接遵守路由规则，最终出口取决于规则。字段说明见 [mihomo DNS 文档](https://wiki.metacubex.one/config/dns/)。

**`#RULES` 不等于强制走代理。**

当时还在客户端开启了 TUN、gVisor、Auto Route、Auto Detect Interface，DNS Hijack 填入 `any:53`。对应配置片段如下；如果客户端通过界面管理这些字段，核对最终配置即可：

```yaml
tun:
  enable: true
  stack: gvisor
  auto-route: true
  auto-detect-interface: true
  dns-hijack:
    - any:53
```

`dns-hijack` 将匹配的 DNS 请求转入内置 DNS，`auto-route` 配置进入 TUN 的路由；具体支持情况见 [mihomo TUN 文档](https://wiki.metacubex.one/config/inbound/tun/)。这段记录使用的是当时的 gVisor 设置。

**这是当时有效的配置记录，是否继续启用要看当前测试结果。**

## 背景：为什么开关 Clash 会出现相反结果

2026 年 10 月 8 日，Codex 通过 CC Switch 使用模型，先出现 `request timed out` 和连续重连。开启 Clash Mixin + TUN 后恢复；过一段时间，关闭 Clash 也能正常使用，重新开启却返回 502。

把两次现象拆开看，故障点其实发生了变化。

## 第一阶段：请求还没进入 CC，就在前置网络超时

最初 CC 没有模型请求记录，但本地端口测试成功，监听 PID 对应 `cc-switch`。`doctor` 同时识别了 `cc-switch-official` Provider，并报告 ChatGPT backend-api 超时。

当时的认证信息摘录为：

```text
stored API key: false
stored ChatGPT tokens: true
stored auth mode: chatgpt
```

这说明本次使用 ChatGPT 账号登录，即使配置了 CC Provider，仍存在 ChatGPT 相关前置网络访问。根据这些输出，故障定位在模型请求进入 CC 之前；具体内部调用顺序不能仅凭 doctor 完整还原。

可以把本次观察简化为：

```text
Codex 的 ChatGPT 前置访问超时
  → 模型请求未进入 CC Switch
  → CC 无模型请求记录
```

DNS 查询前后曾返回 `128.242.240.85`、`108.160.169.46`、`66.220.148.145` 等可疑结果，同时 `chatgpt.com:443` 的 TCP 测试失败。这些现象支持“DNS 响应或网络路径异常”的怀疑，但没有抓包及可信解析对照，不能锁定 DNS 注入位置。

**IP 变化本身不足以证明 DNS 污染；本次也没有证据证明电脑中毒。**

开启 Mixin + TUN 后，`network.provider_reachability` 从 `fail` 变为 `ok`，Codex 开始回复，CC 出现模型请求。能够确认的是整组配置改变网络路径后恢复了访问，不能据此认定只有某一个 DNS 字段起作用。

开启 fake-ip 后，如果解析得到配置范围内的 `198.18.x.x`，要先考虑它是内核分配的虚拟地址。不要把这类结果与关闭 TUN 时的可疑公网解析混为一谈；配置范围见 [mihomo DNS 文档](https://wiki.metacubex.one/config/dns/)。

## 第二阶段：前置网络恢复，CC 却返回 502

后来关闭 Clash 和 Mixin，API 登录、ChatGPT 账号登录都能回复。这表明此前的前置网络故障在测试时已经不再阻断访问，无法据此判断 DNS 异常永久消失。

重新开启 Clash + Mixin + TUN 后，错误变成了本地 `/v1/responses` 的 `502 Bad Gateway`。此时监听者仍是 CC Switch，Codex 与 CC 之间也能看到已建立的 TCP 连接。

**这时排查重点应从 Codex 前置网络转向 CC 的上游处理和出站路径。**

TUN 可能接管 CC 自己访问供应商的流量，使原本可用的上游连接受到路由规则或代理节点影响。结合开关 TUN 的对照结果，这是本次较强的怀疑方向；具体是 DNS、TLS、节点、供应商拒绝还是其他错误，还需要 CC 与 Clash 日志确认。

CC 没有新增完整会话，也不意味着它没收到请求。请求可能在上游连接阶段就失败，而统计在后续阶段才写入；这是可能的解释，实际写入时机需查看 CC 实现或日志。

同样，发送消息前就看到 `Established` 也不奇怪。连接池、Keep-Alive 或预连接都可能保留 TCP 通道，不能把一条连接直接等同于一条新请求。

## 总结：按故障层级选择网络路径

| 阶段 | 已观察到的结果 | 处理与教训 |
|---|---|---|
| 最初超时 | backend-api 超时，本地 CC 端口正常，CC 无模型请求 | 先查前置网络；本次启用 Mixin + TUN 后恢复 |
| 后来 502 | 关闭 Clash 可用，开启后本地接口返回 502 | 转查 CC 上游和出站路径，结合日志验证原因 |

记录结束时，关闭 Clash/Mixin、保留 CC Switch 并使用账号登录可以正常回复，因此当时继续使用这条已验证可用的路径。

**先看 doctor，再看本地端口和连接，最后看 CC 上游日志。**

网络状态会变化，过去有效的开关组合不必永久保留。再次故障时重新定位，避免把“连续重连”或“没有会话统计”当成唯一依据。
