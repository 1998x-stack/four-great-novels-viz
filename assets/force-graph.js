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
    const cellSize=space*1.2;
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
          if(a!==activeDrag()) {a.x-=nx;a.y-=ny}
          if(b!==activeDrag()) {b.x+=nx;b.y+=ny}
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
        for(let k=0;k<120;k++)this.tick();
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
      for(const r of config.links){
        if(degrees.has(r.subject_id))degrees.set(r.subject_id,degrees.get(r.subject_id)+1);
        if(degrees.has(r.object_id))degrees.set(r.object_id,degrees.get(r.object_id)+1);
      }
      const ranked=[...config.nodes].sort((a,b)=>
        (degrees.get(b.id)||0)-(degrees.get(a.id)||0)||a.id.localeCompare(b.id));
      const budget=n<=34?n:n<=85?35:n<=180?28:23;
      const featured=new Set(ranked.slice(0,budget).map(v=>v.id));
      const palette=config.palette;
      const centerShift=hash(this.bookId||"novels")%250;
      const sorted=[...config.nodes].sort((a,b)=>a.id.localeCompare(b.id));
      sorted.forEach((entry,i)=>{
        const prev=previous.get(entry.id);
        const seed=centerShift+i+11;
        const x=prev?.x??(85+halton(seed,2)*730);
        const y=prev?.y??(65+halton(seed,3)*490);
        const selected=entry.id===config.focusId;
        const radius=selected?13:n>140?5.5:n>50?7:9;
        const node={
          ...entry,x,y,vx:0,vy:0,radius,degree:degrees.get(entry.id)||0,
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
      const pairCount=new Map(),pairIndex=new Map();
      const active=[];
      for(const r of config.links){
        const a=this.byId.get(r.subject_id),b=this.byId.get(r.object_id);
        if(!a||!b)continue;
        const key=[a.id,b.id].sort().join("|");
        pairCount.set(key,(pairCount.get(key)||0)+1);
        active.push({source:a,target:b,relation:r,key});
      }
      for(const item of active){
        const i=pairIndex.get(item.key)||0;pairIndex.set(item.key,i+1);
        const total=pairCount.get(item.key);
        item.offset=(i-(total-1)/2)*Math.min(15,48/Math.max(1,total));
        const line=element("path",{class:"force-edge-line",fill:"none","pointer-events":"none"});
        const hit=element("path",{
          class:"force-edge-hit",fill:"none",stroke:"transparent",
          "stroke-width":11,role:"button",tabindex:active.length>180?-1:0,
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
        g.append(circle,text,element("title",{},n.name+" · "+(n.group||"")));
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
      this.listen(this.svg,"pointermove",e=>this.pointerMove(e));
      this.listen(this.svg,"pointerup",e=>this.pointerUp(e));
      this.listen(this.svg,"pointercancel",e=>this.pointerUp(e));
      this.listen(this.svg,"lostpointercapture",e=>this.pointerUp(e));
      this.updateSelection(config);
      this.draw();
    }
    updateSelection(config){
      this.config=config;
      for(const n of this.nodes){
        n.selected=n.id===config.focusId;
        n.radius=n.selected?13:this.nodes.length>140?5.5:this.nodes.length>50?7:9;
        n.body.setAttribute("r",String(n.radius));
        n.body.setAttribute("stroke",n.selected?"#f1d39b":"#d2e2dc");
        n.body.setAttribute("stroke-width",n.selected?"2.5":"1");
        n.text.setAttribute("y",String(n.radius+15));
        n.text.classList.toggle("is-quiet",!(n.featured||n.selected));
        n.elem.classList.toggle("is-selected",n.selected);
      }
      for(const edge of this.edges){
        const selected=edge.relation.relation_id===config.selectedId;
        edge.line.classList.toggle("is-selected",selected);
        edge.hit.classList.toggle("is-selected",selected);
      }
      this.hover(null);
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
      this.svg.setPointerCapture(e.pointerId);
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
      if(this.svg.hasPointerCapture(e.pointerId))this.svg.releasePointerCapture(e.pointerId);
      if(!drag.moved)this.config.onNode(drag.node.id);
      else{
        this.alpha=Math.max(.7,this.alpha);
        this.run();
      }
    }
    hover(id){
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
        e.line.classList.toggle("is-muted",!!node&&!related);
        e.line.classList.toggle("is-neighbour",related);
        e.hit.classList.toggle("is-neighbour",related);
      }
    }
    tick(){
      const n=this.nodes.length;if(!n)return;
      const a=this.alpha,tree=repulsionTree(this.nodes);
      const power=(n>175?1220:n>60?1440:1700)*a;
      for(const node of this.nodes)applyRepulsion(node,tree,power);
      const rest=n>170?63:n>75?90:n>25?112:156;
      for(const edge of this.edges){
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
          const passes=this.iterations<50?3:this.iterations<120?2:1;
          for(let j=0;j<passes;j++)this.tick();
          this.draw();
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
      for(const n of this.nodes)previous.set(n.id,{x:n.x,y:n.y});
      for(const cleanup of this.cleanups)cleanup();
      this.cleanups=[];
      if(this.drag){
        try{if(this.svg.hasPointerCapture(this.drag.id))this.svg.releasePointerCapture(this.drag.id)}catch{}
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