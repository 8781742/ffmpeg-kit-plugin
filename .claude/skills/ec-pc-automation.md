---
name: ec-pc-automation
description: PC端自动化 + Python爬虫开发指导
tags: [easyclick, pc-automation, crawler, python]
---

# PC 自动化 + Python 爬虫

结合 EasyClick 生态，扩展 PC 端自动化能力。

## PC 自动化

### Aibote 集成
- EC 项目已配置 Aibote 环境（`/d/Download/Aibote/Aibote/`）
- Aibote 是 Windows 端自动化框架，与 EC 协作
- 可实现 PC+手机联动自动化

### 常见场景
- PC端数据采集 + 手机端操作
- Excel批量处理 + 自动化执行
- 模拟器群控管理

## Python 爬虫

### 技术栈
- `requests` + `BeautifulSoup` — 网页数据采集
- `selenium` / `playwright` — 动态页面处理
- `mitmproxy` — APP接口抓包分析

### 与 EC 联动
```python
# 爬虫获取任务 → API下发到EC设备执行 → 结果回传
import requests

# 1. 爬取任务数据
tasks = crawl_tasks()

# 2. 下发到EC设备
for task in tasks:
    requests.post("http://device:8080/task", json=task)

# 3. 收集执行结果
results = requests.get("http://device:8080/results")
```
