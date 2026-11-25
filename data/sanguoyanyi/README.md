# 三国演义 · V4 按回目扩充（累计800条事件）

- 人物 543，去重关系 700，事件 800，章回 120。
- 人物及事件保留 legacy_id，关系保留 legacy_ids；新 ID 按旧版首次出现顺序分配，后续只增不重排。
- 37 条旧行号不在对应章回范围内，原摘录保存在 legacy_source，当前 evidence_level=chapter_only。其余仅 keyword_match，不视为人工校勘。
- 按章增量维护：先匹配 people.jsonl 的人物，再复用 relations.jsonl 的三元组，新增事件写入 chapters/NNN/events.jsonl。新 ID 使用现有最大编号加一。每次修改运行 python scripts/validate.py。
- 数据是小说叙事而非正史；规则提取、名称消歧及事件摘要仍需逐回核查。

## 第四批（E0601—E0800）

- 本批新增200条事件，193条新三元组，复用7条现有关系；涉及87回，所有原文定位均落在对应回目范围内。
- 数据来源为附件《三国演义》，通过显式叙事动词和人物别名匹配提取；保留source.excerpt、source.line_start/end、record_origin、extraction_rule。
- evidence_level=keyword_match，interpretation_status=draft；自动匹配不是人工语义校勘。修订事件时保留稳定event_id和relation_id。
- 后续新增应写入对应chapters/NNN/events.jsonl，同时复用或新增relations.jsonl中的三元组，执行验证与Pages部署。
