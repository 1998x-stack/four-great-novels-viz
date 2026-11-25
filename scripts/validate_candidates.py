"""Validate optional per-chapter candidate lines; co-occurrence is not an established relation."""
from pathlib import Path
from jsonschema import Draft202012Validator
from validate import ROOT, load, rows

def main():
    catalog=load(ROOT / "data" / "catalog.json")
    schema=load(ROOT / "schemas" / "candidate.schema.json")
    validator=Draft202012Validator(schema)
    total=0
    for book in catalog["books"]:
        d=ROOT/"data"/book["id"]
        if not d.exists() or not (d/"chapters"/"index.json").exists():
            continue
        people={p["id"] for p in rows(d/"people.jsonl")}
        seen=set()
        for n in load(d/"chapters"/"index.json"):
            folder=d/"chapters"/f"{n:03d}"
            candidates=folder/"candidates.jsonl"
            if not candidates.exists(): continue
            chapter=load(folder/"chapter.json")
            for c in rows(candidates):
                validator.validate(c)
                assert c["book_id"]==book["id"] and c["chapter"]==n, "Candidate chapter mismatch"
                assert c["candidate_id"] not in seen, "Duplicate candidate ID"
                seen.add(c["candidate_id"])
                assert c["subject_id"]!=c["object_id"], "Self-relation candidate"
                assert {c["subject_id"],c["object_id"]} <= people, "Unknown candidate person"
                s=c["source"]
                assert s["chapter"]==n and s["edition_id"]==book["edition_id"], "Candidate source mismatch"
                if "line_start" in s or "line_end" in s:
                    assert "line_start" in s and "line_end" in s, "Partial candidate line range"
                    assert chapter["line_start"]<=s["line_start"]<=s["line_end"]<=chapter["line_end"], "Candidate line range"
                total+=1
        if seen: print(book["id"], "review candidates", len(seen))
    print("OK: candidate records",total)

if __name__=="__main__":
    main()
