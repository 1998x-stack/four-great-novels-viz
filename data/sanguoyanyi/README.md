# 三国演义 · V3/V4 全书初稿与20回一批的重点剧情增补（累计1015条事件）

- **当前数据**：人物 **555**，关系 **873**，事件 **1015**，章回 120。此处计数包含 001–041 回重点场景增补，仍为机器辅助草稿。
- 人物及事件保留 legacy_id，关系保留 legacy_ids；新 ID 按旧版首次出现顺序分配，后续只增不重排。
- 37 条旧行号不在对应章回范围内，原摘录保存在 legacy_source，当前 evidence_level=chapter_only。其余仅 keyword_match，不视为人工校勘。
- 按章增量维护：先匹配 people.jsonl 的人物，再复用 relations.jsonl 的三元组，新增事件写入 chapters/NNN/events.jsonl。新 ID 使用现有最大编号加一。每次修改运行 python scripts/validate.py。
- 数据是小说叙事而非正史；规则提取、名称消歧及事件摘要仍需逐回核查。

## 第四批（E0601—E0800）

- 本批新增200条事件，193条新三元组，复用7条现有关系；涉及87回，所有原文定位均落在对应回目范围内。
- 数据来源为附件《三国演义》，通过显式叙事动词和人物别名匹配提取；保留source.excerpt、source.line_start/end、record_origin、extraction_rule。
- evidence_level=keyword_match，interpretation_status=draft；自动匹配不是人工语义校勘。修订事件时保留稳定event_id和relation_id。
- 后续新增应写入对应chapters/NNN/events.jsonl，同时复用或新增relations.jsonl中的三元组，执行验证与Pages部署。

## 第 022–041 回：20 回首轮重点剧情（PR 待合并）

- 本次 **20 回×5 场景＝新增 100 个剧情事件**；另外补录 **7 位人物**、**86 条关系**。原有 P/R/E 编号和旧事件仍保留；第 022–041 回新增每回场景按底本行号排序。
- 事件有用户上传 TXT 底本的行号和原文摘录，底本 SHA-256 见 catalog；人物关系与情节摘要仍为 `draft`，**这不是逐段穷尽，更不是人工事实终审**。
- 此批涵盖官渡、关羽千里走单骑、三顾茅庐、隆中对及长坂坡等；批次详情在 `enrichment-batches/022-041-summary.json`。
- 下一批按用户要求继续 **第 042–061 回（20 回）**。
