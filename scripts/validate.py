"""Validate canonical JSON/JSONL records and cross-file references."""
import json, sys
from pathlib import Path
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
def load(p):
    return json.loads(p.read_text(encoding="utf-8"))
def rows(p):
    return [json.loads(line) for line in p.read_text(encoding="utf-8").splitlines() if line.strip()]
def check(ok, message):
    if not ok:
        raise ValueError(message)
def validate(kind, record):
    Draft202012Validator(load(ROOT / "schemas" / (kind + ".schema.json"))).validate(record)
def unique(records, key):
    result = {r[key]:r for r in records}
    check(len(result)==len(records), "Duplicate " + key)
    return result
def read_book(b):
    bid=b["id"]
    d=ROOT/"data"/bid
    p=rows(d/"people.jsonl")
    r=rows(d/"relations.jsonl")
    chapters=load(d/"chapters"/"index.json")
    check(isinstance(chapters,list) and all(type(n)==int and n>=0 for n in chapters) and chapters==sorted(set(chapters)), bid+": invalid chapter index")
    actual={x.parent.name for x in (d/"chapters").glob("*/chapter.json")}
    event_dirs={x.parent.name for x in (d/"chapters").glob("*/events.jsonl")}
    check(actual==event_dirs=={f"{n:03d}" for n in chapters}, bid+": chapter index/directory mismatch")
    ps=unique(p,"id"); rs=unique(r,"relation_id")
    for x in p:
        validate("person",x); check(x["book_id"]==bid,"Person book mismatch")
    triples=set()
    for x in r:
        validate("relation",x); check(x["book_id"]==bid,"Relation book mismatch")
        a,z=x["subject_id"],x["object_id"]
        check(a in ps and z in ps and a!=z, "Bad endpoints "+x["relation_id"])
        if x["direction"]=="symmetric": a,z=sorted([a,z])
        triple=(a,x["predicate"],z)
        check(triple not in triples,"Duplicate relation "+str(triple)); triples.add(triple)
        check(x.get("valid_to_chapter") is None or x.get("valid_from_chapter",0)<=x["valid_to_chapter"],"Invalid relation chapter interval")
    events=[]; meta=[]
    for n in chapters:
        cd=d/"chapters"/f"{n:03d}"
        c=load(cd/"chapter.json"); validate("chapter",c)
        check(c["book_id"]==bid and c["chapter"]==n and c["edition_id"]==b.get("edition_id"),"Chapter identity mismatch")
        check(c.get("line_start",0)<=c.get("line_end",0),"Chapter source range")
        meta.append(c)
        for e in rows(cd/"events.jsonl"):
            validate("event",e)
            check(e["book_id"]==bid and e["chapter"]==n,"Event chapter mismatch")
            check(set(e["participants"])<=ps.keys(),"Unknown participant "+e["event_id"])
            check(set(e["relation_ids"])<=rs.keys(),"Unknown relation "+e["event_id"])
            for rid in e["relation_ids"]:
                rel=rs[rid]
                check({rel["subject_id"],rel["object_id"]}<=set(e["participants"]),"Missing endpoints "+e["event_id"])
            s=e["source"]
            check(s["chapter"]==n and s["edition_id"]==c["edition_id"],"Evidence identity mismatch")
            if "line_start" in s or "line_end" in s:
                check("line_start" in s and "line_end" in s and c.get("line_start",1)<=s["line_start"]<=s["line_end"]<=c.get("line_end",s["line_end"]),"Evidence range "+e["event_id"])
            if s["evidence_level"] in ("anchored_paragraph","reviewed"):
                check(bool(s.get("excerpt")) and "line_start" in s,"Missing excerpt "+e["event_id"])
            events.append(e)
    unique(events,"event_id")
    if b["status"]=="planned":
        check(not (p or r or chapters),"Planned book contains data")
    else:
        check(bool(b.get("edition_id")) and bool(b.get("source_sha256")),"Missing edition fingerprint")
    return {"book":b,"people":p,"relations":r,"chapters":meta,"events":events}
def main():
    catalog=load(ROOT/"data"/"catalog.json")
    validate("catalog",catalog); unique(catalog["books"],"id")
    for b in catalog["books"]:
        g=read_book(b)
        print(b["id"], {k:len(g[k]) for k in ("people","relations","chapters","events")})
    print("OK: schemas and references")
if __name__=="__main__":
    main()
