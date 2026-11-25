"use strict";
/*
 * A dependency-free, force-directed SVG graph for Four Great Novels.
 * Inspired by Fruchterman-Reingold / ForceAtlas2 and d3-force:
 * Barnes-Hut charge, spring links, rectangular boundaries, spatial-hash
 * collision, gentle community cohesion, alpha cooling and drag reheating.
 * This is not a port of the original ForceAtlas2 implementation.
 */
window.NovelGraph = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const W=900, H=620, PAD=38;
  let current=null, previous=new Map(), previousBook=null;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  function element(tag, attrs={}, label) {
    const el=document.createElementNS(NS,tag);
    for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));
    if(label!==undefined)el.textContent=label;
    return el;
  }
  function hash(text) {
    let h=2166136261;
    for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}
    return h>>>0;
  }
  function halton(i,base) {
    let f=1,v=0;while(i>0){f/=base;v+=f*(i%base);i=Math.floor(i/base)}return v;
  }
  function clamp(value,min,max){return Math.max(min,Math.min(max,value))}
  function repulsionTree(nodes) {
    const root={x:0,y:0,size:1024,items:[],children:null,mass:0,cx:0,cy:0};
    function insert(cell,n,depth){
      if(!cell.children && (cell.items.length===0 || depth>=12)){
        cell.items.push(n);return;
      }
      if(!cell.children){
        cell.children=[null,null,null,null];
        const list=cell.items;cell.items=[];
        for(const old of list)insert(cell,old,depth);
      }
      const half=cell.size/2;
      const q=(n.x>=cell.x+half?1:0)+(n.y>=cell.y+half?2:0);
      if(!cell.children[q]){
        cell.children[q]={
          x:cell.x+(q&1?half:0),y:cell.y+(q&2?half:0),
          size:half,items:[],children:null,mass:0,cx:0,cy:0
        };
      }
      insert(cell.children[q],n,depth+1);
    }
    for(const n of nodes)insert(root,n,0);
    function sum(cell){
      if(cell.children){
        for(const c of cell.children)if(c){
          sum(c);cell.mass+=c.mass;cell.cx+=c.cx*c.mass;cell.cy+=c.cy*c.mass;
        }
      }else{
        for(const n of cell.items){cell.mass++;cell.cx+=n.x;cell.cy+=n.y}
      }
      if(cell.mass){cell.cx/=cell.mass;cell.cy/=cell.mass}
    }
    sum(root);
    return root;
  }
  function applyRepulsion(node,cell,power){
    if(!cell || !cell.mass)return;
    const dx=node.x-cell.cx,dy=node.y-cell.cy,d2=dx*dx+dy*dy+125;
    if(!cell.children){
      for(const peer of cell.items){
        if(peer===node)continue;
        let x=node.x-peer.x,y=node.y-peer.y,d=x*x+y*y;
        if(d<.1){const a=hash(node.id+"|"+peer.id)%360*Math.PI/180;x=Math.cos(a);y=Math.sin(a);d=1}
        const inv=1/Math.sqrt(d+100);
        const f=power/(d+180);
        node.vx+=x*inv*f;
        node.vy+=y*inv*f;
      }
      return;
    }
    const contains=node.x>=cell.x && node.x<=cell.x+cell.size &&
                   node.y>=cell.y && node.y<=cell.y+cell.size;
    if(!contains && cell.size/Math.sqrt(d2)<.72){
      const inv=1/Math.sqrt(d2);
      const f=power*cell.mass/(d2+180);
      node.vx+=dx*inv*f;
      node.vy+=dy*inv*f;
      return;
    }
    for(const c of cell.children)if(c)applyRepulsion(node,c,power);
  }
  function collisions(nodes,space){
    // The search radius must cover the *whole* collision diameter, including
    // large hub nodes; 1.2*space missed peers two hash buckets away.
    const cellSize=Math.max(42,space+32);
    const pinned=activeDrag();
    const grid=new Map();
    function key(a,b){return a+","+b}
    for(let i=0;i<nodes.length;i++){
      const n=nodes[i],cx=Math.floor(n.x/cellSize),cy=Math.floor(n.y/cellSize);
      const k=key(cx,cy);
      if(!grid.has(k))grid.set(k,[]);
      grid.get(k).push(i);
    }
    for(let i=0;i<nodes.length;i++){
      const a=nodes[i],cx=Math.floor(a.x/cellSize),cy=Math.floor(a.y/cellSize);
      for(let ix=-1;ix<=1;ix++)for(let iy=-1;iy<=1;iy++){
        const bin=grid.get(key(cx+ix,cy+iy));
        if(!bin)continue;
        for(const j of bin){
          if(j<=i)continue;
          const b=nodes[j];
          let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
          const gap=a.radius+b.radius+space;
          if(d>=gap)continue;
          if(d<.01){dx=1;dy=.5;d=Math.hypot(dx,dy)}
          const overlap=(gap-d)*.43;
          const nx=dx/d*overlap,ny=dy/d*overlap;
          if(a!==pinned) {a.x-=nx;a.y-=ny}
          if(b!==pinned) {b.x+=nx;b.y+=ny}
        }
      }
    }
  }
  function activeDrag(){return current?.drag?.node||null}

  class Simulation {
    constructor(config,signature){
      this.svg=config.svg;
      this.signature=signature;
      this.bookId=config.bookId;
      this.config=config;
      this.nodes=[];
      this.byId=new Map();
      this.edges=[];
      this.springs=[];
      this.pairs=new Map();
      this.dense=config.links.length>260 || config.nodes.length>145;
      this.canvas=null;
      this.ctx=null;
      this.blankDown=null;
      this.edgeHover=null;
      this.hoverId=null;
      this.canvasFrame=0;
      this.raf=0;
      this.drag=null;
      this.alpha=.95;
      this.active=true;
      this.visible=true;
      this.lastDraw=0;
      this.iterations=0;
      this.cleanups=[];
      this.setup(config);
      if("IntersectionObserver" in window){
        this.observer=new IntersectionObserver(([entry])=>{
          this.visible=entry.isIntersecting;
          if(this.visible)this.run();
        },{threshold:0});
        this.observer.observe(this.svg);
      }
      if(prefersReduced.matches){
        // No animated transitions for reduced-motion users; a brief static solve.
        const steps=this.nodes.length>180?36:70;
        for(let k=0;k<steps;k++)this.tick();
        this.draw();
      }else this.run();
    }
    listen(el,type,handler,options){
      el.addEventListener(type,handler,options);
      this.cleanups.push(()=>el.removeEventListener(type,handler,options));
    }
    setup(config){
      const n=config.nodes.length;
      const degrees=new Map(config.nodes.map(v=>[v.id,0]));
      // Multiple narrative predicates between two people are rendered separately,
      // but share just one physical spring (otherwise parallel edges collapse clusters).
      const forcePairs=new Set();
      for(const r of config.links){
        const key=[r.subject_id,r.object_id].sort().join("|");
        if(forcePairs.has(key))continue;
        forcePairs.add(key);
        if(degrees.has(r.subject_id))degrees.set(r.subject_id,degrees.get(r.subject_id)+1);
        if(degrees.has(r.object_id)&&r.object_id!==r.subject_id)
          degrees.set(r.object_id,degrees.get(r.object_id)+1);
      }
      const ranked=[...config.nodes].sort((a,b)=>
        (degrees.get(b.id)||0)-(degrees.get(a.id)||0)||a.id.localeCompare(b.id));
      const compact=window.innerWidth<700;
      const budget=n<=34?n:n<=85?(compact?18:35):n<=180?(compact?15:28):(compact?12:23);
      const featured=new Set(ranked.slice(0,budget).map(v=>v.id));
      const palette=config.palette;
      const radiusOf=(degree,focused)=>{
        const base=n>140?5:n>50?6.5:8;
        const bonus=Math.min(n>140?7:5,Math.log2(degree+1)*1.25);
        return focused?Math.max(15,base+bonus+1):base+bonus;
      };
      this.radiusOf=radiusOf;
      const centerShift=hash(this.bookId||"novels")%250;
      const sorted=[...config.nodes].sort((a,b)=>a.id.localeCompare(b.id));
      sorted.forEach((entry,i)=>{
        const prev=previous.get(entry.id);
        const seed=centerShift+i+11;
        const x=prev?.x??(85+halton(seed,2)*730);
        const y=prev?.y??(65+halton(seed,3)*490);
        const selected=entry.id===config.focusId;
        const degree=degrees.get(entry.id)||0;
        const radius=radiusOf(degree,selected);
        const node={
          ...entry,x,y,vx:0,vy:0,radius,degree,
          featured:featured.has(entry.id),selected,elem:null,text:null,body:null
        };
        this.nodes.push(node);this.byId.set(node.id,node);
      });
      const groups=[...new Set(this.nodes.map(n=>n.group||"未分类"))].sort();
      this.groupCenters=new Map(groups.map((g,i)=>{
        const k=hash(this.bookId+"#"+g)%97+i+7;
        return [g,{x:165+halton(k,2)*570,y:130+halton(k,3)*355}];
      }));
      this.nodeLayer=element("g",{class:"force-node-layer"});
      this.edgeLayer=element("g",{class:"force-edge-layer"});
      this.svg.replaceChildren(this.edgeLayer,this.nodeLayer);
      if(this.dense)this.mountCanvas();
      this.svg.classList.toggle("is-dense",this.dense);
      const pairCount=new Map(),pairIndex=new Map();
      const active=[];
      for(const r of config.links){
        const a=this.byId.get(r.subject_id),b=this.byId.get(r.object_id);
        if(!a||!b)continue;
        const key=[a.id,b.id].sort().join("|");
        pairCount.set(key,(pairCount.get(key)||0)+1);
        active.push({source:a,target:b,relation:r,key});
      }
      const springPairs=new Set();
      for(const item of active){
        if(!springPairs.has(item.key)){springPairs.add(item.key);this.springs.push(item)}
        if(!this.pairs.has(item.key))this.pairs.set(item.key,[]);
        this.pairs.get(item.key).push(item.relation);
        const i=pairIndex.get(item.key)||0;pairIndex.set(item.key,i+1);
        const total=pairCount.get(item.key);
        item.offset=(i-(total-1)/2)*Math.min(15,48/Math.max(1,total));
        if(!this.dense){
          const line=element("path",{class:"force-edge-line",fill:"none","pointer-events":"none"});
          const hit=element("path",{
            class:"edge force-edge-hit",fill:"none",stroke:"transparent",
            "stroke-width":11,role:"button",tabindex:0,
            "aria-label":item.source.name+" "+item.relation.predicate+" "+item.target.name
          });
          const tip=element("title",{},item.source.name+" · "+item.relation.predicate+" · "+item.target.name);
          hit.append(tip);
          this.listen(hit,"click",()=>this.config.onEdge(item.relation));
          this.listen(hit,"keydown",e=>{
            if(e.key==="Enter"||e.key===" "){e.preventDefault();this.config.onEdge(item.relation)}
          });
          this.edgeLayer.append(line,hit);
          item.line=line;item.hit=hit;
        }
        this.edges.push(item);
      }
      for(const n of this.nodes){
        const g=element("g",{
          class:"node force-node",transform:"translate("+n.x+" "+n.y+")",
          role:"button",tabindex:this.nodes.length>140&&!n.featured?-1:0,"aria-label":n.name
        });
        // Visual.js may add a breathing halo as a separate decorative circle.
        const circle=element("circle",{
          class:"force-node-body",r:n.radius,
          fill:palette.get(n.group||"未分类")||"#8caf9b",
          stroke:n.selected?"#f5d29c":"#d2e2dc",
          "stroke-width":n.selected?2.5:1
        });
        const text=element("text",{
          class:"force-node-label"+(n.featured||n.selected?"":" is-quiet"),
          x:0,y:n.radius+15,"text-anchor":"middle",
          "font-size":this.nodes.length>150?10:12,
          "paint-order":"stroke","stroke-linejoin":"round"
        },n.name);
        // A separate transparent hit area stays easy to grab on mobile and in full-book graphs.
        const hitRadius=Math.max(15,n.radius+7);
        const hit=element("circle",{
          class:"force-node-hit",r:hitRadius,fill:"transparent",
          "pointer-events":"all","aria-hidden":"true"
        });
        g.append(circle,hit,text,element("title",{},n.name+" · "+(n.group||"")));
        n.hit=hit;
        this.nodeLayer.append(g);
        n.elem=g;n.text=text;n.body=circle;
        this.listen(g,"pointerdown",e=>this.pointerDown(e,n));
        this.listen(g,"pointerenter",()=>this.hover(n.id));
        this.listen(g,"pointerleave",()=>{if(!this.drag)this.hover(null)});
        this.listen(g,"keydown",e=>{
          if(e.key==="Enter"||e.key===" "){
            e.preventDefault();this.config.onNode(n.id);
          }
        });
      }
      this.listen(this.svg,"pointerdown",e=>{
        if(this.dense && e.target===this.svg && e.isPrimary && e.button===0){
          this.blankDown={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};
        }
      },true);
      this.listen(this.svg,"pointermove",e=>{
        this.pointerMove(e);
        if(this.blankDown && this.blankDown.id===e.pointerId &&
           Math.hypot(e.clientX-this.blankDown.x,e.clientY-this.blankDown.y)>5)
          this.blankDown.moved=true;
      });
      this.listen(this.svg,"pointerup",e=>{
        if(this.dense && this.blankDown && this.blankDown.id===e.pointerId &&
           !this.blankDown.moved && !this.drag){
          const nearest=this.nearestEdge(this.svgPoint(e));
          if(nearest){
            const group=this.pairs.get(nearest.key)||[nearest.relation];
            if(group.length>1 && typeof this.config.onPair==="function")
              this.config.onPair(group);
            else this.config.onEdge(nearest.relation);
          }
        }
        this.blankDown=null;
        this.pointerUp(e);
      });
      this.listen(this.svg,"pointercancel",e=>{this.blankDown=null;this.pointerUp(e)});
      this.listen(this.svg,"lostpointercapture",e=>{this.blankDown=null;this.pointerUp(e)});
      this.updateSelection(config);
      this.draw();
    }
    mountCanvas(){
      const host=this.svg.parentElement;
      if(!host)return;
      const canvas=document.createElement("canvas");
      canvas.className="force-edge-canvas";
      canvas.setAttribute("aria-hidden","true");
      host.insertBefore(canvas,this.svg);
      this.canvas=canvas;
      this.ctx=canvas.getContext("2d",{alpha:true});
      if(!this.ctx){
        canvas.remove();this.canvas=null;
        this.dense=false;
        return;
      }
      // Respond to both responsive container changes and pan/zoom viewBox changes.
      if("ResizeObserver" in window){
        this.resizeObserver=new ResizeObserver(()=>this.drawCanvas());
        this.resizeObserver.observe(this.svg);
      }else this.listen(window,"resize",()=>this.drawCanvas());
      this.viewObserver=new MutationObserver(()=>this.drawCanvas());
      this.viewObserver.observe(this.svg,{attributes:true,attributeFilter:["viewBox"]});
    }
    drawCanvas(){
      if(!this.canvas||!this.ctx||!this.active)return;
      const rect=this.svg.getBoundingClientRect();
      const width=rect.width,height=rect.height;
      if(width<2||height<2)return;
      const ratio=Math.min(2,window.devicePixelRatio||1);
      const pw=Math.max(1,Math.round(width*ratio)),ph=Math.max(1,Math.round(height*ratio));
      if(this.canvas.width!==pw||this.canvas.height!==ph){
        this.canvas.width=pw;this.canvas.height=ph;
      }
      const ctx=this.ctx;
      ctx.setTransform(ratio,0,0,ratio,0,0);
      ctx.clearRect(0,0,width,height);
      const v=this.svg.viewBox.baseVal;
      const scale=Math.min(width/v.width,height/v.height);
      const ox=(width-v.width*scale)/2,oy=(height-v.height*scale)/2;
      ctx.translate(ox,oy);ctx.scale(scale,scale);ctx.translate(-v.x,-v.y);
      ctx.lineJoin="round";ctx.lineCap="round";
      const focus=this.hoverId?this.byId.get(this.hoverId):null;
      const selected=this.config.selectedId?
        this.edges.find(e=>e.relation.relation_id===this.config.selectedId):null;
      const selectedPair=selected?.key;
      function trace(edge){
        const u=edge.source,v=edge.target;
        if(u===v){
          const r=u.radius+19;
          ctx.moveTo(u.x,u.y-r/2);
          ctx.bezierCurveTo(u.x+r*2,u.y-r*2,u.x+r*2,u.y+r*2,u.x,u.y+r/2);
        }else{
          const dx=v.x-u.x,dy=v.y-u.y,len=Math.hypot(dx,dy)||1;
          ctx.moveTo(u.x,u.y);
          ctx.quadraticCurveTo((u.x+v.x)/2-dy/len*edge.offset,
                               (u.y+v.y)/2+dx/len*edge.offset,v.x,v.y);
        }
      }
      // Batch ordinary links into one path: thousands of edges, one stroke.
      ctx.beginPath();
      for(const e of this.springs){
        if(e.key===selectedPair)continue;
        if(focus && (e.source===focus||e.target===focus))continue;
        trace(e);
      }
      ctx.strokeStyle=focus?"rgba(111,163,164,.045)":
        scale<.56?"rgba(124,178,171,.135)":"rgba(124,178,171,.19)";
      // Subpixel strokes vanished on narrow screens; maintain a visible hairline.
      ctx.lineWidth=Math.max(.95,.82/scale);ctx.stroke();
      if(focus){
        ctx.beginPath();
        for(const e of this.springs)if(e.source===focus||e.target===focus)trace(e);
        ctx.strokeStyle="rgba(236,197,131,.86)";
        ctx.lineWidth=1.65;ctx.stroke();
      }
      if(selectedPair){
        ctx.beginPath();
        for(const e of this.springs)if(e.key===selectedPair)trace(e);
        ctx.strokeStyle="#ffdda1";ctx.lineWidth=2.6;ctx.stroke();
      }
    }
    nearestEdge(p){
      // Hit test only on pointer-up, never during continuous simulation frames.
      // Approximate quadratic curves with short line segments and a zoom-aware radius.
      const rect=this.svg.getBoundingClientRect(),v=this.svg.viewBox.baseVal;
      const pxPerUnit=Math.min(rect.width/v.width,rect.height/v.height);
      const threshold=Math.min(13,8/Math.max(.3,pxPerUnit));
      let best=null,bestD=threshold*threshold;
      function distance2(ax,ay,bx,by,x,y){
        const dx=bx-ax,dy=by-ay,m=dx*dx+dy*dy||1;
        const t=clamp(((x-ax)*dx+(y-ay)*dy)/m,0,1);
        const ex=ax+t*dx-x,ey=ay+t*dy-y;
        return ex*ex+ey*ey;
      }
      for(const e of this.springs){
        const a=e.source,b=e.target;
        if(a===b)continue;
        const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
        const cx=(a.x+b.x)/2-dy/len*e.offset,cy=(a.y+b.y)/2+dx/len*e.offset;
        let ox=a.x,oy=a.y;
        for(let i=1;i<=5;i++){
          const t=i/5,mt=1-t;
          const x=mt*mt*a.x+2*mt*t*cx+t*t*b.x;
          const y=mt*mt*a.y+2*mt*t*cy+t*t*b.y;
          const d=distance2(ox,oy,x,y,p.x,p.y);
          if(d<bestD){bestD=d;best=e}
          ox=x;oy=y;
        }
      }
      return best;
    }
    updateSelection(config){
      this.config=config;
      for(const n of this.nodes){
        n.selected=n.id===config.focusId;
        n.radius=this.radiusOf(n.degree,n.selected);
        n.body.setAttribute("r",String(n.radius));
        n.hit.setAttribute("r",String(Math.max(15,n.radius+7)));
        n.body.setAttribute("stroke",n.selected?"#f1d39b":"#d2e2dc");
        n.body.setAttribute("stroke-width",n.selected?"2.5":"1");
        n.text.setAttribute("y",String(n.radius+15));
        n.text.classList.toggle("is-quiet",!(n.featured||n.selected));
        n.elem.classList.toggle("is-selected",n.selected);
      }
      for(const edge of this.edges){
        const selected=edge.relation.relation_id===config.selectedId;
        edge.line?.classList.toggle("is-selected",selected);
        edge.hit?.classList.toggle("is-selected",selected);
      }
      this.hover(null);
      if(this.dense)this.drawCanvas();
    }
    svgPoint(e){
      const pt=this.svg.createSVGPoint();
      pt.x=e.clientX;pt.y=e.clientY;
      const matrix=this.svg.getScreenCTM();
      if(matrix)return pt.matrixTransform(matrix.inverse());
      const r=this.svg.getBoundingClientRect(),v=this.svg.viewBox.baseVal;
      return{x:v.x+(e.clientX-r.left)*v.width/r.width,
             y:v.y+(e.clientY-r.top)*v.height/r.height};
    }
    pointerDown(e,node){
      if(e.button!==0||!e.isPrimary)return;
      e.stopPropagation();e.preventDefault();
      const at=this.svgPoint(e);
      this.drag={node,id:e.pointerId,startX:e.clientX,startY:e.clientY,
                 dx:node.x-at.x,dy:node.y-at.y,moved:false};
      node.vx=0;node.vy=0;
      // Move first, then capture: reordering after capture may cancel drag in browsers.
      this.nodeLayer.appendChild(node.elem);
      node.elem.setPointerCapture(e.pointerId);
      this.svg.classList.add("is-grabbing");
      node.elem.classList.add("is-dragging");
      this.alpha=Math.max(this.alpha,.55);
      this.run();
    }
    pointerMove(e){
      const drag=this.drag;
      if(!drag||drag.id!==e.pointerId)return;
      const p=this.svgPoint(e);
      drag.node.x=clamp(p.x+drag.dx,PAD,W-PAD);
      drag.node.y=clamp(p.y+drag.dy,PAD,H-PAD);
      drag.node.vx=drag.node.vy=0;
      if(Math.hypot(e.clientX-drag.startX,e.clientY-drag.startY)>5)drag.moved=true;
      this.alpha=Math.max(this.alpha,.28);
      this.draw();
    }
    pointerUp(e){
      const drag=this.drag;if(!drag||e.pointerId!==drag.id)return;
      this.drag=null;
      drag.node.elem.classList.remove("is-dragging");
      this.svg.classList.remove("is-grabbing");
      if(drag.node.elem.hasPointerCapture(e.pointerId))
        drag.node.elem.releasePointerCapture(e.pointerId);
      if(!drag.moved)this.config.onNode(drag.node.id);
      else{
        this.alpha=Math.max(.7,this.alpha);
        this.run();
      }
    }
    hover(id){
      this.hoverId=id;
      const node=id?this.byId.get(id):null;
      const linked=new Set(node?[id]:[]);
      if(node)for(const e of this.edges)if(e.source===node||e.target===node){
        linked.add(e.source.id);linked.add(e.target.id);
      }
      for(const n of this.nodes){
        const neighbour=!!node && linked.has(n.id);
        n.elem.classList.toggle("is-muted",!!node&&!neighbour);
        n.elem.classList.toggle("is-neighbour",!!node&&neighbour);
        n.elem.classList.toggle("is-hovered",n.id===id);
      }
      for(const e of this.edges){
        const related=!!node&&(e.source===node||e.target===node);
        e.line?.classList.toggle("is-muted",!!node&&!related);
        e.line?.classList.toggle("is-neighbour",related);
        e.hit?.classList.toggle("is-neighbour",related);
      }
      if(this.dense)this.drawCanvas();
    }
    tick(){
      const n=this.nodes.length;if(!n)return;
      const a=this.alpha,tree=repulsionTree(this.nodes);
      const power=(n>175?1220:n>60?1440:1700)*a;
      for(const node of this.nodes)applyRepulsion(node,tree,power);
      const rest=n>170?63:n>75?90:n>25?112:156;
      for(const edge of this.springs){
        const u=edge.source,v=edge.target;
        if(u===v)continue;
        const dx=v.x-u.x,dy=v.y-u.y,dist=Math.hypot(dx,dy)||.01;
        const same=u.group===v.group;
        const ideal=rest*(same?.81:1.12)*(u.degree>16||v.degree>16?1.12:1);
        const strength=(same?.013:.010)*a;
        const f=clamp((dist-ideal)*strength,-8,8);
        const fx=dx/dist*f,fy=dy/dist*f;
        u.vx+=fx;u.vy+=fy;v.vx-=fx;v.vy-=fy;
      }
      for(const node of this.nodes){
        const grp=this.groupCenters.get(node.group||"未分类");
        // Rectangular, 2-D anchors instead of a radial shell.
        if(grp && n>18){
          node.vx+=(grp.x-node.x)*.0008*a;
          node.vy+=(grp.y-node.y)*.0008*a;
        }
        node.vx+=(W/2-node.x)*.0019*a;
        node.vy+=(H/2-node.y)*.0019*a;
      }
      collisions(this.nodes,n>160?9:n>70?12:15);
      for(const node of this.nodes){
        if(this.drag?.node===node)continue;
        node.vx=clamp(node.vx*.68,-8.5,8.5);
        node.vy=clamp(node.vy*.68,-8.5,8.5);
        node.x=clamp(node.x+node.vx,PAD,W-PAD);
        node.y=clamp(node.y+node.vy,PAD,H-PAD);
      }
      this.alpha*=.972;
      this.iterations++;
    }
    draw(){
      if(!this.active)return;
      for(const n of this.nodes){
        n.elem.setAttribute("transform","translate("+n.x.toFixed(2)+" "+n.y.toFixed(2)+")");
      }
      if(this.dense){this.drawCanvas();return}
      for(const edge of this.edges){
        const u=edge.source,v=edge.target;
        let d;
        if(u===v){
          const x=u.x,y=u.y,r=u.radius+19;
          d="M"+x.toFixed(1)+" "+(y-r/2).toFixed(1)+
            " C"+(x+r*2).toFixed(1)+" "+(y-r*2).toFixed(1)+
            " "+(x+r*2).toFixed(1)+" "+(y+r*2).toFixed(1)+
            " "+x.toFixed(1)+" "+(y+r/2).toFixed(1);
        }else{
          const mx=(u.x+v.x)/2,my=(u.y+v.y)/2;
          const dx=v.x-u.x,dy=v.y-u.y,len=Math.hypot(dx,dy)||1;
          const ox=-dy/len*edge.offset,oy=dx/len*edge.offset;
          d="M"+u.x.toFixed(1)+" "+u.y.toFixed(1)+
            " Q"+(mx+ox).toFixed(1)+" "+(my+oy).toFixed(1)+
            " "+v.x.toFixed(1)+" "+v.y.toFixed(1);
        }
        edge.line.setAttribute("d",d);
        edge.hit.setAttribute("d",d);
      }
    }
    run(){
      if(!this.active||this.raf||(!this.visible&&!this.drag))return;
      this.raf=requestAnimationFrame(()=>{
        this.raf=0;
        if(!this.active)return;
        if(this.visible||this.drag){
          const size=this.nodes.length;
          const passes=size>170?1:this.iterations<50?3:this.iterations<120?2:1;
          for(let j=0;j<passes;j++)this.tick();
          const now=Date.now();
          if(size<170||now-this.lastDraw>=28||this.alpha<=.016){
            this.draw();this.lastDraw=now;
          }
        }
        if(this.alpha>.016||this.drag)this.run();
      });
    }
    rearrange(){
      this.nodes.forEach((n,i)=>{
        const k=i+11+(hash(this.bookId)%101);
        n.x=90+halton(k,3)*710;
        n.y=65+halton(k,2)*490;
        n.vx=n.vy=0;
      });
      this.alpha=.95;this.iterations=0;this.draw();this.run();
    }
    destroy(){
      this.active=false;cancelAnimationFrame(this.raf);this.raf=0;
      this.observer?.disconnect();
      this.viewObserver?.disconnect();
      this.svg.classList.remove("is-dense");
      this.resizeObserver?.disconnect();
      if(this.canvas){this.canvas.remove();this.canvas=null}
      for(const n of this.nodes)previous.set(n.id,{x:n.x,y:n.y});
      for(const cleanup of this.cleanups)cleanup();
      this.cleanups=[];
      if(this.drag){
        try{if(this.drag.node.elem.hasPointerCapture(this.drag.id))
          this.drag.node.elem.releasePointerCapture(this.drag.id)}catch{}
      }
      this.drag=null;
    }
  }
  return {
    render(config){
      if(previousBook!==config.bookId){
        current?.destroy();current=null;
        previous.clear();previousBook=config.bookId;
      }
      const signature=config.bookId+"|"+
        config.nodes.map(n=>n.id).join(",")+"|"+
        config.links.map(e=>e.relation_id).join(",");
      if(current?.signature===signature && current.svg===config.svg){
        current.updateSelection(config);
        return;
      }
      current?.destroy();
      current=new Simulation(config,signature);
    },
    clear(){
      if(current){current.destroy();current=null}
    },
    rearrange(){current?.rearrange()},
    resetBook(){current?.destroy();current=null;previous.clear();previousBook=null},
    inspect(){
      if(!current)return null;
      return{nodes:current.nodes.length,links:current.edges.length,alpha:current.alpha,
        positions:current.nodes.map(n=>({id:n.id,x:n.x,y:n.y}))};
    }
  };
})();