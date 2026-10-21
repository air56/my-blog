---
title: "ReBot开发环境搭建"
date: 2026-10-21
category: "学习"
tags: ["ReBot", "机械臂", "Python", "Ubuntu", "开发环境"]
description: "整理 ReBot B601-RS 的软件清单、下载入口和安装顺序，从 Windows 基础调试到 Ubuntu 进阶开发。"
---

准备开发 ReBot B601-RS，先整理软件清单和安装顺序。本文依据 [Seeed Studio 快速入门 Wiki](https://wiki.seeedstudio.com/cn/rebot_b601_rs_getting_started/)，记录环境准备方法，尚不代表已完成实机测试。

## 先选操作系统

Ubuntu 和 Windows 一样，是操作系统；Miniforge、VS Code 和 MotorBridge 是安装在系统中的软件。

MotorBridge 支持 Windows、Ubuntu 和 macOS，可以先在现有 Windows 上完成连接、校准和基础控制。Wiki 推荐 Ubuntu 24.04 LTS 物理机运行机械臂 Demo，并提示虚拟机存在性能和配置问题。

“物理机”指电脑直接运行 Ubuntu，不一定需要买另一台电脑。双系统启动进入 Ubuntu 也属于这种方式，但安装涉及分区、加密和引导配置，应先备份数据、确认目标磁盘。独立 SSD 能减少调整 Windows 分区的操作，仍需核对安装位置。参见 [Ubuntu 安装说明](https://ubuntu.com/desktop/docs/en/24.04/tutorial/install-ubuntu-desktop/)和 [BitLocker 说明](https://ubuntu.com/desktop/docs/en/latest/reference/bitlocker-during-ubuntu-installation/)。

## Windows 软件清单与下载

以下按常见 Windows x64 电脑整理。

| 软件 | 用途 | 下载方式 |
| --- | --- | --- |
| Miniforge | 创建独立 Python 环境 | [官方下载页](https://github.com/conda-forge/miniforge/releases)，选择 `Miniforge3-Windows-x86_64.exe` |
| PCAN-USB 驱动 | 识别套件 USB 转 CAN 模块 | 在 [Wiki](https://wiki.seeedstudio.com/cn/rebot_b601_rs_getting_started/)的“配置 PCAN-USB → Windows”下载 `PEAK-System_Driver-Setup.zip` |
| MotorBridge | 电机通信、Python SDK 和本地网关 | 激活环境后通过 pip 安装 |
| Git | 下载项目源码 | [Git for Windows](https://git-scm.com/install/windows)，选择 x64 安装包 |
| VS Code | 编写和调试代码，可按习惯替换 | [官方下载页](https://code.visualstudio.com/download)，安装后添加 Microsoft 的 Python 扩展 |
| MotorBridge Studio | 扫描电机、校零和调参 | [直接打开网页](https://motorbridge.github.io/motorbridge-studio/)，无需单独安装 |

## 创建 Python 环境

安装 Miniforge 后，打开 Miniforge Prompt，依次执行：

```powershell
conda --version
conda create -y -n rebot python=3.12
conda activate rebot
python -m pip install motorbridge
```

Python 已包含在 `rebot` 环境中，无需另装一个 Python。以后每次打开终端，先执行 `conda activate rebot`。

检查安装：

```powershell
python --version
python -c "import motorbridge; print('motorbridge OK')"
motorbridge-cli --help
```

这些检查只能证明软件可用，不能证明机械臂通信正常。

如果需要在 PowerShell 中使用 Conda，先在 Miniforge Prompt 执行，再重新打开 PowerShell：

```powershell
conda init powershell
```

在 VS Code 中打开项目，通过 `Python: Select Interpreter` 选择 `rebot` 环境，避免将依赖安装到一个环境、运行时却使用另一个环境。设置方法见 [VS Code Python 教程](https://code.visualstudio.com/docs/python/python-tutorial)。

## 连接、校准与参数初始化

安装 PCAN-USB 驱动后，连接模块，在设备管理器确认识别为 PCAN-USB。然后启动网关：

```powershell
conda activate rebot
motorbridge-gateway --bind 127.0.0.1:9002
```

保持终端运行，打开 [MotorBridge Studio](https://motorbridge.github.io/motorbridge-studio/)，按网页“帮助”连接本地网关。

1. 选择型号 `rebot-arm-robstride`。
2. 扫描并确认 1～7 号电机在线。
3. 按 Wiki 的参考姿态完成零点校准。
4. 套用默认参数模板，确认写入后的回读校验通过。

成品套件先扫描已有电机，不要重新写入电机 ID；未组装套件按 Wiki 完成 ID 配置。只有正常安装驱动后仍无法识别、确认存在固件问题时，才进入 DfuSeDemo 和固件修复流程。

首次运动前先完成固定、校零和参数检查，再用低速、小角度测试。完整接线、校准与操作要求以 [官方快速入门](https://wiki.seeedstudio.com/cn/rebot_b601_rs_getting_started/)为准。

## Ubuntu 运动学开发环境

如果需要末端坐标控制、逆运动学、轨迹规划和重力补偿，可按 [Pinocchio 与 MeshCat 教程](https://wiki.seeedstudio.com/cn/rebot_arm_b601_rs_pinocchio_meshcat/)准备 Ubuntu 24.04 LTS。系统镜像从 [Ubuntu 24.04 官方发布页](https://releases.ubuntu.com/24.04/)下载，普通 Intel/AMD 64 位电脑选择 Desktop amd64 镜像。

以下命令在 Ubuntu 终端执行：

```bash
sudo apt update
sudo apt install -y git curl can-utils
curl -LsSf https://astral.sh/uv/install.sh | sh
```

重新打开终端，检查 uv 并下载项目：

```bash
uv --version
git clone https://github.com/Seeed-Projects/reBotArm_control_py.git
cd reBotArm_control_py
uv sync
```

`uv sync` 根据项目配置和锁文件创建虚拟环境、安装依赖。将项目中的 `config/rebotarm.yaml` 设置为 RS 硬件：

```yaml
hardware_yaml: "rebotarm_rs.yaml"
```

不要沿用 DM 电机配置。实机运行还需完成驱动识别和 CAN 接口配置；教程使用 1 Mbps，接口名以实际识别结果为准。

## 按开发目标追加软件

| 目标 | 追加环境 | 安装说明 |
| --- | --- | --- |
| Python 控制关节与夹爪 | `rebot_control`、`motorbridge`、`pyyaml`，可选 `pynput` | [电机 SDK 教程](https://wiki.seeedstudio.com/cn/rebot_arm_b601_rs_mit_control/) |
| 运动学与轨迹开发 | uv、`reBotArm_control_py`，由项目管理 Pinocchio、MeshCat 等依赖 | [运动学教程](https://wiki.seeedstudio.com/cn/rebot_arm_b601_rs_pinocchio_meshcat/) |
| ROS 2、RViz、MoveIt 2 | Ubuntu 24.04 + ROS 2 Jazzy、colcon 和对应项目依赖 | [ROS 2 教程](https://wiki.seeedstudio.com/cn/rebot_arm_b601_rs_ros2_integration/) |
| 遥操作、数据采集和模型训练 | LeRobot、B601 适配包、FFmpeg、PyTorch | [LeRobot 教程](https://wiki.seeedstudio.com/cn/rebot_arm_b601_rs_lerobot/) |
| 物理仿真 | NVIDIA Isaac Sim、reBot-Isaacsim 项目 | [Isaac Sim 教程](https://wiki.seeedstudio.com/cn/rebot_arm_b601_rs_isaacsim/) |

基础调试使用 Conda 的 `rebot` 环境；运动学项目按教程使用 uv；ROS 2 使用系统 Python；LeRobot 单独建立环境。各条路线分别管理依赖，避免一次把所有软件装进同一个环境。
