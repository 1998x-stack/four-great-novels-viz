# 《西游记》逐回知识图谱数据

源数据：当前会话提供的《西游记》TXT 与 V2 扩展文件。底本 `xiyouji:attachment-v1`，SHA-256：`3f2bf2164ee63ad7ce3ef88c830e88e860f47719740b13e6c4a1fe4d3be09b80`。

## 正式图谱

- `people.jsonl`：310 条人物或群体档案，身份、别名与出现回目是候选抽取结果。
- `relations.jsonl`：230 条剧情语义关系，稳定 `R` ID。关系为草稿，尚未逐一人工核验。
- `chapters/index.json`：100 回与附录。每回文件夹下的 `chapter.json` 记录版本、原文行区间和阅读顺序。
- `chapters/NNN/events.jsonl`：239 条剧情事件，稳定 `E` ID；`source.evidence_level` 明确区分关键词定位与校勘结论。连线通过 `relation_ids` 找到相关事件。
- `chapters/NNN/candidates.jsonl`：873 条 `C` ID 原文线索，状态 `pending`。这是由原始 248 条同段共现边提取，**不进入正式关系图**。

## 第八回后附录

V2 源键 `8a` 存在于第八回和第九回之间。为了兼容仓库统一的整数主键与 3 位目录，将它映射为 `chapters/801`，`narrative_order = 8.5`。编号 `801` 是内部数据键，**不是《西游记》的第八百零一回**。

## 证据与审核

`keyword_match` 仅表示机器匹配到段落称谓，不表示摘要已经人工复核；原文行号只适用上述附件版本。共现、同段提及或叙述转述不等价于主动关系。后续逐回精校应保留稳定人物/关系/事件 ID，更新证据级别需要明确人工核验记录。

## 后续扩展

新增人物只追加 P ID；新增关系复用稳定 R ID；新增事件只修改对应章节的 `events.jsonl`；补充待核证据修改 `candidates.jsonl`，通过人工审核后再纳入正式事件。提交前运行 `python scripts/validate.py && python scripts/validate_candidates.py`。


## V3：首批第 1–10 回逐回细化

- 批次标识：`xiyouji-ch001-010-v3`，包括第八回后附录（内部键 801）。
- 新增 217 条细分事件、92 条正式语义关系；原有 V2 事件和 R/P/E ID 全部保留。
- 全书累计 310 人物、322 正式关系、456 剧情事件、873 待核共现线索。
- 新增事件具备 `sequence`、`event_type`、`source.line_start`、`source.line_end`、`source.excerpt`、`source.anchor_text`。一个事件可同时引用多个关系；只有真实语义的关系才会成为图谱边。
- `anchored_paragraph` 表示可追溯的文本行定位，**不是人工核验完成**；未来逐条复核需在审校记录中说明依据。
- 回目数据由原有 `events.jsonl` 追加；新批次追加新的 ID，不覆盖已有事件。
- 第十回阴司游历的后续（还魂后事）发生在第十一回，不提前并入本批。

详见 [批次清单](enrichment-batches/001-010.json)。
