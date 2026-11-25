"use strict";
/*
 * Immersive full-screen character exploration.
 * Reuses the existing force graph / relations; no duplicate graph or data store.
 * Browser Fullscreen API with a full-viewport fallback.
 */
(() => {
  const $i = id => document.getElementById(id);
  const sourcePanel = document.querySelector(".panel.graph");
  const openButton = $i("fullscreenOpen");
  if (!sourcePanel || !openButton) return;

  const stage = document.createElement("section");
  stage.id = "immersiveStage";
  stage.className = "immersive-stage";
  stage.setAttribute("role", "dialog");
  stage.setAttribute("aria-label", "全屏人物关系探索");
  stage.setAttribute("aria-modal", "true");
  stage.tabIndex=-1;
  stage.hidden = true;
  stage.innerHTML = [
    '<header class="imm-header">',
      '<div class="imm-brand"><span class="imm-seal">四</span>',
      '<div><span class="imm-eyebrow">FOUR GREAT NOVELS / EXPLORATION MODE</span>',
      '<strong>人物宇宙 <span class="imm-star">✦</span> 沉浸探索</strong></div></div>',
      '<div class="imm-header-center"><label class="imm-book-label" for="imBook">当前作品</label>',
      '<select id="imBook" aria-label="全屏模式切换作品"></select>',
      '<span class="imm-header-separator">/</span>',
      '<span id="imChapter" class="imm-chapter">全书关系</span></div>',
      '<div class="imm-header-actions">',
      '<span id="imLiveStatus" class="imm-live-status" aria-live="polite">准备就绪</span>',
      '<button id="imClose" class="imm-exit" type="button" title="退出全屏（Esc）">退出全屏 <span>↗</span></button>',
      '</div>',
    '</header>',
    '<div class="imm-body">',
      '<div class="imm-map">',
        '<div class="imm-map-top"><div id="imTrail" class="imm-trail" aria-label="人物探索路径">RELATIONSHIP ATLAS</div>',
        '<div class="imm-map-toolbox">',
        '<div class="imm-scope" role="group" aria-label="图谱关系范围">',
        '<button type="button" data-im-scope="1" aria-pressed="true">一度</button>',
        '<button type="button" data-im-scope="2" aria-pressed="false">二度</button>',
        '<button type="button" data-im-scope="all" aria-pressed="false">全局</button>',
        '</div>',
        '<div class="imm-map-tools" role="group" aria-label="图谱视图控制">',
          '<button id="imZoomOut" type="button" title="缩小图谱" aria-label="缩小图谱">−</button>',
          '<button id="imZoomIn" type="button" title="放大图谱" aria-label="放大图谱">＋</button>',
          '<button id="imReset" type="button" title="视图复位" aria-label="视图复位">◎</button>',
          '<button id="imRelayout" type="button" title="重新排布人物" aria-label="重新排布">⟳</button>',
        '</div></div></div>',
        '<div id="imGraphSlot" class="imm-graph-slot"></div>',
        '<div class="imm-map-bottom"><span id="imMapInfo">选择人物开始探索</span>',
        '<span>拖拽人物 · 滚轮缩放 · 点击跳转</span></div>',
      '</div>',
      '<aside class="imm-sidebar" aria-label="人物信息与关系导航">',
        '<div class="imm-sidebar-head"><span class="imm-eyebrow">CHARACTER JOURNAL</span>',
        '<h2 id="imPersonName">等待人物</h2><p id="imPersonMeta">从关系图选择一位人物</p></div>',
        '<div class="imm-sidebar-content">',
          '<div id="imJourneyNote" class="imm-journey-note" aria-live="polite"></div>',
          '<div class="imm-search"><label for="imSearch">寻找人物 · 跳转图谱</label>',
          '<input id="imSearch" type="search" autocomplete="off" placeholder="输入姓名或别名…">',
          '<div id="imSearchResults" class="imm-search-results"></div></div>',
          '<div class="imm-section-head"><span id="imRelationTitle">相关人物</span><span id="imRelationCount">0 位</span></div>',
          '<div id="imNeighbours" class="imm-neighbours"></div>',
          '<div class="imm-section-head"><span>关联故事与原文</span><span id="imEventCount"></span></div>',
          '<div id="imEvents" class="imm-events"></div>',
        '</div>',
      '</aside>',
    '</div>',
    '<footer class="imm-dock">',
      '<div class="imm-nav">',
        '<button id="imBack" type="button" title="返回上一人物（←）" disabled>← 返回</button>',
        '<button id="imForward" type="button" title="前往下一人物（→）" disabled>前进 →</button>',
        '<span id="imPath" class="imm-path">探索路径 · 1</span>',
      '</div>',
      '<div class="imm-play">',
        '<button id="imNext" type="button" title="沿关系跳转下一人物">下一人物 <span>↗</span></button>',
        '<button id="imPlay" type="button" class="imm-play-main" aria-pressed="false" title="自动循环巡游（空格）">▶ 开始巡游</button>',
        '<label for="imSpeed">节奏</label><select id="imSpeed" aria-label="人物巡游间隔">',
        '<option value="4000">4 秒</option><option value="7000" selected>7 秒</option>',
        '<option value="11000">11 秒</option></select>',
        '<div class="imm-progress"><span id="imProgress"></span></div>',
      '</div>',
      '<div class="imm-dock-meta"><span id="imTourStatus">沿真实人物关系循环行走</span>',
      '<span class="imm-keys">Esc 退出 · 空格 播放</span></div>',
    '</footer>'
  ].join("");
  document.body.append(stage);

  const slot=$i("imGraphSlot"), map=$i("imMapInfo"), name=$i("imPersonName"),
    meta=$i("imPersonMeta"), neighbours=$i("imNeighbours"), stories=$i("imEvents"),
    note=$i("imJourneyNote"), search=$i("imSearch"), searchResults=$i("imSearchResults"),
    path=$i("imPath"), bookSelect=$i("imBook"), play=$i("imPlay"), speed=$i("imSpeed"),
    progress=$i("imProgress"), back=$i("imBack"), forward=$i("imForward"),
    title=$i("imRelationTitle"), relCount=$i("imRelationCount"), eventCount=$i("imEventCount");
  const placeholder=document.createComment("Original graph panel location");
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
  let active=false, nativeActive=false, playing=false, timer=null,
      historyItems=[], historyIndex=-1, saved=null, navigating=false, loadingBook=false,
      lastFocused=null;
  let visits=new Map();
  let inertElements=[];

  const el=(tag,cls,text)=>{
    const e=document.createElement(tag);
    if(cls)e.className=cls;
    if(text!==undefined)e.textContent=text;
    return e;
  };
  const getPeople=()=>new Map(state.people.map(person=>[person.id,person]));
  const currentRelations=()=>filteredRelations();
  function nameOf(id){return state.people.find(p=>p.id===id)?.name||id}
  function colorOf(id){return ["#bfa778","#91b6ab","#c39b92","#ab9cb9"][id.charCodeAt(id.length-1)%4]}
  function updateHeader(){
    const current=state.book?.id||"";
    if(bookSelect.options.length!==state.books.length){
      bookSelect.replaceChildren(...state.books.map(b=>{
        const option=el("option",undefined,b.title);option.value=b.id;return option;
      }));
    }
    bookSelect.value=current;
    $i("imChapter").textContent="全书关系 / "+(state.book?.title||"");
    $i("imLiveStatus").textContent=playing?"● 正在巡游":"● 自由探索";
    $i("imTourStatus").textContent=playing?"人物接力正在进行":"沿真实人物关系循环行走";
  }
  function refreshScope(){
    stage.querySelectorAll("[data-im-scope]").forEach(b=>{
      const on=b.dataset.imScope===$i("scope").value;
      b.classList.toggle("is-active",on);
      b.setAttribute("aria-pressed",String(on));
    });
    const view=visible();
    map.textContent=view.ids.size+" 位人物 · "+view.r.length+" 条关系记录 / "+(
      $i("scope").value==="all"?"全局图谱":$i("scope").value==="2"?"二度关系":"一度关系");
  }
  function buttonsState(){
    back.disabled=historyIndex<=0;
    forward.disabled=historyIndex<0||historyIndex>=historyItems.length-1;
    path.textContent="探索路径 · "+(historyIndex+1)+" / "+historyItems.length;
    const trail=$i("imTrail");
    trail.replaceChildren();
    const start=Math.max(0,historyIndex-3);
    for(let i=start;i<=historyIndex;i++){
      if(i>start)trail.append(el("span","imm-trail-sep","›"));
      const button=el("button","imm-trail-link"+(i===historyIndex?" is-current":""),nameOf(historyItems[i]));
      button.type="button";button.disabled=i===historyIndex;
      const index=i;
      button.addEventListener("click",()=>{
        historyIndex=index;
        navigate(historyItems[index],{manual:true,recordHistory:false});
      });
      trail.append(button);
    }
  }
  function setProgress(){
    stage.classList.remove("is-playing");
    progress.style.animationDuration=Number(speed.value)+"ms";
    if(playing&&!reduced.matches){
      void progress.offsetWidth;
      stage.classList.add("is-playing");
    }
  }
  function pause(){
    playing=false;
    if(timer)clearInterval(timer);
    timer=null;
    play.textContent="▶ 开始巡游";
    play.setAttribute("aria-pressed","false");
    setProgress();updateHeader();
  }
  function begin(){
    if(!active||!state.people.length)return;
    playing=true;
    play.textContent="Ⅱ 暂停巡游";
    play.setAttribute("aria-pressed","true");
    updateHeader();setProgress();
    if(timer)clearInterval(timer);
    timer=setInterval(nextHop,Number(speed.value));
  }
  function nextChoice(){
    const r=currentRelations();
    const candidate=new Map(),degree=new Map();
    for(const edge of r){
      degree.set(edge.subject_id,(degree.get(edge.subject_id)||0)+1);
      degree.set(edge.object_id,(degree.get(edge.object_id)||0)+1);
      if(edge.subject_id===state.person)candidate.set(edge.object_id,true);
      if(edge.object_id===state.person)candidate.set(edge.subject_id,true);
    }
    candidate.delete(state.person);
    const choices=[...candidate.keys()].filter(id=>getPeople().has(id));
    // Prefer unvisited neighbours, then central figures, then stable identity order.
    if(choices.length){
      choices.sort((a,b)=>(visits.get(a)||0)-(visits.get(b)||0)||
        (degree.get(b)||0)-(degree.get(a)||0)||a.localeCompare(b));
      return choices[0];
    }
    const fallback=[...degree.keys()].filter(id=>id!==state.person&&getPeople().has(id));
    fallback.sort((a,b)=>(visits.get(a)||0)-(visits.get(b)||0)||
      (degree.get(b)||0)-(degree.get(a)||0)||a.localeCompare(b));
    return fallback[0]||null;
  }
  function nextHop(){
    const id=nextChoice();
    if(!id){pause();note.textContent="当前筛选下没有可继续跳转的关系";return}
    navigate(id,{manual:false});
    setProgress();
  }
  function setJourney(msg){
    note.textContent=msg||"选择相关人物，继续走进下一张关系网络。";
  }
  function record(id){
    if(historyIndex<historyItems.length-1)
      historyItems=historyItems.slice(0,historyIndex+1);
    if(historyItems[historyItems.length-1]!==id){
      historyItems.push(id);
      if(historyItems.length>100)historyItems.shift();
    }
    historyIndex=historyItems.length-1;
    visits.set(id,(visits.get(id)||0)+1);
  }
  function navigate(id,{manual=true,recordHistory=true,resetCamera=true}={}){
    if(!active||loadingBook||!state.people.some(p=>p.id===id))return;
    if(navigating)return;
    navigating=true;
    try{
      if(manual&&playing)pause();
      if(recordHistory)record(id);
      state.person=id;
      state.selected=null;
      // A click in global view opens this character's own network, not the same whole-book cloud.
      if($i("scope").value==="all")$i("scope").value="1";
      // Default to a new ego-network; the top controls can switch to 2 hops / global.
      if(resetCamera)resetView();
      render();
      persistURL();
      renderPerson(id);
      refreshScope();buttonsState();
      search.value="";searchResults.replaceChildren();
    }finally{navigating=false}
  }
  function eventForPerson(id,relations){
    const related=new Set(relations.map(r=>r.relation_id));
    return filteredEvents().filter(e=>
      (e.participants||[]).includes(id)||
      (e.depicted_people_ids||[]).includes(id)||
      (e.relation_ids||[]).some(r=>related.has(r)));
  }
  function renderEvents(events){
    stories.replaceChildren();
    const n=Math.min(events.length,6);
    eventCount.textContent=events.length?events.length+" 条":"暂无";
    for(const e of events.slice(0,n)){
      const card=el("article","imm-event");
      const headline=el("span","imm-event-kicker","第 "+(e.chapter??"—")+" 回 · "+(
        {"reviewed":"人工核验","anchored_paragraph":"段落定位",
         "keyword_match":"关键词定位","chapter_only":"章回定位"}[e.source?.evidence_level]||"故事记录"));
      card.append(headline,el("p",undefined,e.summary||"暂无事件摘要"));
      if(e.source?.excerpt){
        const details=el("details"), summary=el("summary",undefined,"阅读原文摘录");
        details.append(summary,el("p","imm-excerpt",e.source.excerpt));
        card.append(details);
      }
      stories.append(card);
    }
    if(events.length>n)stories.append(el("div","imm-muted","另有 "+(events.length-n)+" 条记录，可退出全屏后查看完整事件列表。"));
    if(!events.length)stories.append(el("p","imm-muted","当前已加载的故事资料中暂无相应事件。"));
  }
  function renderPerson(id){
    const p=getPeople().get(id);
    if(!p){name.textContent="暂无人物";return}
    lastFocused=id;
    name.textContent=p.name;
    meta.textContent=[p.group,p.tier,(p.aliases||[]).length?"别名："+p.aliases.slice(0,4).join("、"):""].filter(Boolean).join(" · ");
    const r=currentRelations().filter(x=>x.subject_id===id||x.object_id===id);
    const connected=new Map();
    for(const edge of r){
      const other=edge.subject_id===id?edge.object_id:edge.subject_id;
      if(other===id)continue;
      if(!connected.has(other))connected.set(other,{id:other,count:0,predicates:new Set()});
      const item=connected.get(other);
      item.count++;
      if(edge.predicate)item.predicates.add(edge.predicate);
    }
    const list=[...connected.values()].sort((a,b)=>b.count-a.count||
      nameOf(a.id).localeCompare(nameOf(b.id),"zh-CN"));
    title.textContent="可继续探索的人物";
    relCount.textContent=list.length+" 位";
    neighbours.replaceChildren();
    if(!list.length)neighbours.append(el("p","imm-muted","当前筛选下没有直接连接的人物；可使用搜索跳转。"));
    for(const item of list.slice(0,45)){
      const target=getPeople().get(item.id);
      if(!target)continue;
      const button=el("button","imm-neighbour");
      button.type="button";
      const mark=el("span","imm-neighbour-dot");mark.style.background=colorOf(item.id);
      const inner=el("span","imm-neighbour-copy");
      inner.append(el("strong",undefined,target.name),
        el("small",undefined,[target.group,[...item.predicates].slice(0,2).join(" / ")].filter(Boolean).join(" · ")));
      button.append(mark,inner,el("span","imm-neighbour-arrow","↗"));
      button.title="跳转至"+target.name+"的关系图谱";
      button.addEventListener("click",()=>navigate(item.id));
      neighbours.append(button);
    }
    if(list.length>45)neighbours.append(el("p","imm-muted","其余 "+(list.length-45)+" 位人物可通过关系图或搜索探索。"));
    renderEvents(eventForPerson(id,r));
    setJourney("正在探索 "+p.name+" 的人物关系 · 点击相邻人物，接力进入新图谱");
  }
  function renderRelation(r){
    const a=nameOf(r.subject_id),b=nameOf(r.object_id);
    name.textContent=a+" ↔ "+b;
    meta.textContent="人物关系 / "+(r.category||"关系")+" · "+(r.predicate||"相连");
    const key=[r.subject_id,r.object_id].sort().join("|");
    const group=currentRelations().filter(edge=>
      [edge.subject_id,edge.object_id].sort().join("|")===key);
    title.textContent="这组人物之间的关系";
    relCount.textContent=group.length+" 条";
    neighbours.replaceChildren();
    for(const id of [r.subject_id,r.object_id]){
      const b=el("button","imm-neighbour",nameOf(id)+" · 查看人物关系图谱 ↗");
      b.type="button";b.addEventListener("click",()=>navigate(id));
      neighbours.append(b);
    }
    const ids=new Set(group.map(edge=>edge.relation_id));
    const events=filteredEvents().filter(e=>(e.relation_ids||[]).some(id=>ids.has(id)));
    renderEvents(events);
    setJourney([...new Set(group.map(edge=>edge.predicate))].join(" · ")+" · 点击任一人物继续跳转");
  }
  function inspectRelation(r){
    if(!active){showRelation(r);return}
    if(playing)pause();
    state.selected=r.relation_id;
    render();
    renderRelation(r);
    refreshScope();
  }
  function lookUp(query){
    searchResults.replaceChildren();
    const q=query.trim().toLowerCase();
    if(!q)return;
    const found=state.people.filter(p=>
      [p.name,p.id,...(p.aliases||[])].some(v=>String(v).toLowerCase().includes(q))).slice(0,8);
    if(!found.length){searchResults.append(el("p","imm-muted","没有匹配的人物"));return}
    for(const p of found){
      const button=el("button","imm-search-result",p.name+" · "+(p.group||"未分类"));
      button.type="button";button.addEventListener("click",()=>navigate(p.id));
      searchResults.append(button);
    }
  }
  function backStep(delta){
    const index=historyIndex+delta;
    if(index<0||index>=historyItems.length)return;
    historyIndex=index;
    navigate(historyItems[index],{manual:true,recordHistory:false});
    buttonsState();
  }
  function resetState(){
    historyItems=[];historyIndex=-1;visits=new Map();lastFocused=null;
  }
  async function changeBook(id){
    if(!active||loadingBook||!state.books.some(b=>b.id===id))return;
    pause();
    loadingBook=true;
    name.textContent="正在切换作品…";
    neighbours.replaceChildren();stories.replaceChildren();
    const selection=state.books.find(b=>b.id===id);
    try{
      await selectBook(selection);
      if(!active){loadingBook=false;return}
      $i("scope").value="1";
      $i("chapter").value="all";
      $i("category").value="";
      $i("evidence").value="";
      resetState();
      resetView();render();
      loadingBook=false;
      updateHeader();
      navigate(state.person||state.people[0]?.id,{resetCamera:false});
    }catch(e){
      loadingBook=false;
      note.textContent="切换失败："+e.message;
    }
  }
  function enter(){
    if(active)return;
    if(!state.book||!state.people.length){
      $i("status").textContent="作品人物数据尚未就绪，请稍后再进入全屏。";
      return;
    }
    active=true;nativeActive=false;
    saved={
      bookId:state.book.id,
      scope:$i("scope").value,
      chapter:$i("chapter").value,
      category:$i("category").value,
      evidence:$i("evidence").value,
      view:[...state.view]
    };
    // Pause chapter playback to prevent a second independent timer.
    const chapterPlay=$i("storyPlay");
    if(chapterPlay?.getAttribute("aria-pressed")==="true")chapterPlay.click();
    $i("scope").value="1";
    $i("chapter").value="all";
    $i("category").value="";
    $i("evidence").value="";
    sourcePanel.before(placeholder);
    slot.append(sourcePanel);
    inertElements=[...document.querySelectorAll("body > .site-header, body > main")].map(element=>({
      element,wasInert:element.inert
    }));
    inertElements.forEach(({element})=>{element.inert=true});
    stage.hidden=false;
    stage.classList.add("is-open");
    document.body.classList.add("immersive-lock");
    stage.focus({preventScroll:true});
    resetState();
    updateHeader();
    navigate(state.person||state.people[0].id);
    // Called during a direct user click, preserving Fullscreen API activation.
    if(typeof stage.requestFullscreen==="function"){
      try{
        const result=stage.requestFullscreen({navigationUI:"hide"});
        if(result?.catch)result.catch(()=>{nativeActive=false});
      }catch(e){/* Full viewport CSS fallback remains fully functional. */}
    }
    // Chapter-dependent evidence is loaded separately from relation metadata.
    // Rebuild story cache only when we entered from a filtered chapter.
    if(saved.chapter!=="all")loadEvents().then(()=>{
      if(active&&state.book?.id===saved.bookId)renderPerson(state.person);
    }).catch(()=>{});
  }
  function exit(){
    if(!active)return;
    pause();
    active=false;
    stage.classList.remove("is-open");
    stage.hidden=true;
    document.body.classList.remove("immersive-lock");
    inertElements.forEach(({element,wasInert})=>{element.inert=wasInert});
    inertElements=[];
    if(placeholder.parentNode)placeholder.parentNode.insertBefore(sourcePanel,placeholder);
    placeholder.remove();
    if(saved && saved.bookId===state.book?.id){
      $i("scope").value=saved.scope;
      $i("chapter").value=saved.chapter;
      $i("category").value=saved.category;
      $i("evidence").value=saved.evidence;
      state.view=saved.view.slice();
      updateView();
      if(saved.chapter!=="all")loadEvents();
    }else{
      $i("scope").value="1";
      $i("chapter").value="all";
      $i("category").value="";
      $i("evidence").value="";
    }
    render();showPerson(state.person);
    saved=null;
    if(document.fullscreenElement===stage && document.exitFullscreen){
      const ending=document.exitFullscreen();
      ending?.catch?.(()=>{});
    }
    nativeActive=false;
    openButton.focus({preventScroll:true});
  }
  window.NovelImmersive={
    get active(){return active},
    inspect:()=>({active,playing,bookId:state.book?.id,person:state.person,
      history:historyItems.slice(),index:historyIndex,scope:$i("scope").value}),
    openPerson:id=>navigate(id),
    openRelation:inspectRelation,
    close:exit
  };
  openButton.addEventListener("click",enter);
  $i("imClose").addEventListener("click",exit);
  back.addEventListener("click",()=>backStep(-1));
  forward.addEventListener("click",()=>backStep(1));
  $i("imNext").addEventListener("click",()=>{
    if(playing)pause();
    nextHop();
  });
  $i("imZoomIn").addEventListener("click",()=>zoom(.82));
  $i("imZoomOut").addEventListener("click",()=>zoom(1.22));
  $i("imReset").addEventListener("click",resetView);
  $i("imRelayout").addEventListener("click",()=>window.NovelGraph?.rearrange());
  play.addEventListener("click",()=>playing?pause():begin());
  speed.addEventListener("change",()=>{if(playing)begin()});
  search.addEventListener("input",()=>lookUp(search.value));
  bookSelect.addEventListener("change",()=>changeBook(bookSelect.value));
  stage.querySelectorAll("[data-im-scope]").forEach(button=>{
    button.addEventListener("click",()=>{
      if(!active||loadingBook)return;
      $i("scope").value=button.dataset.imScope;
      render();refreshScope();
      if(playing)pause();
    });
  });
  document.addEventListener("fullscreenchange",()=>{
    if(document.fullscreenElement===stage)nativeActive=true;
    else if(active&&nativeActive)exit();
  });
  document.addEventListener("visibilitychange",()=>{if(document.hidden&&playing)pause()});
  document.addEventListener("keydown",e=>{
    if(!active)return;
    const input=e.target?.matches?.("input,textarea,select,[contenteditable]")||false;
    if(e.key==="Escape"){
      if(document.fullscreenElement!==stage){e.preventDefault();exit()}
    }else if(!input&&(e.key===" "||e.code==="Space")){
      e.preventDefault();playing?pause():begin();
    }else if(!input&&e.key==="ArrowLeft"){e.preventDefault();backStep(-1)}
    else if(!input&&e.key==="ArrowRight"){e.preventDefault();backStep(1)}
  });
  window.addEventListener("pagehide",pause);
})();