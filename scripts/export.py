"""Create a derived graph JSON for external visualization / GraphRAG."""
import argparse,json
from pathlib import Path
from validate import ROOT,load,read_book
p=argparse.ArgumentParser()
p.add_argument("book_id")
p.add_argument("--output",default="graph.json")
a=p.parse_args()
b=next((b for b in load(ROOT/"data"/"catalog.json")["books"] if b["id"]==a.book_id),None)
if not b: p.error("Unknown book")
g=read_book(b)
Path(a.output).write_text(json.dumps(g,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
