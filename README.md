# 四大名著知识图谱 · Four Great Novels Viz

以原文章回为单位增量构建的开放式人物、关系、事件数据仓库与交互式静态网站。

## 数据进度（初始迁移 2026-11-25）

| 书籍 | ID | 人物 | 关系 | 事件关联记录 | 章回 |
|---|---|---:|---:|---:|---:|
| 红楼梦 | hongloumeng | 364 | 517 | 641 | 120 |
| 三国演义 | sanguoyanyi | 0 | 0 | 0 | 待录入 |
| 水浒传 | shuihuzhuan | 487 | 342 | 360 | 楔子 + 120 回 |
| 西游记 | xiyouji | 310 | 230 | 239 | 100 回 + 附录 |

红楼梦由既有 V2 数据迁移；水浒传由对话中的 V2 逐回数据迁移（360 个独立事件 ID，另有 1,689 条待核线索）。数据按书籍隔离，后续新增三国演义、西游记不会破坏已有格式。全部数据为待校勘草稿，人物候选不保证穷尽。原文定位并不等于语义审核。原始附件未提交，版本指纹见 data/catalog.json。

## 逐回复核进度（V3 前十回批次）

**《红楼梦》第 1–10 回已完成逐段增补。** 全书当前 364 位人物/人物候选、517 条关系、641 条事件记录；第 1–10 回合计 277 条，已附段落定位，**不是人工审校通过**。原有 120 回目录均保留，其余 **110 回仍主要是 V2 初稿**。

| 章回 | V2 原事件数 | V3 当前事件数 | 校勘状态 |
|---|---:|---:|---|
| [001](data/hongloumeng/chapters/001/events.jsonl) | 16 | 26 | 段落定位、待人工终审 |
| [002](data/hongloumeng/chapters/002/events.jsonl) | 38 | 53 | 段落定位、待人工终审 |
| [003](data/hongloumeng/chapters/003/events.jsonl) | 12 | 38 | 段落定位、待人工终审 |
| [004](data/hongloumeng/chapters/004/events.jsonl) | 14 | 24 | 段落定位、待人工终审 |
| [005](data/hongloumeng/chapters/005/events.jsonl) | 2 | 33 | 段落定位、待人工终审 |
| [006](data/hongloumeng/chapters/006/events.jsonl) | 15 | 27 | 段落定位、待人工终审 |
| [007](data/hongloumeng/chapters/007/events.jsonl) | 9 | 25 | 段落定位、待人工终审 |
| [008](data/hongloumeng/chapters/008/events.jsonl) | 3 | 19 | 段落定位、待人工终审 |
| [009](data/hongloumeng/chapters/009/events.jsonl) | 6 | 17 | 段落定位、待人工终审 |
| [010](data/hongloumeng/chapters/010/events.jsonl) | 2 | 15 | 段落定位、待人工终审 |

第七回的 `E0231`（秦业抱养可儿）原归章回错误，现已迁至第八回，保留原 ID；表中 V2 原事件数仍按迁移前计算。第八回 `E0246` 将误写的“酥酪”改为附件实际叙述的“枫露茶”。

**事件规范：** `event_type` 表示剧情、往事转述、对话、人物背景、梦境及象征预示；`sequence` 表示当回显示排序，非史实时间线；`source.evidence_level=anchored_paragraph` 表示人工智能辅助定位到原文段落，**不表示语义人工复核**。第五回判词另用 `depicted_people_ids` 标识传统解释的候选关联人物，`interpretation_status` 标明非原文直接指名，不能当作现实情节或人物亲历。

下一批次可继续第 011–020 回，须延用稳定人物、关系、事件 ID；如出现既有章回归属错误，应在同一 Git 提交内完成旧章删除与新章添加，保证全库引用唯一。

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

- `data/shuihuzhuan/people.jsonl`：487 位人物/人物候选；前 108 位梁山好汉为石碣名录，其他名称待逐个校勘。
- `relations.jsonl`：342 条有向或对称关系，保留 V2 `R` 编号；语义尚未逐条人工核验。
- `chapters/000`（楔子）至 `chapters/120`：每回单独保存事件；`events.jsonl` 共 360 条，保留 `E` 编号与 `relation_ids`。
- `candidates.jsonl`：1,689 条待核原文线索，**不会作为已确认关系展示**；可逐条转化为新增事件。
- `source.evidence_level=keyword_match` 表示自动匹配的原文定位，不代表人工事实确认。`line_start/line_end` 仅适用于 `shuihuzhuan:attachment-v1` 底本。
- 在线访问可通过 `?book=shuihuzhuan` 切换作品，后续逐回完善只需编辑对应章节文件与必要的人物、关系文件。


## 《西游记》逐回迁移（2026-11-25）

- **310** 个独立人物/群体档案：`data/xiyouji/people.jsonl`。
- **230** 条剧情语义关系：`data/xiyouji/relations.jsonl`，保留 V2 R 编号。
- **239** 条剧情事件：分散在各回 `events.jsonl`，事件 ID 由 EV00001 映射为 E00001，旧 ID 保存在 `legacy_id`。
- **873** 条待核同段线索：每回 `candidates.jsonl`，不是已确认关系；原始 **248** 条文本共现边不进入正式关系图。
- **100 回 + 第八回后的附录**：附录使用内部整数索引 `801`，元数据注明 `source_chapter_key: "8a"` 和 `narrative_order: 8.5`；页面按正文位置排序。
- **证据等级**：机器匹配的摘录最高只记 `keyword_match`，不标为人工审核 `reviewed`。行号依据 `xiyouji:attachment-v1`，更换底本不可直接沿用。
- 作品入口：`?book=xiyouji`；选择具体回目后，可以查看独立的待核线索队列。详情见 [西游记数据说明](data/xiyouji/README.md)。
