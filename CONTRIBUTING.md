# 增量录入及校勘

## 每一回的更新流程

1. 确认书籍及底本文本版本：在 catalog.json 注册 edition_id、文件名和 SHA-256。新书从 planned 改为 draft。
2. 在 people.jsonl 查找现有人物及别名。不要因同名直接合并；新增 P 编号不得复用。人物身份有疑义时保留 status。
3. 在 relations.jsonl 复用已有 subject_id + predicate + object_id；新的关系分配 R 编号。方向表示谓词语义；对称关系填 symmetric。关系可以选填 valid_from_chapter 和 valid_to_chapter，叙事顺序不等于真实时间。
4. 新建或编辑 chapters/NNN/chapter.json 和 events.jsonl。新增事件 E 编号全书唯一，允许一条事件引用多个 R 编号；参与人必须包含每条关联关系的端点。
5. 若为新章回，将整数编号插入 chapters/index.json，排序去重。0 可表示楔子，不同版本的章回不能混在同一套底本中；新版须先明确迁移方案。
6. 原文证据 level：chapter_only（仅章回）、keyword_match（关键词匹配）、anchored_paragraph（段落定位）、reviewed（人工语义核验）。仅最后一种可视为审核通过。记录来源和具体摘录，不用共现替代关系。
7. 运行 python scripts/validate.py；提交只涉及当回事件、必要的新增人物及关系、索引。建议每回一个 PR 或 commit，标题如 data(hongloumeng): enrich chapter 023。

## 规范

- JSONL UTF-8，一行一个对象，无 BOM；JSON 文件使用 UTF-8。
- 实体 ID 在书内唯一且永久稳定，跨书引用须使用 book_id:local_id。
- 事件记录以 E ID 为准，原来的 481 条关联记录尚未做语义去重。后续发现同一故事应合并 relation_ids、保留旧 ID 映射（可用 supersedes 字段）并同步迁移引用。
- 不手工维护人物度数或事件计数：展示时从关系、事件重算。
- 人物 mentions / mention_chapters 为历史字面统计，不等于精确出场记录。
- 人物、关系可在多个章回复用；同一故事不得因涉及多条边就新建多条完全相同的事件。
- 不随意修改底本行号；新增版本必须保存旧版来源。当前实现每书一个活跃底本，未来可进一步拆 editions/。
- 允许兼容的可选字段；破坏性修改提升 schema major 版本并编写迁移。
- 原文附件不在仓库中；发布完整原文前请确认具体版本的使用权。不得把私人备注写入公开数据。

## 事件示例（结构示意，不是新增真实记录）

```json
{"book_id":"hongloumeng","event_id":"E9999","chapter":23,"summary":"待校勘的故事摘要","participants":["P0001","P0005"],"relation_ids":["R0055"],"source":{"chapter":23,"edition_id":"hongloumeng:attachment-v1","evidence_level":"chapter_only"},"record_origin":"人工整理"}
```

先校验后合并；通过结构验证不代表文学事实准确。

## 待核线索（可选数据集）

`chapters/NNN/candidates.jsonl` 记录人工复核的工作队列，与 `events.jsonl` 严格分开：

- 共现、相邻词、动作词命中**不能直接推出人物关系**。
- 逐条核对原文后：可以新增 E 事件、关联已存在或新建的 R 关系，并保留原始 candidate_id 作为 `reviewed_from_candidate`。
- 不应将 `source.evidence_level` 直接改成 `reviewed`，除非有明确的人工语义核验记录。
- `python scripts/validate_candidates.py` 校验候选 ID、人物引用与底本行号。

## GitHub Pages

合并到 `main` 后，`.github/workflows/pages.yml` 验证并发布站点。仓库管理员需在 **Settings → Pages → Source** 选择 **GitHub Actions**。CI 校验通过并不自动等同网页部署成功；请在 Actions 查看 Deploy GitHub Pages 结果。


## 章回附录与异常阅读顺序

若附录没有独立的整数回数，分配不冲突的稳定整数 `chapter` 标识，并在 `chapter.json` 中设置 `chapter_kind: "appendix"`、`source_chapter_key` 和 `narrative_order`，前端按阅读顺序显示。当前《西游记》附录键 `8a` 映射到 `801`，叙事位置 `8.5`。不要把附录事件写到第八回内或重用第九回编号。

《西游记》`candidates.jsonl` 使用 `C####`、`subject_id`、`object_id`、`status: pending` 与仓库统一的 candidate.schema.json；从候选提升为正式剧情事件时，新建 E/R 记录并保留 `legacy_id` 和复核记录。所有自动匹配证据默认不是人工已核验。

## 第五回等象征文本的维护方式

梦境、判词、仙曲与现实剧情应分开，使用 `event_type=symbolic_foreshadowing` 表示预示，实际经历仍存 `plot`。判词未直接指名时，不可把传统归属人物放进 `participants`，而应使用 `depicted_people_ids` 和 `interpretation_status`；只有真正参与该事件的人才列入 `participants`。网页单独展示这些解释性角色，不把他们显示为参与故事或直接关系。证据等级 `anchored_paragraph` 只是原文定位，必须经过独立语义核验后才能升为 `reviewed`。

`source.excerpt` 记录原文段落的起始摘录，并以 `line_start` / `line_end` 回溯指定附件底本；若摘录为节选，不能假称包含了全部段落。涉及当事人指控、流言或医者论述，应注明转述者、叙事层级，不将指控或医者观点当作已查实事实。原文中有明显文字识别损坏的字，不应在数据里自行偷偷修复。
