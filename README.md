# 四大名著知识图谱 · Four Great Novels Viz

以原文章回为单位增量构建的开放式人物、关系、事件数据仓库与交互式静态网站。

## 数据进度（初始迁移 2026-11-25）

| 书籍 | ID | 人物 | 关系 | 事件关联记录 | 章回 |
|---|---|---:|---:|---:|---:|
| 红楼梦 | hongloumeng | 372 | 873 | 956 | 120 |
| 三国演义 | sanguoyanyi | 543 | 507 | 600 | 120（V2 迁移初稿；待逐回细化） |
| 水浒传 | shuihuzhuan | 495 | 855 | 869 | 楔子 + 120 回（1–30回细化草稿） |
| 西游记 | xiyouji | 334 | 643 | 931 | 100 回 + 附录 |

四部名著均有全书 V2 级迁移初稿。红楼梦第 001–030 回、水浒传第 001–030 回、西游记第 001–020 回（含第八回后附录）已逐回细化；三国演义为 543 人物、507 关系、600 事件的 V3 结构迁移稿，尚未完成前十回的逐段细化。水浒传另保留 1,689 条待核线索，候选证据不计入正式关系。全站数据仍处于待校勘阶段：自动化原文定位不等于人物身份消歧或语义人工终审；所有源文本版本指纹见 data/catalog.json。

## 分批完工计划与状态说明

截至 2026-11-25 的结构化数据基线与逐回验收顺序见 [GitHub Issue #4：四大名著 V3 分批完工总计划](https://github.com/1998x-stack/four-great-novels-viz/issues/4)。按十回一个批次，优先完成《三国演义》001–010，再依序推进《红楼梦》031–040、《水浒传》031–040、《西游记》021–030；后续循环推进。**本表的“章回”表示已有章节文件，不表示已逐回人工校勘。**《水浒传》旧 PR #2 与主分支存在分歧，需逐条比对差异，不能不经检查直接合并。

## 逐回复核进度（V3 前三十回批次）

截至 2026-11-25，《红楼梦》**第 001–030 回已经逐回增补**，全书目前有 **372 人物/人物候选、873 条人物关系、956 条事件关联记录**。前 30 回共 **650 条事件**，其中 **648 条有本附件的段落定位**，2 条因附带底本缺段保留待核。**段落定位不等于文学事实已人工终审**。其余 **90 回**仍主要保留较粗的 V2 初稿。

| 章回 | V2 原始事件数 | V3 当前事件数 | 校勘状态 |
|---|---:|---:|---|
| [001](data/hongloumeng/chapters/001/events.jsonl) | 16 | 26 | 已定位段落，待人工校勘 |
| [002](data/hongloumeng/chapters/002/events.jsonl) | 38 | 53 | 已定位段落，待人工校勘 |
| [003](data/hongloumeng/chapters/003/events.jsonl) | 12 | 38 | 已定位段落，待人工校勘 |
| [004](data/hongloumeng/chapters/004/events.jsonl) | 14 | 24 | 已定位段落，待人工校勘 |
| [005](data/hongloumeng/chapters/005/events.jsonl) | 2 | 33 | 已定位段落，待人工校勘 |
| [006](data/hongloumeng/chapters/006/events.jsonl) | 15 | 27 | 已定位段落，待人工校勘 |
| [007](data/hongloumeng/chapters/007/events.jsonl) | 9 | 25 | 已定位段落，待人工校勘 |
| [008](data/hongloumeng/chapters/008/events.jsonl) | 3 | 19 | 已定位段落，待人工校勘 |
| [009](data/hongloumeng/chapters/009/events.jsonl) | 6 | 17 | 已定位段落，待人工校勘 |
| [010](data/hongloumeng/chapters/010/events.jsonl) | 2 | 15 | 已定位段落，待人工校勘 |
| [011](data/hongloumeng/chapters/011/events.jsonl) | 1 | 14 | 已定位段落，待人工校勘 |
| [012](data/hongloumeng/chapters/012/events.jsonl) | 3 | 14 | 已定位段落，待人工校勘 |
| [013](data/hongloumeng/chapters/013/events.jsonl) | 4 | 15 | 已定位段落，待人工校勘 |
| [014](data/hongloumeng/chapters/014/events.jsonl) | 1 | 20 | 已定位段落，待人工校勘 |
| [015](data/hongloumeng/chapters/015/events.jsonl) | 3 | 14 | 已定位段落，待人工校勘 |
| [016](data/hongloumeng/chapters/016/events.jsonl) | 3 | 20 | 已定位段落，待人工校勘 |
| [017](data/hongloumeng/chapters/017/events.jsonl) | 3 | 18 | 已定位段落，待人工校勘 |
| [018](data/hongloumeng/chapters/018/events.jsonl) | 5 | 21 | 20 条段落定位，1 条待补原文 |
| [019](data/hongloumeng/chapters/019/events.jsonl) | 2 | 25 | 已定位段落，待人工校勘 |
| [020](data/hongloumeng/chapters/020/events.jsonl) | 4 | 17 | 已定位段落，待人工校勘 |
| [021](data/hongloumeng/chapters/021/events.jsonl) | 2 | 18 | 段落定位，待人工校勘 |
| [022](data/hongloumeng/chapters/022/events.jsonl) | 1 | 24 | 段落定位，待人工校勘 |
| [023](data/hongloumeng/chapters/023/events.jsonl) | 4 | 19 | 段落定位，待人工校勘 |
| [024](data/hongloumeng/chapters/024/events.jsonl) | 6 | 22 | 段落定位，待人工校勘 |
| [025](data/hongloumeng/chapters/025/events.jsonl) | 5 | 20 | 段落定位，待人工校勘 |
| [026](data/hongloumeng/chapters/026/events.jsonl) | 3 | 22 | 段落定位，待人工校勘 |
| [027](data/hongloumeng/chapters/027/events.jsonl) | 3 | 18 | 段落定位，待人工校勘 |
| [028](data/hongloumeng/chapters/028/events.jsonl) | 3 | 21 | 段落定位，待人工校勘 |
| [029](data/hongloumeng/chapters/029/events.jsonl) | 1 | 13 | 12条有段落定位，1条待补正文 |
| [030](data/hongloumeng/chapters/030/events.jsonl) | 1 | 18 | 段落定位，待人工校勘 |

本批次（021–030）合计 **195 条事件**，新增 **166 条**全书事件记录；194 条已附段落级证据、1 条待补底本；新增 **3 个人物实体/候选**（云儿、清虚观未具名小道士、靛儿）和 **193 条人物关系**。本批保留旧 ID 并继续按回独立提交。

### 源文缺段与解释性身份的处理

- **E0062 / 第十八回**：所附底本在元妃题诗段落截断，无法确认旧记录中“黛玉代作《杏帘在望》”的具体文本；保留 `legacy_unverified` / `chapter_only`。
- **E0064 / 第二十九回**：所附底本于清虚观归玉后即结束，不包含宝黛为玉争执的完整过程；虽然第三十回开头回顾此前角口，但不能伪造第二十九回的出处。保留 `legacy_unverified` / `chapter_only`，`review_required=true`。
- **第三十回龄官划蔷**：回目直接写“龄官划蔷”，所核对的正文该段仅写一名戏班女子。事件附 `identity_evidence=chapter_title` 与 `interpretation_status`，不声称正文直接称名。
- 戏文、灯谜、诗歌、梦境、人物玩笑、魇魔法及转述各保留 `event_type`，不得据此认定现实中的关系或历史事件。

下一批可以继续第 031–040 回。详细规则见 [CONTRIBUTING.md](CONTRIBUTING.md)。

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

## 网站界面与交互（2026-11-25）

首页采用“沉浸式封面 → 四书选择 → 数据工作台”结构，保留原有原文证据、章回事件、人物搜索、关系筛选和 SVG 缩放/拖拽功能。

- `assets/visual.css`：深色墨韵、书籍封面卡片、响应式工作台，以及滚动入场/图谱节点动效。
- `assets/visual.js`：Canvas 星点网络、图谱连线流光、卡片悬停、滚动进度和“播放章回”控制。
- 播放章回每 6 秒推进一回，支持暂停和手动切回；浏览器在后台时会自动停止播放。
- 动效遵循 `prefers-reduced-motion`，手机端限制星点数量与图谱动效开销。
- `assets/app.js` 仍负责知识图谱核心数据和证据逻辑；新增的动效只作视觉增强，不改变数据审核等级或语义。
- `assets/force-graph.js`：改为**力导向人物布局**（受 Fruchterman–Reingold、Gephi ForceAtlas2、D3 Force 思路启发；不是 ForceAtlas2 的原始移植）。边弹簧吸引、Barnes–Hut 四叉树近似斥力、碰撞避让、轻度群落聚合、阻尼与冷却自动收敛。
- 同一对人物可存在多条有证据的关系，但**力学只计算一条弹簧**，避免因重复记录导致节点扎堆。不同筛选视图保留已有节点坐标，人物选中不再触发布局重置。
- 在图谱中按住人物节点拖拽，松手自动继续平衡；拖动空白处平移画布，鼠标滚轮缩放；「视图复位」仅恢复视角，「重新排布」重新求解节点坐标。
- 人物名称根据关联度进行自适应显示：全局视图展示重点人物，悬停节点会突出其直接邻居。减少动画偏好下，使用静态迭代求解。
- 大型图使用降低重绘频率与分帧计算策略，所有脚本均放在仓库本地，不增加 CDN 运行依赖。

- **2026-11-25 密集图渲染优化**：当连线超过 260 条或人物超过 145 位时，自动切换为 Canvas 绘制连线、SVG 绘制人物的混合模式；完整的 `relations.jsonl` 和证据资料完全保留。
- 全局图中，同一人物对的多条叙事关系合并为一条可点击的连接；点击后通过右侧面板查看该人物对的关系类型与原文事件。
- 为节点增加透明的大尺寸鼠标/触摸命中区域，节点拖动使用 Pointer Capture，碰撞检测支持不同尺寸人物；左侧人物名录按需更新，避免交互中反复创建大量 DOM。
- Canvas 视图会跟随窗口、画布平移和 `viewBox` 缩放同步重绘；密集网络降低 SVG 特效开销，并为窄屏保留清晰线条。


算法参考：<https://d3js.org/d3-force/simulation>、<https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0098679>。


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

- `data/shuihuzhuan/people.jsonl`：495 位人物/人物候选；前 108 位梁山好汉为石碣名录，其他名称待逐个校勘。
- `relations.jsonl`：855 条有向或对称关系，保留 V2 `R` 编号；语义尚未逐条人工核验。
- `chapters/000`（楔子）至 `chapters/120`：每回单独保存事件；`events.jsonl` 共 869 条，保留 `E` 编号与 `relation_ids`。
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


## 《西游记》第二批：第 11—20 回（2026-11-25）

在首批前十回和附录的基础上，本批逐章逐回新增 **250 条事件、160 条剧情语义关系、15 个实体档案**；累计 **325 个实体、482 条关系、706 个事件**。前期 873 条共现候选仍独立保存，不算正式语义关系。

| 回目 | 新增事件 | 重点 |
|---|---:|---|
| 第 11 回 | 26 | 太宗还魂、阴司还债、刘全进瓜与水陆大会 |
| 第 12 回 | 26 | 玄奘身世、观音显化、唐王诏选取经人 |
| 第 13 回 | 22 | 双叉岭遇险、太白金星解救、刘伯钦护送 |
| 第 14 回 | 27 | 两界山收猴、打虎、六贼争执与紧箍 |
| 第 15 回 | 25 | 鹰愁涧白龙吞马、观音点化、白龙化马 |
| 第 16 回 | 27 | 观音禅院借宿、金池长老与袈裟失窃 |
| 第 17 回 | 27 | 寻黑熊精、悟空求观音、仙丹设伏收妖 |
| 第 18 回 | 16 | 高老庄招婿、天蓬旧事、悟空探云栈洞 |
| 第 19 回 | 26 | 猪刚鬣皈依为八戒、浮屠山乌巢传心经 |
| 第 20 回 | 28 | 黄风岭王家投宿、虎先锋掳师、八戒除虎 |

新事件使用稳定 `E111xx—E120xx` 编号，原文出处标有 `edition_id`、`line_start`、`line_end`、`anchor_text` 和 `source_sha256`，原有 P/R/E 编号全部保留。**机器辅助逐行定位不等于人工故事核验**；新增关系、人物和事件仍为 draft。详见 [第二批清单](data/xiyouji/enrichment-batches/011-020.json)。


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


## 《水浒传》逐回细化批次：第11–30回（2026-11-25）

第一批第1–10回已累计188条事件。第二批第11–20回原33条，**新增175条**，合计208条；第三批第21–30回原33条，**新增189条**，合计222条。全书目前有 **495个人物实体或候选、855条关系、869条事件**；仅第1–30回共618条事件。

| 章回 | 既有事件 | 本批新增 | 目前合计 |
|---|---:|---:|---:|
| [011](data/shuihuzhuan/chapters/011/events.jsonl) | 3 | 18 | 21 |
| [012](data/shuihuzhuan/chapters/012/events.jsonl) | 3 | 13 | 16 |
| [013](data/shuihuzhuan/chapters/013/events.jsonl) | 3 | 13 | 16 |
| [014](data/shuihuzhuan/chapters/014/events.jsonl) | 5 | 14 | 19 |
| [015](data/shuihuzhuan/chapters/015/events.jsonl) | 2 | 20 | 22 |
| [016](data/shuihuzhuan/chapters/016/events.jsonl) | 4 | 17 | 21 |
| [017](data/shuihuzhuan/chapters/017/events.jsonl) | 4 | 17 | 21 |
| [018](data/shuihuzhuan/chapters/018/events.jsonl) | 3 | 18 | 21 |
| [019](data/shuihuzhuan/chapters/019/events.jsonl) | 3 | 21 | 24 |
| [020](data/shuihuzhuan/chapters/020/events.jsonl) | 3 | 24 | 27 |
| [021](data/shuihuzhuan/chapters/021/events.jsonl) | 2 | 12 | 14 |
| [022](data/shuihuzhuan/chapters/022/events.jsonl) | 3 | 18 | 21 |
| [023](data/shuihuzhuan/chapters/023/events.jsonl) | 5 | 23 | 28 |
| [024](data/shuihuzhuan/chapters/024/events.jsonl) | 4 | 17 | 21 |
| [025](data/shuihuzhuan/chapters/025/events.jsonl) | 4 | 24 | 28 |
| [026](data/shuihuzhuan/chapters/026/events.jsonl) | 3 | 18 | 21 |
| [027](data/shuihuzhuan/chapters/027/events.jsonl) | 2 | 15 | 17 |
| [028](data/shuihuzhuan/chapters/028/events.jsonl) | 3 | 15 | 18 |
| [029](data/shuihuzhuan/chapters/029/events.jsonl) | 3 | 24 | 27 |
| [030](data/shuihuzhuan/chapters/030/events.jsonl) | 4 | 23 | 27 |

批次报告：[第11–20回](data/shuihuzhuan/reports/chapters-011-020.json) · [第21–30回](data/shuihuzhuan/reports/chapters-021-030.json)。新增事件保留独立E编号、参与者、关系R编号、原文行号与摘录、章内叙事序号；具备信息时还包括地点、起因、结果和故事线。**机器辅助的原文定位不是人工校勘通过**，原始同段共现候选仍然独立待审。第31–120回尚待分批细化。


## 《西游记》第三批：第 21—30 回（2026-11-25）

本批新增 **225 条原文锚定事件**、**161 条剧情语义关系**、**9 个待核实体**。累计 **334 个实体、643 条剧情关系、931 条事件**；873 条文本共现线索仍独立存放、不视为已证实关系。

| 回目 | 本批新增事件 | 故事重点 |
|---|---:|---|
| 第 21 回 | 20 | 黄风怪与灵吉降魔 |
| 第 22 回 | 23 | 沙悟净入队与流沙河渡师 |
| 第 23 回 | 22 | 四圣试禅心 |
| 第 24 回 | 22 | 五庄观偷食人参果 |
| 第 25 回 | 26 | 镇元子追捕与惩处 |
| 第 26 回 | 22 | 三岛求方与甘露活树 |
| 第 27 回 | 23 | 三打白骨精、师徒分离 |
| 第 28 回 | 21 | 花果山重整与波月洞遭难 |
| 第 29 回 | 19 | 百花羞送信与宝象国求援 |
| 第 30 回 | 27 | 黄袍怪变虎、龙马救师、八戒请猴 |

新增关系 `R0483–R0643`，实体 `P0326–P0334`，事件 `E12101–E13027`。所有新增事件包含回目、具体原文行号、摘录、字串锚点、人物、事件类型、场景和叙事顺序。**只完成机器辅助原文定位，未人工文学语义校勘**；证据标记为 `anchored_paragraph` 和 `draft`。完整说明见 [第三批清单](data/xiyouji/enrichment-batches/021-030.json)。
