# 四大名著知识图谱 · Four Great Novels Viz

以原文章回为单位增量构建的开放式人物、关系、事件数据仓库与交互式静态网站。

## 数据进度（初始迁移 2026-11-25）

| 书籍 | ID | 人物 | 关系 | 事件关联记录 | 章回 |
|---|---|---:|---:|---:|---:|
| 红楼梦 | hongloumeng | 354 | 383 | 481 | 120 |
| 三国演义 | sanguoyanyi | 0 | 0 | 0 | 待录入 |
| 水浒传 | shuihuzhuan | 0 | 0 | 0 | 待录入 |
| 西游记 | xiyouji | 0 | 0 | 0 | 待录入 |

红楼梦由对话中的 V2 JSONL 迁移；481 是关联事件记录，不代表 481 个独立故事。全部数据为待校勘草稿，人物候选不保证穷尽。原文定位并不等于语义审核。原始附件未提交，版本指纹见 data/catalog.json。

## 目录

```
data/
  catalog.json
  <book_id>/
    people.jsonl
    relations.jsonl
    chapters/
      index.json
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
python scripts/export.py hongloumeng --output graph.json
python -m http.server 8000
```

打开 http://localhost:8000/。生成的 graph.json 是衍生文件，不是维护源。

## GitHub Pages

进入 Settings → Pages → Build and deployment → Source: Deploy from a branch → main / (root) → Save。
预期网址：https://1998x-stack.github.io/four-great-novels-viz/
页面直接读取 data 目录，使用相对路径，无需 npm、数据库服务或 CDN。新增章回后自动反映已提交的数据；请同步维护章节索引。

## 数据设计

book_id 与本地 ID 组成全局唯一键，例如 hongloumeng:P0001。关系端点引用本书人物，事件引用多个关系及参与者，章回文件按三位最小宽度命名（000 为楔子，001 为第一回）。事件 ID 不随章回移动而改变。原文证据保存附件版本、摘录及行号。

详细维护规则见 [CONTRIBUTING.md](CONTRIBUTING.md)。数据 Schema 版本 3.0.0；内容版本以 Git 提交记录为准。
