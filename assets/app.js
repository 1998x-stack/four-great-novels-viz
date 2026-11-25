"use strict";
const $=id=>document.getElementById(id);
const create=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e};
const sv=(tag,attrs={},text)=>{const e=document.createElementNS("http://www.w3.org/2000/svg",tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));if(text!==undefined)e.textContent=text;return e};
const json=async p=>{const r=await fetch(p);if(!r.ok)throw Error(p+" : "+r.status);return r.json()};
const jsonl=async p=>{const r=await fetch(p);if(!r.ok)throw Error(p+" : "+r.status);return (await r.text()).split(/\r?\n/).filter(l=>l.trim()).map(JSON.parse)};
const evidenceNames={reviewed:"人工核验",anchored_paragraph:"段落定位",keyword_match:"关键词定位",chapter_only:"章回定位"};
const colors=["#416b5c","#a95142","#6c83a4","#b29155","#886d92","#658d87","#867965","#b36e8e"];
let state={books:[],book:null,people:[],relations:[],chapters:[],events:[],person:null,selected:null,token:0,request:0,cache:new Map(),view:[0,0,900,620]};
const base=()=> "data/"+state.book.id+"/";
function persistURL(){if(!state.book)return;const u=new URL(location.href);u.searchParams.set("book",state.book.id);const n=$("chapter").value;if(n==="all")u.searchParams.delete("chapter");else u.searchParams.set("chapter",n);if(state.person)u.searchParams.set("person",state.person);else u.searchParams.delete("person");history.replaceState(null,"",u)}

const dir=n=>base()+"chapters/"+String(n).padStart(3,"0")+"/";
const personMap=()=>new Map(state.people.map(p=>[p.id,p]));
function label(p){return p?.name||"未知人物"}
function option(value,text){const o=create("option",text);o.value=value;return o}
function status(text,error=false){$("status").textContent=text;$("status").className=error?"error":""}
function empty(text){return create("p",text,"empty")}
function btn(text,fn,cls){const b=create("button",text,cls);b.addEventListener("click",fn);return b}
function updateView(){$("graph").setAttribute("viewBox",state.view.join(" "))}
function resetView(){state.view=[0,0,900,620];updateView()}
function zoom(k){let [x,y,w,h]=state.view;const nw=Math.max(180,Math.min(2200,w*k)),nh=nw*620/900;state.view=[x+(w-nw)/2,y+(h-nh)/2,nw,nh];updateView()}
async function init(){try{state.books=(await json("data/catalog.json")).books;for(const b of state.books){let button=btn(b.title,()=>{const u=new URL(location.href);u.searchParams.set("book",b.id);u.searchParams.delete("chapter");u.searchParams.delete("person");history.replaceState(null,"",u);selectBook(b)});button.dataset.book=b.id;$("books").append(button)}const wanted=new URLSearchParams(location.search).get("book");await selectBook(state.books.find(b=>b.id===wanted)||state.books[0])}catch(e){status(e.message,true)}}
async function selectBook(book){window.NovelGraph?.resetBook();resetView();const token=++state.token;state.request++;state.book=book;state.people=[];state.relations=[];state.events=[];state.chapters=[];state.person=null;state.selected=null;state.cache=new Map();$("bookTitle").textContent=book.title;$("edition").textContent=book.edition_id||"待录入";$("bookNote").textContent=book.status==="planned"?"尚未录入，未来按章回持续扩展。":book.id==="hongloumeng"?"已录120回 · 前30回完成逐回增补（其中2条待补原文，均未经人工终审）":"人物关系与故事数据 · 整理草稿";document.querySelectorAll("#books button").forEach(b=>b.classList.toggle("active",b.dataset.book===book.id));$("search").value="";$("category").replaceChildren(option("","全部类别"));$("chapter").replaceChildren(option("all","全书"));$("detail").replaceChildren(empty("请选择人物或关系"));render();status("读取书籍数据…");try{const root="data/"+book.id+"/";const [p,r,c]=await Promise.all([jsonl(root+"people.jsonl"),jsonl(root+"relations.jsonl"),json(root+"chapters/index.json")]);if(token!==state.token)return;state.people=p;state.relations=r;state.chapters=[...c].sort((a,b)=>(book.id==="xiyouji"&&a===801?8.5:a)-(book.id==="xiyouji"&&b===801?8.5:b));for(const n of state.chapters)$("chapter").append(option(String(n),n===801&&book.id==="xiyouji"?"附录（第八回后）":n===0?"楔子":"第 "+n+" 回"));for(const cat of [...new Set(r.map(x=>x.category))].sort())$("category").append(option(cat,cat));const params=new URLSearchParams(location.search),requested=params.get("chapter");$("chapter").value=requested!==null&&c.includes(Number(requested))?String(Number(requested)):"all";const deg=new Map();for(const x of r){deg.set(x.subject_id,(deg.get(x.subject_id)||0)+1);deg.set(x.object_id,(deg.get(x.object_id)||0)+1)}state.person=[...deg].sort((a,b)=>b[1]-a[1])[0]?.[0]||p[0]?.id||null;const requestedPerson=params.get("person");if(requestedPerson&&p.some(x=>x.id===requestedPerson))state.person=requestedPerson;await loadEvents()}catch(e){if(token===state.token)status(e.message,true)}}
async function loadEvents(){const req=++state.request,token=state.token,root=base(),cache=state.cache;const value=$("chapter").value,chapters=value==="all"?state.chapters:[Number(value)];state.events=[];state.selected=null;render();try{let all=[];for(let i=0;i<chapters.length;i+=10){const list=chapters.slice(i,i+10);const chunks=await Promise.all(list.map(async n=>{if(cache.has(n))return cache.get(n);const path=root+"chapters/"+String(n).padStart(3,"0")+"/events.jsonl";const rows=await jsonl(path);cache.set(n,rows);return rows}));if(token!==state.token||req!==state.request)return;all.push(...chunks.flat());status("读取章回 "+Math.min(i+10,chapters.length)+"/"+chapters.length)}if(token!==state.token||req!==state.request)return;state.events=all;const active=filteredRelations();if($("chapter").value!=="all"&&state.person&&!active.some(r=>[r.subject_id,r.object_id].includes(state.person)))state.person=active[0]?.subject_id||all[0]?.participants[0]||null;render();showPerson(state.person);if(value!=="all"){try{const meta=await json(root+"chapters/"+String(Number(value)).padStart(3,"0")+"/chapter.json");if(token===state.token&&req===state.request)$("chapterTitle").textContent=meta.title}catch(e){$("chapterTitle").textContent=""}}else $("chapterTitle").textContent="";status(chapters.length?"已载入 "+all.length+" 条事件":"待录入")}catch(e){if(req===state.request)status(e.message,true)}}
function filteredEvents(){const ev=$("evidence").value;return state.events.filter(e=>!ev||e.source.evidence_level===ev)}
function filteredRelations(){const cat=$("category").value,restrict=$("chapter").value!=="all"||!!$("evidence").value;const ids=new Set(filteredEvents().flatMap(e=>e.relation_ids));return state.relations.filter(r=>(!cat||r.category===cat)&&(!restrict||ids.has(r.relation_id)))}
function visible(){const r=filteredRelations(),ids=new Set();if($("scope").value==="all"){for(const x of r){ids.add(x.subject_id);ids.add(x.object_id)}if(state.person)ids.add(state.person)}else if(state.person){ids.add(state.person);for(let i=0;i<Number($("scope").value);i++){const prev=new Set(ids);for(const x of r)if(prev.has(x.subject_id)||prev.has(x.object_id)){ids.add(x.subject_id);ids.add(x.object_id)}}}return {ids,r:r.filter(x=>ids.has(x.subject_id)&&ids.has(x.object_id))}}
let peopleListCacheKey="";
function refreshPeopleList(){
 const q=$("search").value.trim().toLowerCase();
 const key=(state.book?.id||"none")+"|"+state.people.length+"|"+q;
 if(peopleListCacheKey!==key){
   const list=state.people.filter(p=>[p.id,p.name,...(p.aliases||[])]
     .some(x=>String(x).toLowerCase().includes(q)));
   $("personCount").textContent=list.length+" 人";
   const fragment=document.createDocumentFragment();
   for(const p of list){
     const button=btn("",()=>{
       state.person=p.id;state.selected=null;
       if($("scope").value==="all")$("scope").value="1";
       resetView();render();showPerson(p.id);
     },"person");
     button.dataset.person=p.id;
     button.append(create("b",p.name),create("small",[p.id,p.group].filter(Boolean).join(" · ")));
     fragment.append(button);
   }
   $("peopleList").replaceChildren(fragment);
   peopleListCacheKey=key;
 }
 // Selecting or dragging a node no longer recreates hundreds of sidebar buttons.
 for(const button of $("peopleList").querySelectorAll("button.person")){
   button.classList.toggle("selected",button.dataset.person===state.person);
 }
}
function render(){const {ids,r}=visible(),pm=personMap();$("stats").replaceChildren(...[["人物候选",state.people.length],["全书关系",state.relations.length],["当前事件",filteredEvents().length],["已录章回",state.chapters.length]].map(([t,n])=>{let s=create("div",undefined,"stat");s.append(create("b",n),create("small",t));return s}));refreshPeopleList();$("graphTitle").textContent="关系图谱 · "+ids.size+" 人 / "+r.length+" 边";const graph=$("graph");if(!window.NovelGraph)graph.replaceChildren();if(!ids.size){window.NovelGraph?.clear();graph.replaceChildren();graph.append(sv("text",{x:450,y:310,"text-anchor":"middle",fill:"#6c726a","font-size":20},"暂无图谱数据"));$("legend").replaceChildren();return}

// Physically balanced layout: connected people attract, unrelated nodes repel.
// Kept separate from data/relationship logic; retains SVG fallback below.
if(window.NovelGraph){
  const persons=[...ids].filter(id=>pm.has(id)).map(id=>{
    const p=pm.get(id);
    return{id,name:p.name,group:p.group||"未分类"};
  });
  const groups=[...new Set(persons.map(p=>p.group))].sort();
  const palette=new Map(groups.map((g,i)=>[g,colors[i%colors.length]]));
  window.NovelGraph.render({
    svg:graph,bookId:state.book?.id||"unknown",nodes:persons,links:r,
    palette,focusId:state.person,selectedId:state.selected,
    onNode:id=>{
      if(window.NovelImmersive?.active)window.NovelImmersive.openPerson(id);
      else{state.person=id;state.selected=null;render();showPerson(id)}
    },
    onEdge:relation=>{
      if(window.NovelImmersive?.active)window.NovelImmersive.openRelation(relation);
      else showRelation(relation)
    }
  });
  $("legend").replaceChildren(...groups.map(g=>{
    const span=create("span"),dot=create("i",undefined,"dot");
    dot.style.background=palette.get(g);
    span.append(dot,document.createTextNode(g));return span;
  }));
  return;
}
const nodes=[...ids].filter(id=>pm.has(id)),groups=[...new Set(nodes.map(id=>pm.get(id).group||"未分类"))].sort();const palette=new Map(groups.map((g,i)=>[g,colors[i%colors.length]]));const points=new Map();const focused=$("scope").value!=="all"&&state.person&&ids.has(state.person);if(focused)points.set(state.person,[450,310]);const others=nodes.filter(id=>!focused||id!==state.person).sort((a,b)=>(pm.get(a).group||"").localeCompare(pm.get(b).group||"")||a.localeCompare(b));const ringSize=others.length<=24?24:others.length<=70?35:42;for(let i=0;i<others.length;i++){const ring=Math.floor(i/ringSize),j=i%ringSize,n=Math.min(ringSize,others.length-ring*ringSize),angle=2*Math.PI*j/Math.max(n,1)-Math.PI/2,scale=1-ring*.24;points.set(others[i],[450+360*Math.max(.30,scale)*Math.cos(angle),310+240*Math.max(.30,scale)*Math.sin(angle)])}
const pairCounts=new Map(),seen=new Map();for(const x of r){const key=[x.subject_id,x.object_id].sort().join("|");pairCounts.set(key,(pairCounts.get(key)||0)+1)}for(const x of r){const [a,b]=[points.get(x.subject_id),points.get(x.object_id)];if(!a||!b)continue;const key=[x.subject_id,x.object_id].sort().join("|"),i=seen.get(key)||0;seen.set(key,i+1);const off=(i-(pairCounts.get(key)-1)/2)*24,dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,sign=x.subject_id<x.object_id?1:-1;const cx=(a[0]+b[0])/2-dy/len*off*sign,cy=(a[1]+b[1])/2+dx/len*off*sign,d="M"+a.join(" ")+" Q"+cx+" "+cy+" "+b.join(" ");const selected=state.selected===x.relation_id;const line=sv("path",{d,fill:"none",stroke:selected?"#963d32":"#a6a99f","stroke-opacity":selected?1:.48,"stroke-width":selected?2.7:1.3,"pointer-events":"none"});const hit=sv("path",{d,fill:"none",stroke:"transparent","stroke-width":12,class:"edge",tabindex:0,role:"button","aria-label":label(pm.get(x.subject_id))+" "+x.predicate+" "+label(pm.get(x.object_id))});hit.append(sv("title",{},label(pm.get(x.subject_id))+" → "+x.predicate+" → "+label(pm.get(x.object_id))));const click=()=>showRelation(x);hit.addEventListener("click",click);hit.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();click()}});graph.append(line,hit)}
for(const id of nodes){const p=pm.get(id),[x,y]=points.get(id),selected=id===state.person,rad=selected?16:nodes.length>65?6:10;const g=sv("g",{transform:"translate("+x+" "+y+")",class:"node",tabindex:0,role:"button","aria-label":p.name});g.append(sv("circle",{r:rad,fill:palette.get(p.group||"未分类"),stroke:selected?"#963d32":"#fff","stroke-width":selected?3:1.6}),sv("text",{x:0,y:rad+12,"text-anchor":"middle","font-size":nodes.length>65?9:12,fill:"#252d2a","font-weight":selected?700:400,"paint-order":"stroke",stroke:"#fffcf7","stroke-width":3,"stroke-linejoin":"round"},p.name),sv("title",{},p.name+" · "+(p.group||"")));const click=()=>{state.person=id;state.selected=null;render();showPerson(id)};g.addEventListener("click",click);g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();click()}});graph.append(g)}
$("legend").replaceChildren(...groups.map(g=>{const span=create("span");const dot=create("i",undefined,"dot");dot.style.background=palette.get(g);span.append(dot,document.createTextNode(g));return span}));}
function eventsFor(rid){return filteredEvents().filter(e=>e.relation_ids.includes(rid))}
function narrativeIndex(n){return state.book?.id==="xiyouji"&&n===801?8.5:n}function chapterLabel(n){return state.book?.id==="xiyouji"&&n===801?"附录 · 第八回后":n===0?"楔子":"第 "+n+" 回"}function eventCards(events){return [...events].sort((a,b)=>narrativeIndex(a.chapter)-narrativeIndex(b.chapter)||(a.sequence??0)-(b.sequence??0)||a.event_id.localeCompare(b.event_id)).map(e=>{const d=create("article",undefined,"event");d.append(create("small",chapterLabel(e.chapter)+" · "+e.event_id+" · "+(evidenceNames[e.source.evidence_level]||e.source.evidence_level)),create("p",e.summary));if(e.depicted_people_ids?.length){const pm=personMap();d.append(create("p","判词象征人物（解释性候选，并非现实事件参与者）："+e.depicted_people_ids.map(id=>label(pm.get(id))).join("、"),"muted"))}if(e.title)d.append(create("h5",e.title));if(e.location)d.append(create("p","地点： "+e.location,"muted"));if(e.causes?.length)d.append(create("p","起因： "+e.causes.join("；"),"event-extra"));if(e.outcomes?.length)d.append(create("p","结果： "+e.outcomes.join("；"),"event-extra"));if(e.story_arc)d.append(create("p","故事线： "+e.story_arc,"muted"));const details=create("details"),summary=create("summary","查看原文证据与出处"),s=e.source;details.append(summary,create("p",[s.chapter_title,s.edition_id,s.line_start?"第 "+s.line_start+"–"+s.line_end+" 行":"",s.match_status].filter(Boolean).join(" · "),"muted"),create("div",s.excerpt||"未提供段落摘录","quote"));d.append(details);return d})}
function showPerson(id){if(id)state.person=id;persistURL();const p=personMap().get(id),d=$("detail");if(!p){d.replaceChildren(empty("暂无人物数据"));return}d.replaceChildren(create("h4",p.name),create("p",[p.id,p.group,p.tier].filter(Boolean).join(" · "),"muted"),create("p","别名："+(p.aliases?.join("、")||"—"),"muted"));const rs=filteredRelations().filter(r=>[r.subject_id,r.object_id].includes(id)),pm=personMap();d.append(create("h4","关联人物 / "+rs.length));for(const r of rs){const b=btn("",()=>showRelation(r),"relation");b.append(create("b",label(pm.get(r.subject_id))+" · "+r.predicate+" · "+label(pm.get(r.object_id))),create("small",r.category+" / "+eventsFor(r.relation_id).length+" 条事件"));d.append(b)}if(!rs.length)d.append(empty("当前筛选下没有关联关系"));const ev=filteredEvents().filter(e=>e.participants.includes(id)||(e.depicted_people_ids||[]).includes(id));d.append(create("h4","关联故事 / "+ev.length),...eventCards(ev))}
function showRelation(r){state.selected=r.relation_id;render();const d=$("detail"),pm=personMap();const key=[r.subject_id,r.object_id].sort().join("|");const pair=filteredRelations().filter(x=>[x.subject_id,x.object_id].sort().join("|")===key);const rid=new Set(pair.map(x=>x.relation_id));const ev=filteredEvents().filter(e=>e.relation_ids.some(x=>rid.has(x)));const types=[...new Set(pair.map(x=>x.predicate))].join("、");d.replaceChildren(create("h4",label(pm.get(r.subject_id))+" ↔ "+label(pm.get(r.object_id))),create("p",types+" · "+pair.length+" 条关系","muted"),create("h4","故事事件 / "+ev.length),...eventCards(ev));if(!ev.length)d.append(empty("当前筛选下没有关联事件"))}

$("chapter").addEventListener("change",()=>{resetView();persistURL();loadEvents()});
function stepChapter(delta){const n=$("chapter").value,list=state.chapters;if(!list.length)return;const i=n==="all"?(delta>0?-1:list.length):list.indexOf(Number(n));const next=list[Math.max(0,Math.min(list.length-1,i+delta))];if(next===undefined)return;$("chapter").value=String(next);resetView();persistURL();loadEvents()}
$("prevChapter").addEventListener("click",()=>stepChapter(-1));$("nextChapter").addEventListener("click",()=>stepChapter(1));for(const id of ["category","scope","evidence"])$(id).addEventListener("change",()=>{state.selected=null;render();showPerson(state.person)});$("search").addEventListener("input",refreshPeopleList);$("timeline").addEventListener("click",()=>{const ev=filteredEvents();$("detail").replaceChildren(create("h4","章回事件 / "+ev.length),...eventCards(ev))});$("candidates").addEventListener("click",async()=>{const v=$("chapter").value, d=$("detail");if(v==="all"){d.replaceChildren(create("h4","待核线索"),empty("请先选择具体回目，避免将共现当作人物关系。"));return}const req=state.request,token=state.token;d.replaceChildren(empty("读取候选线索…"));try{const rows=await jsonl(dir(Number(v))+"candidates.jsonl");if(token!==state.token||req!==state.request)return;const pm=personMap();d.replaceChildren(create("h4",chapterLabel(Number(v))+" · 待核线索 / "+rows.length),create("p","文本同段共现不代表真实互动；点击证据展开原文定位。","muted"));for(const c of rows){const item=create("article",undefined,"event"),s=c.source||{};item.append(create("small",c.candidate_id+" · 待核"),create("p",(pm.get(c.subject_id)?.name||c.subject_id)+" × "+(pm.get(c.object_id)?.name||c.object_id)+" · "+(c.kind||"共现")));const detail=create("details");detail.append(create("summary","查看原文与行号"),create("p",s.line_start?"第 "+s.line_start+" 行":"仅回目级线索","muted"),create("div",s.excerpt||c.summary||"无摘录","quote"));item.append(detail);d.append(item)}}catch(e){if(token===state.token&&req===state.request)d.replaceChildren(empty("当前回目暂无线索文件："+e.message))}});
$("plus").addEventListener("click",()=>zoom(.8));$("minus").addEventListener("click",()=>zoom(1.25));$("reset").addEventListener("click",resetView);
$("relayout")?.addEventListener("click",()=>window.NovelGraph?.rearrange());
const graph=$("graph");let drag=null;graph.addEventListener("pointerdown",e=>{if(e.target.closest(".node,.edge"))return;drag={x:e.clientX,y:e.clientY,view:[...state.view]};graph.setPointerCapture(e.pointerId)});graph.addEventListener("pointermove",e=>{if(!drag)return;const rect=graph.getBoundingClientRect(),s=Math.min(rect.width/drag.view[2],rect.height/drag.view[3]);state.view=[drag.view[0]-(e.clientX-drag.x)/s,drag.view[1]-(e.clientY-drag.y)/s,drag.view[2],drag.view[3]];updateView()});for(const name of ["pointerup","pointercancel","lostpointercapture"])graph.addEventListener(name,()=>{drag=null});init();
