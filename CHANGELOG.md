# 更新日志 (Changelog)

所有 notable changes 都会记录在此。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [9.9.5] - 2026-04-22

### 🐛 Bug 修复

- **桌面模式窗口锁死** — 进入桌面模式时窗口可被拖动和缩放的问题修复，添加 `setMovable(false)` + `setResizable(false)`
- **关于页面简化** — 移除「更新检查」和「网络状态」模块，替换为 GitHub 下载链接文本

---

## [9.9.3] - 2026-04-19

### ✨ 新功能

- **公网 IP 一键检测** — 多 API 自动切换（ip-api.com → ipinfo.io → ifconfig.me），国内直连优先
- **Gitee / GitHub 延迟实时显示** — 毫秒级延迟检测，三色状态指示（绿/黄/红）
- **更新检查体验优化** — 显示等待时间、切换服务器不中断操作、25秒超时自动断开

### 🐛 Bug 修复

- 修复无 VPN 时 IP 检测失败的问题

---

## [9.8.1] - 2026-04-18

### 🐛 Bug 修复

- **英文模式星期名修复** — 英文模式下日历头星期名和月份仍显示中文的问题
- **系统代理支持** — 主进程启用系统代理模式，支持 VPN/TUN 访问 GitHub
