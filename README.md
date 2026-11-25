# 四大名著知识图谱 · Four Great Novels Viz

以原文章回为单位增量构建的开放式人物、关系、事件数据仓库与交互式静态网站。

## 数据进度（初始迁移 2026-11-25）

| 书籍 | ID | 人物 | 关系 | 事件关联记录 | 章回 |
|---|---|---:|---:|---:|---:|
| 红楼梦 | hongloumeng | 354 | 383 | 481 | 120 |
| 三国演义 | sanguoyanyi | 0 | 0 | 0 | 待录入 |
| 水浒传 | shuihuzhuan | 494 | 513 | 505 | 楔子 + 120 回（前10回精标草稿） |
| 西游记 | xiyouji | 0 | 0 | 0 | 待录入 |

红楼梦由既有 V2 数据迁移；水浒传由对话中的 V2 逐回数据迁移（V2 的 360 个独立事件 ID；现前 10 回追加 145 条细分事件，共 505 条事件记录，另有 1,689 条待核线索）。数据按书籍隔离，后续新增三国演义、西游记不会破坏已有格式。全部数据为待校勘草稿，人物候选不保证穷尽。原文定位并不等于语义审核。原始附件未提交，版本指纹见 data/catalog.json。

## 逐回复核进度（V3 增补）

当前《红楼梦》已按原文逐段增补第 1–3 回：人物候选 361、关系 435、事件记录 532；原有 120 回目录全部保留。以下三回的 117 条事件均已附段落出处（机器辅助定位，未人工校勘）。其余 117 回仍为 V2 初稿。

| 章回 | 原事件数 | 增补后 | 状态 |
|---|---:|---:|---|
| [001](data/hongloumeng/chapters/001/events.jsonl) | 16 | 26 | 段落定位 |
| [002](data/hongloumeng/chapters/002/events.jsonl) | 38 | 53 | 段落定位 |
| [003](data/hongloumeng/chapters/003/events.jsonl) | 12 | 38 | 段落定位 |

下一回：004 薄命女偏逢薄命郎　葫芦僧乱判葫芦案。后续沿用稳定 ID 与章回独立提交；新增 sequence（章回内叙事顺序）及 event_type（plot/retelling/background/dialogue/dream/myth/prophecy/frame/inference 等）。段落定位不代表事实已经人工校勘；原有事件 ID 保留，重复或推断性条目需进一步复核。

## 目录

```
data/
  catalog.json
  <book_id>/
    people.jsonl
    relations.jsonl
    chapters/
      index.json
      000/                 # 楔子（如果该版本有）
        chapter.json
        events.jsonl
        candidates.jsonl     # 可选；尚未认定为真实关系
      001/
        chapter.json
        events.jsonl
schemas/              # JSON Schema 2020-12
scripts/              # 数据校验及导出
assets/               # 静态可视化
index.html            # GitHub Pages 入口
CONTRIBUTING.md        # 章回增量录入指南
```

## 本地预览及校验

```bash
python -m pip install -r requirements.txt
python scripts/validate.py
python scripts/validate_candidates.py
python scripts/export.py shuihuzhuan --output graph.json
python -m http.server 8000
```

打开 http://localhost:8000/。生成的 graph.json 是衍生文件，不是维护源。

## GitHub Pages

进入 Settings → Pages → Build and deployment → **Source: GitHub Actions**。
主分支的 `.github/workflows/pages.yml` 将先校验全书数据再上传静态站点；若仓库尚未开启 Pages，需要在设置中手动启用此发布源。
预期网址：https://1998x-stack.github.io/four-great-novels-viz/
页面直接读取 data 目录，使用相对路径，无需 npm、数据库服务或 CDN。新增章回后自动反映已提交的数据；请同步维护章节索引。

## 数据设计

book_id 与本地 ID 组成全局唯一键，例如 hongloumeng:P0001。关系端点引用本书人物，事件引用多个关系及参与者，章回文件按三位最小宽度命名（000 为楔子，001 为第一回）。事件 ID 不随章回移动而改变。原文证据保存附件版本、摘录及行号。

详细维护规则见 [CONTRIBUTING.md](CONTRIBUTING.md)。数据 Schema 版本 3.0.0；内容版本以 Git 提交记录为准。

## 《水浒传》数据校勘说明

- `data/shuihuzhuan/people.jsonl`：494 位人物/人物候选；前 108 位梁山好汉为石碣名录，其他名称待逐个校勘。
- `relations.jsonl`：513 条有向或对称关系，保留 V2 `R` 编号；语义尚未逐条人工核验。
- `chapters/000`（楔子）至 `chapters/120`：每回单独保存事件；`events.jsonl` 共 505 条，保留 `E` 编号与 `relation_ids`。
- `candidates.jsonl`：1,689 条待核原文线索，**不会作为已确认关系展示**；可逐条转化为新增事件。
- `source.evidence_level=keyword_match` 表示自动匹配的原文定位，不代表人工事实确认。`line_start/line_end` 仅适用于 `shuihuzhuan:attachment-v1` 底本。
- 在线访问可通过 `?book=shuihuzhuan` 切换作品，后续逐回完善只需编辑对应章节文件与必要的人物、关系文件。

## 《水浒传》第一批逐回增补（第1–10回）

保留原有 43 条事件，新增 145 条具备原文段落定位的独立事件；**合计前十回188条**。每条新增事件有 `title`、`event_type`、`location`、`causes`、`outcomes`、`story_arc` 和 `source`。这些是模型辅助整理、原文定位，不是人工逐条审核。

| 章回 | 旧事件 | 新增 | 合计 |
|---|---:|---:|---:|
| 001 | 11 | 17 | 28 |
| 002 | 6 | 14 | 20 |
| 003 | 3 | 13 | 16 |
| 004 | 3 | 12 | 15 |
| 005 | 4 | 13 | 17 |
| 006 | 4 | 17 | 21 |
| 007 | 3 | 11 | 14 |
| 008 | 3 | 13 | 16 |
| 009 | 4 | 19 | 23 |
| 010 | 2 | 16 | 18 |

进度明细见 [`data/shuihuzhuan/reports/chapters-001-010.json`](data/shuihuzhuan/reports/chapters-001-010.json)。第11–120回仍保留现有初稿，待下一批处理。
