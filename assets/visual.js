"use strict";
(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const $v = id => document.getElementById(id);
  const hero = $v("top"), canvas = $v("heroCanvas"), bookNav = $v("books"), graph = $v("graph");
  const bookDetails = {
    hongloumeng: {index:"01 / DREAM",english:"DREAM OF THE RED CHAMBER",description:"一座大观园，一场繁华梦。家族、情缘与命运彼此缠绕。",symbol:"梦"},
    sanguoyanyi: {index:"02 / KINGDOMS",english:"ROMANCE OF THE THREE KINGDOMS",description:"天下三分，英雄逐鹿。权谋、结义与乱世风云。",symbol:"义"},
    shuihuzhuan: {index:"03 / OUTLAWS",english:"WATER MARGIN",description:"水泊梁山，聚义江湖。好汉之间的情与义。",symbol:"侠"},
    xiyouji: {index:"04 / JOURNEY",english:"JOURNEY TO THE WEST",description:"十万八千里，师徒同心。一路劫难与修行。",symbol:"悟"}
  };
  const node = (tag, cls, text) => {
    const el = document.createElement(tag);
    if(cls) el.className = cls;
    if(text !== undefined) el.textContent = text;
    return el;
  };
  function enhanceBooks(){
    for(const button of bookNav.querySelectorAll("button[data-book]:not([data-enhanced])")){
      const info = bookDetails[button.dataset.book];
      if(!info) continue;
      button.dataset.enhanced = "true";
      button.dataset.symbol = info.symbol;
      const title = button.textContent.trim();
      const upper = node("span","book-upper");
      upper.append(node("span","book-index",info.index));
      const planned = button.dataset.book === "sanguoyanyi";
      upper.append(node("span","book-status"+(planned?" pending":""),planned?"待录入":"持续更新"));
      const body = node("span","book-body");
      body.append(node("span","book-english",info.english),
                  node("span","book-name",title),
                  node("span","book-description",info.description));
      const enter = node("span","book-enter");
      enter.append(node("span","",planned?"查看作品状态":"探索人物关系"),node("span","","↗"));
      button.replaceChildren(upper,body,enter);
      button.setAttribute("aria-label","探索"+title+(planned?"（数据待录入）":""));
      button.addEventListener("pointermove",e=>{
        const r=button.getBoundingClientRect();
        button.style.setProperty("--px",((e.clientX-r.left)/r.width*100).toFixed(1)+"%");
        button.style.setProperty("--py",((e.clientY-r.top)/r.height*100).toFixed(1)+"%");
      });
    }
  }
  const bookObserver = new MutationObserver(enhanceBooks);
  bookObserver.observe(bookNav,{childList:true});
  enhanceBooks();

  // Ambient constellation: deliberately lightweight, paused out of view.
  const ctx = canvas.getContext("2d",{alpha:true});
  let W=0,H=0,dpr=1,stars=[],pointer={x:0,y:0},visible=true,last=0,frame=0;
  function resize(){
    const rect=hero.getBoundingClientRect();
    W=Math.max(1,rect.width); H=Math.max(1,rect.height);
    dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const count=W<640?44:W<950?60:85;
    stars=Array.from({length:count},()=>({
      x:Math.random()*W,y:Math.random()*H,
      size:Math.random()*1.4+.3,
      speed:Math.random()*.19+.04,
      phase:Math.random()*Math.PI*2,
      drift:(Math.random()-.5)*.28
    }));
  }
  function draw(time){
    frame=requestAnimationFrame(draw);
    if(!visible || document.hidden || (time-last<36 && !reducedMotion.matches)) return;
    last=time;
    ctx.clearRect(0,0,W,H);
    const t=reducedMotion.matches?0:time*.00025;
    const coords=stars.map(s=>({
      x:s.x+Math.sin(t*s.speed*8+s.phase)*18+pointer.x*9,
      y:s.y+Math.cos(t*s.speed*6+s.phase)*12+pointer.y*8,
      size:s.size
    }));
    for(let i=0;i<coords.length;i++){
      const a=coords[i];
      for(let j=i+1;j<coords.length;j++){
        const b=coords[j], dx=a.x-b.x,dy=a.y-b.y,dist=dx*dx+dy*dy;
        if(dist<12000){
          const strength=(1-dist/12000)*.13;
          ctx.strokeStyle="rgba(195,201,178,"+strength.toFixed(3)+")";
          ctx.lineWidth=.7;
          ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
        }
      }
    }
    coords.forEach((s,i)=>{
      const pulse=.55+.45*Math.sin(t*10+stars[i].phase);
      ctx.fillStyle=i%8===0?"rgba(232,189,124,"+(.5+pulse*.4)+")":"rgba(186,214,205,"+(.26+pulse*.45)+")";
      ctx.beginPath();ctx.arc(s.x,s.y,s.size,0,Math.PI*2);ctx.fill();
    });
  }
  resize();
  window.addEventListener("resize",resize,{passive:true});
  hero.addEventListener("pointermove",e=>{
    const rect=hero.getBoundingClientRect();
    pointer.x=(e.clientX-rect.left)/Math.max(1,rect.width)-.5;
    pointer.y=(e.clientY-rect.top)/Math.max(1,rect.height)-.5;
  },{passive:true});
  if("IntersectionObserver" in window){
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{threshold:0});
    observer.observe(hero);
  }
  frame=requestAnimationFrame(draw);
  window.addEventListener("pagehide",()=>cancelAnimationFrame(frame));

  // Scroll-based editorial reveals and reading indicator.
  const revealItems=[...document.querySelectorAll(".reveal"),...document.querySelectorAll(".book-grid")];
  if("IntersectionObserver" in window && !reducedMotion.matches){
    const io=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){entry.target.classList.add("in-view");io.unobserve(entry.target)}
      });
    },{threshold:.09,rootMargin:"0px 0px -25px 0px"});
    revealItems.forEach(el=>{el.classList.add("reveal");io.observe(el)});
  } else revealItems.forEach(el=>el.classList.add("in-view"));
  const scrollBar=$v("readingProgress");
  let scrollQueued=false;
  window.addEventListener("scroll",()=>{
    if(scrollQueued)return;
    scrollQueued=true;
    requestAnimationFrame(()=>{
      const h=document.documentElement;
      const max=Math.max(1,h.scrollHeight-h.clientHeight);
      scrollBar.style.width=Math.max(0,Math.min(100,window.scrollY/max*100)).toFixed(2)+"%";
      scrollQueued=false;
    });
  },{passive:true});
  $v("enterExplorer").addEventListener("click",()=>{
    $v("explore").scrollIntoView({behavior:reducedMotion.matches?"instant":"smooth",block:"start"});
  });

  // On node rerender, add lightweight ambient halos and staggered entrance.
  function enhanceGraph(){
    const nodes=graph.querySelectorAll("g.node");
    const animate=nodes.length<=95 && !reducedMotion.matches;
    nodes.forEach((g,i)=>{
      if(g.dataset.enhanced)return;
      g.dataset.enhanced="true";
      g.style.animationDelay=animate?Math.min(i*12,400)+"ms":"0ms";
      if(animate){
        const main=g.querySelector("circle");
        if(!main)return;
        const radius=parseFloat(main.getAttribute("r"))||8;
        const halo=document.createElementNS("http://www.w3.org/2000/svg","circle");
        halo.setAttribute("r",String(radius+6));
        halo.setAttribute("class","node-halo");
        halo.setAttribute("aria-hidden","true");
        halo.style.animationDelay=((i%12)*.27)+"s";
        g.insertBefore(halo,main);
      }
    });
    // Animate a small sampling of real relationship paths with traveling sparks.
    // The layer is recreated on each graph render, but never touches interaction targets.
    if(!reducedMotion.matches && !graph.querySelector(".edge-tracers")){
      const paths=[...graph.querySelectorAll(":scope > path[stroke-opacity]")];
      if(paths.length){
        const layer=document.createElementNS("http://www.w3.org/2000/svg","g");
        layer.setAttribute("class","edge-tracers");
        layer.setAttribute("pointer-events","none");
        const count=Math.min(16,paths.length),step=Math.max(1,Math.floor(paths.length/count));
        for(let i=0;i<count;i++){
          const path=paths[Math.min(paths.length-1,i*step)];
          const d=path.getAttribute("d");
          if(!d)continue;
          const spark=document.createElementNS("http://www.w3.org/2000/svg","circle");
          spark.setAttribute("r",i%4===0?"2.5":"1.6");
          spark.setAttribute("fill",i%3===0?"#ffdab0":"#b9e3cb");
          const motion=document.createElementNS("http://www.w3.org/2000/svg","animateMotion");
          const dur=5+(i%5)*1.5;
          motion.setAttribute("path",d);
          motion.setAttribute("dur",dur+"s");
          motion.setAttribute("begin",(-i*.52)+"s");
          motion.setAttribute("repeatCount","indefinite");
          const opacity=document.createElementNS("http://www.w3.org/2000/svg","animate");
          opacity.setAttribute("attributeName","opacity");
          opacity.setAttribute("values","0;.9;.9;0");
          opacity.setAttribute("keyTimes","0;.15;.8;1");
          opacity.setAttribute("dur",dur+"s");
          opacity.setAttribute("begin",(-i*.52)+"s");
          opacity.setAttribute("repeatCount","indefinite");
          spark.append(motion,opacity);layer.append(spark);
        }
        graph.append(layer);
      }
    }
  }
  const graphObserver=new MutationObserver(enhanceGraph);
  graphObserver.observe(graph,{childList:true});
  enhanceGraph();
  graph.addEventListener("wheel",e=>{
    // Direct manipulation of the existing SVG viewBox zoom API.
    if(!graph.querySelector("g.node"))return;
    e.preventDefault();
    if(typeof zoom==="function") zoom(e.deltaY>0?1.11:.9);
  },{passive:false});

  // Animate individual chapters through the existing chapter selector.
  const playButton=$v("storyPlay"),playText=$v("playText"),
        playIcon=$v("playIcon"),playProgress=$v("playProgress"),
        playLabel=$v("playLabel"),chapterSelect=$v("chapter");
  const period=6000;
  let playing=false,timer=null,programmatic=false;
  function refreshProgress(){
    playProgress.style.transition="none";
    playProgress.style.width="0%";
    void playProgress.offsetWidth;
    if(playing){
      playProgress.style.transition="width "+period+"ms linear";
      playProgress.style.width="100%";
    }
  }
  function updateLabel(){
    if(!playing){playLabel.textContent="按回目观察人物关系的变化";return}
    const n=Number(chapterSelect.value);
    const total=typeof state!=="undefined"?state.chapters.length:0;
    const current=typeof state!=="undefined"?state.chapters.indexOf(n)+1:0;
    playLabel.textContent="章回演进 "+current+" / "+total;
  }
  function stop(){
    if(timer)clearInterval(timer);
    timer=null;playing=false;
    playButton.setAttribute("aria-pressed","false");
    playText.textContent="播放章回";
    playIcon.textContent="▶";
    refreshProgress();updateLabel();
  }
  function setChapter(n){
    chapterSelect.value=String(n);
    programmatic=true;
    chapterSelect.dispatchEvent(new Event("change",{bubbles:true}));
    programmatic=false;
  }
  function advance(){
    if(typeof state==="undefined"||!state.chapters.length){stop();return}
    const i=state.chapters.indexOf(Number(chapterSelect.value));
    if(i>=state.chapters.length-1){stop();return}
    setChapter(state.chapters[i+1]);
    updateLabel();refreshProgress();
  }
  function start(){
    if(typeof state==="undefined"||!state.chapters.length){
      playLabel.textContent="这部作品暂无可播放的章回";return;
    }
    const i=state.chapters.indexOf(Number(chapterSelect.value));
    if(chapterSelect.value==="all"||i<0||i===state.chapters.length-1)setChapter(state.chapters[0]);
    playing=true;
    playButton.setAttribute("aria-pressed","true");
    playText.textContent="暂停播放";playIcon.textContent="Ⅱ";
    updateLabel();refreshProgress();
    timer=setInterval(advance,period);
  }
  playButton.addEventListener("click",()=>playing?stop():start());
  chapterSelect.addEventListener("change",()=>{if(!programmatic&&playing)stop()});
  bookNav.addEventListener("click",()=>{if(playing)stop()},{capture:true});
  for(const id of ["prevChapter","nextChapter","timeline"]){
    $v(id).addEventListener("click",()=>{if(playing)stop()},{capture:true});
  }
  document.addEventListener("visibilitychange",()=>{if(document.hidden&&playing)stop()});
  window.addEventListener("pagehide",stop);
})();
