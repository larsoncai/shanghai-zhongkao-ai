# 上海中考AI志愿系统

一个支持 Python 3.8+、可本地一键运行的 FastAPI + React 全栈演示项目。输入考生所在区、示例初中和中考分数后，系统会展示本区高中及可跨区招生学校，用可解释的 Sigmoid 模型估算2026录取概率，生成冲、稳、保建议，并模拟名额分配到校、名额分配到区和统一招生三个批次的录取流程。

> 重要：项目内的2025分数线、名额、招生范围和趋势值均为演示数据，不是官方数据，不构成填报或录取承诺。

## 在线使用

GitHub Pages静态版：<https://larsoncai.github.io/shanghai-zhongkao-ai/>

静态版无需安装软件，推荐、概率和录取模拟均在访问者浏览器内完成，不上传或保存考生数据。

## 功能

- 选择上海16个区和区内示例初中
- 输入0—750分中考成绩
- 展示本区及符合演示跨区范围的高中
- 使用 Sigmoid 模型计算各批次录取概率
- 生成高风险、冲、稳、保标签
- 创建并调整三个批次的志愿顺序
- 按“到校 → 到区 → 统一招生”模拟逐志愿检索
- 展示完整检索时间线和未录取原因
- 提供 FastAPI Swagger 接口文档

## 一键启动

### macOS / Linux

```bash
chmod +x run.sh
./run.sh
```

### Windows

双击 `run.bat`，或在命令提示符中运行：

```bat
run.bat
```

脚本会自动创建 `.venv` 虚拟环境、安装依赖并启动服务。启动后打开：

- 应用首页：<http://127.0.0.1:8000>
- API文档：<http://127.0.0.1:8000/docs>

首次启动需要联网安装 Python 依赖，前端 React 和 Babel 也通过 CDN 加载。

## 手动启动

```bash
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

## 生成GitHub Pages静态版

```bash
.venv/bin/python scripts/build_pages.py
python3 -m http.server 4174 --directory docs
```

打开 <http://127.0.0.1:4174> 即可预览。`docs/`是GitHub Pages发布目录；静态版使用与本地版相同的演示数据、Sigmoid公式和录取规则，但不提供FastAPI接口文档。

## 运行测试

```bash
.venv/bin/python -m pytest -q
```

Windows：

```bat
.venv\Scripts\python.exe -m pytest -q
```

## 模型说明

2026预测线由2025演示线和学校趋势修正值相加得到：

```text
2026预测线 = 2025演示录取线 + 趋势修正值
P = 1 / (1 + exp(-(考生分数 - 2026预测线) / 6))
```

批次资格会先于概率判断。不具备到校名额、到区范围或统一招生范围时，系统不会生成伪概率。

| 概率 | 标签 |
| --- | --- |
| 小于25% | 高风险 |
| 25%—不足55% | 冲 |
| 55%—不足80% | 稳 |
| 80%及以上 | 保 |

## 录取模拟边界

录取模拟按名额分配到校、名额分配到区、统一招生依次检索。某个志愿同时满足资格、预测线和演示名额时即模拟录取，并停止后续检索。

这是单考生规则演示，不模拟全市考生排位、动态名额竞争、同分比较、综合素质评价或当年政策变化。

## 修改演示数据

数据集中在 `backend/data/demo_data.py`：

- `DISTRICTS`：行政区
- `SCHOOLS`：高中、2025演示线、趋势、跨区范围和名额
- `MIDDLE_SCHOOLS`：示例初中和名额到校映射

概率参数和冲稳保阈值位于 `backend/services/recommendation.py`，录取顺序与检索逻辑位于 `backend/services/admission.py`。

## 项目结构

```text
shanghai-zhongkao-ai/
├── backend/
│   ├── data/demo_data.py
│   ├── services/admission.py
│   ├── services/recommendation.py
│   ├── main.py
│   └── schemas.py
├── frontend/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── pages/static-api.js
├── scripts/build_pages.py
├── docs/                      # GitHub Pages静态站
├── tests/
├── docs/superpowers/specs/
├── requirements.txt
├── run.sh
├── run.bat
└── README.md
```
