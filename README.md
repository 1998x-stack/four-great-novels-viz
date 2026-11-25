# 四大名著知识图谱 · Four Great Novels Viz

以原文章回为单位增量构建的开放式人物、关系、事件数据仓库与交互式静态网站。

## 数据进度（初始迁移 2026-11-25）

| 书籍 | ID | 人物 | 关系 | 事件关联记录 | 章回 |
|---|---|---:|---:|---:|---:|
| 红楼梦 | hongloumeng | 364 | 517 | 641 | 120 |
| 三国演义 | sanguoyanyi | 0 | 0 | 0 | 待录入 |
| 水浒传 | shuihuzhuan | 494 | 513 | 505 | 楔子 + 120 回（1–10回细化草稿） |
| 西游记 | xiyouji | 310 | 322 | 456 | 100 回 + 附录 |

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

- `data/shuihuzhuan/people.jsonl`：494 位人物/人物候选；前 108 位梁山好汉为石碣名录，其他名称待逐个校勘。
- `relations.jsonl`：513 条有向或对称关系，保留 V2 `R` 编号；语义尚未逐条人工核验。
- `chapters/000`（楔子）至 `chapters/120`：每回单独保存事件；`events.jsonl` 共 505 条，保留 `E` 编号与 `relation_ids`。
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


## 《西游记》逐回细化：第 1—10 回及附录（首批，2026-11-25）

本批在全书 V2 的 239 条剧情事件、230 条正式关系基础上，**新增 217 条细分事件、92 条语义关系**。人物仍为 310 条，现累计 456 条事件、322 条正式关系。原有 873 条文本共现候选继续独立存储，不计入正式关系。

| 章节 | 本批新增细分事件 | 原文定位 |
|---|---:|---|
| 第 1 回 | 16 | 仙石出世、探洞称王、访道赐名 |
| 第 2 回 | 20 | 修学长生、传七十二变和筋斗云、降混世魔王 |
| 第 3 回 | 20 | 兵器、龙宫、冥司、天庭奏议 |
| 第 4 回 | 19 | 弼马温、哪吒战猴、二次招安 |
| 第 5 回 | 20 | 蟠桃园、瑶池、兜率宫与天兵围山 |
| 第 6 回 | 18 | 惠岸侦察、二郎斗法、众神协助擒拿 |
| 第 7 回 | 16 | 八卦炉、灵霄殿战斗、如来镇山 |
| 第 8 回 | 24 | 如来传经、观音依次招募护法 |
| 第八回后附录 | 27 | 陈光蕊、江流儿身世与家族报仇 |
| 第 9 回 | 15 | 渔樵议论、赌雨、违旨、梦中求救 |
| 第 10 回 | 22 | 梦斩、守门、入冥司与十王对案 |

新增事件有 `source.line_start/line_end/excerpt/anchor_text`、叙事顺序 `sequence` 与 `event_type`；`evidence_level=anchored_paragraph` 只表示原文段落定位，**并非人工审核通过**。新增 ID 使用与历史数据不冲突的稳定编号段 `E101xx…E110xx`（附录 `E180xx`）；原有 E、R、P ID 未改变。下一批建议第 11–20 回。

增补批次清单：[001–010](data/xiyouji/enrichment-batches/001-010.json)；在线切换：`?book=xiyouji&chapter=1`。

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
