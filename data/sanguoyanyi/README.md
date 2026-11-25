# 三国演义 · V3 数据迁移

- 人物 543，去重关系 507，事件 600，章回 120。
- 人物及事件保留 legacy_id，关系保留 legacy_ids；新 ID 按旧版首次出现顺序分配，后续只增不重排。
- 37 条旧行号不在对应章回范围内，原摘录保存在 legacy_source，当前 evidence_level=chapter_only。其余仅 keyword_match，不视为人工校勘。
- 按章增量维护：先匹配 people.jsonl 的人物，再复用 relations.jsonl 的三元组，新增事件写入 chapters/NNN/events.jsonl。新 ID 使用现有最大编号加一。每次修改运行 python scripts/validate.py。
- 数据是小说叙事而非正史；规则提取、名称消歧及事件摘要仍需逐回核查。
