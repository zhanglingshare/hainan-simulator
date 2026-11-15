/* Hainan 10 research experiences, V2.0. Zero external dependencies. */
(function(){
"use strict";
const M=window.HainanModel,R=window.HainanResearch;
if(!M||!R){document.getElementById("page-content").innerHTML="<p>研究模块加载失败，请重新打开。</p>";return;}
const $=id=>document.getElementById(id),page=document.body.dataset.page,esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=(x,n=1)=>Number(x).toLocaleString("zh-CN",{minimumFractionDigits:n,maximumFractionDigits:n});
const signed=(x,n=1)=>(x>0?"+":"")+fmt(x,n);
const K="HAINAN_V2_SCENARIO",S="HAINAN_V2_ARCHIVE",Q="HAINAN_V2_QUESTIONS",SEED=20261116;
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}};
const put=(key,v)=>{try{localStorage.setItem(key,JSON.stringify(v));return true;}catch{return false;}};
const scenario=()=>M.sanitize(read(K,M.PRESETS.neutral));
const F={year:2025,compareYear:2020,selectedSignal:0,guessed:null,layer:"all",node:"port",removed:"none",intensity:.42,rounds:3,sector:"trade",
 val:{lower:20,upper:80,vlow:25,vhigh:70},world:scenario(),pressure:{industrial:4,services:4.5,agri:3,shock:0,target:10000},challenge:0,archiveLeft:0,archiveRight:1};
const SOURCES=R.SOURCES;
function sourceLink(key,label="原始来源 ↗"){const s=SOURCES[key];return s?'<a href="'+s+'" target="_blank" rel="noopener noreferrer" class="source">'+label+'</a>':"";}
function chip(label,tier="h"){return '<span class="chip '+tier.toLowerCase()+'">'+esc(label)+'</span>';}
function metric(label,value,context="",tone=""){return '<div class="metric"><small>'+esc(label)+'</small><strong class="'+tone+'">'+esc(value)+'</strong><span>'+esc(context)+'</span></div>';}
function title(label,head,desc=""){return '<div class="section-top"><div><span class="kicker">'+label+'</span><h2>'+head+'</h2></div>'+(desc?'<p>'+desc+'</p>':"")+'</div>';}
function panel(head,html,cls=""){return '<section class="panel '+cls+'"><h2>'+head+'</h2>'+html+'</section>';}
function button(text,act,cls="secondary",extra=""){return '<button type="button" class="btn '+cls+'" data-act="'+act+'" '+extra+'>'+text+'</button>';}
function tabs(items,current,action){return '<div class="tabs" role="group">'+items.map(i=>'<button type="button" class="tab '+(i[0]===current?"active":"")+'" data-act="'+action+'" data-v="'+esc(i[0])+'">'+esc(i[1])+'</button>').join("")+'</div>';}
function range(label,id,value,min,max,step="1",suffix=""){return '<div class="range"><div class="range-header"><label for="'+id+'">'+label+'</label><output id="'+id+'Out">'+fmt(value,String(step).includes(".")?1:0)+suffix+'</output></div><input class="slider" type="range" id="'+id+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+value+'" data-range="'+id+'"><div class="range-foot"><span>'+min+suffix+'</span><span>'+max+suffix+'</span></div></div>';}
function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove("show"),2600);}
function xlink(url,text){return '<a class="source" href="'+url+'" target="_blank" rel="noopener noreferrer">'+text+'</a>';}
function note(text){return '<div class="evidence-note">'+text+'</div>';}
function apply(html){$("page-content").innerHTML=html;}
function interpolateSvg(view,series,keys,colors,opts={}){
 const W=800,H=330,L=72,R=39,T=25,B=288,all=series.flatMap(row=>keys.map(k=>row[k])),lo=opts.floor??Math.min(...all)*.93,hi=Math.max(...all)*1.08;
 const x=i=>L+i/(series.length-1)*(W-L-R),y=v=>B-(v-lo)/(hi-lo)*(B-T);
 let z="";
 for(let i=0;i<5;i++){const v=lo+(hi-lo)*i/4;z+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="#537387" stroke-opacity=".35" stroke-dasharray="4 7"/><text x="'+(L-8)+'" y="'+(y(v)+4)+'" text-anchor="end" fill="#a4baca" font-size="11">'+fmt(v,0)+'</text>';}
 series.forEach((row,i)=>z+='<text x="'+x(i)+'" y="320" text-anchor="middle" fill="#a9c4d0" font-size="12">'+(row.year||row.label)+'</text>');
 keys.forEach((k,j)=>{
  const p=series.map((row,i)=>(i?"L":"M")+x(i)+" "+y(row[k])).join(" ");
  z+='<path d="'+p+'" fill="none" stroke="'+colors[j]+'" stroke-width="'+(j===0?4:3)+'" stroke-linejoin="round"/>';
  series.forEach((row,i)=>z+='<circle cx="'+x(i)+'" cy="'+y(row[k])+'" r="'+(i===series.length-1?5:3.5)+'" fill="'+colors[j]+'"><title>'+esc(row.year||row.label)+" "+fmt(row[k],1)+'</title></circle>');
 });
 z+='<text x="'+L+'" y="14" font-size="11" fill="#9bb9c9">'+esc(opts.unit||"亿元 · 当年公布的现价增加值")+'</text>';
 return '<svg class="svg-chart" role="img" aria-label="'+esc(view)+'" viewBox="0 0 '+W+' '+H+'">'+z+'</svg>';
}
function percentbar(values,labels,colors){const tot=values.reduce((a,b)=>a+b,0);return '<div class="stacked">'+values.map((v,i)=>'<span style="width:'+(100*v/tot)+'%;background:'+colors[i]+'" title="'+labels[i]+' '+fmt(v/tot*100,1)+'%"></span>').join("")+'</div><div class="legend">'+values.map((v,i)=>'<span><i style="background:'+colors[i]+'"></i>'+labels[i]+' '+fmt(100*v/tot,1)+'%</span>').join("")+'</div>';}
const C=["#70d4b5","#82bcfa","#f2bd80"];
function saveWorld(){
 const v=F.world,r=M.simulate(v,{seed:SEED,draws:400});let arr=read(S,[]);
 const entry={id:Date.now().toString(36)+Math.floor(Math.random()*1e6).toString(36),created:new Date().toISOString(),version:"HAINAN-V2.0",modelVersion:M.VERSION,
 evidenceVersion:"2025_2026Q3_INIT",seed:SEED,draws:400,controls:v,p50:r.finish.p50,p10:r.finish.p10,p90:r.finish.p90,note:"条件演示，无政策因果识别"};
 arr.unshift(entry);arr=arr.slice(0,25);
 if(put(S,arr)){put(K,v);toast("已保存研究条件与模型版本");}else toast("当前浏览器禁止保存");
}
function archiveQuestion(q){const list=read(Q,[]);list.unshift({date:new Date().toISOString(),question:q});put(Q,list.slice(0,30));toast("已存入研究档案：待核验问题");}
function guessSection(){
 const metrics=[
 ["规上工业增加值","+9.9%","2025全年"],
 ["固定资产投资","−16.5%","2025全年"],
 ["货物进出口","+55.2%","2026年1—8月"],
 ["规上工业增加值","−6.2%","2026年1—8月"]
 ];
 const prompts=[
 {question:"2025年工业增长9.9%，意味着第二产业增加值也增长9.9%吗？",choices:["完全相同","不一定，统计对象不同"],correct:1,reason:"第二产业包含建筑业。2025第二产业不变价增长1.0%，建筑业下降10.4%；规上工业的统计总体不同。",src:"year"},
 {question:"2026年1—8月进出口增长55.2%，能推断岛内服务增加值增长55.2%吗？",choices:["可以，货物进入就是GDP","不可以，贸易总额不是本地增加值"],correct:1,reason:"货物贸易是出入境货值，不是本地创造的增加值。需要生产/采购/结算归属证据。",src:"latest"},
 {question:"游客总花费增长10.5%，所有商户利润就都增长吗？",choices:["会同步增长","不能推出，成本和利润是另一组变量"],correct:1,reason:"游客花费经过企业成本、支付、平台费用和劳动收入等分配，不能代替利润。",src:"year"}
 ];
 const p=prompts[F.selectedSignal%prompts.length];
 return title("REALITY / CONTRADICTION","先判断，再揭晓","从真实数字里训练直觉，而不是先读一篇长报告")+
 '<div class="grid cols4">'+metrics.map((m,i)=>'<button class="metric metric-button" type="button" data-act="signal" data-v="'+(i%3)+'"><small>'+m[2]+' · '+m[0]+'</small><strong class="'+(m[1].includes("−")?"down":"up")+'">'+m[1]+'</strong><span>点击追问 ↗</span></button>').join("")+'</div>'+
 '<div class="layout-wide" style="margin-top:16px"><section class="panel glow"><span class="kicker">先猜后揭 · '+(F.selectedSignal%3+1)+"/3</span>"+'<div class="big-question" style="margin:12px 0 18px">'+p.question+'</div>'+
 '<div class="buttons">'+p.choices.map((c,i)=>button(c,"guess","secondary",'data-v="'+i+'"')).join("")+'</div>'+
 (F.guessed===null?'<p class="notice" style="margin-top:20px">先做一个判断，系统才展示理由。研究从允许自己犯错开始。</p>':note('<b>'+(F.guessed===p.correct?"判断正确。":"你的直觉值得挑战。")+'</b> '+p.reason+' '+sourceLink(p.src)))+
 '</section><aside class="panel"><span class="kicker">事实不是因果</span><h2>同一时间窗，不同统计总体</h2><p>2026年1—8月，规上工业下降6.2%，货物进出口金额增长55.2%。</p>'+
 '<div class="contrast"><div><small>工业增加值</small><div class="value-big rose">−6.2%</div></div><div><small>贸易金额</small><div class="value-big cyan">+55.2%</div></div></div>'+
 '<p class="notice" style="margin-top:15px">这里没有算出“失去的价值”。它只告诉我们下一步应追踪哪条产业关系。</p>'+sourceLink("latest")+'</aside></div>'+
 title("NEXT / ONE CLICK","选择你的下一步")+
 '<div class="grid cols3">'+[
 ["六年产业史","你认为海南产业重心一直没变？","history.html"],
 ["全息产业关系","外贸增长会影响谁？","network.html"],
 ["机制反证","如果我的解释是错的？","blindspots.html"]
 ].map(x=>'<a class="panel soft" style="text-decoration:none" href="./'+x[2]+'"><h3>'+x[0]+' ↗</h3><p>'+x[1]+'</p></a>').join("")+'</div>';
}
function historyPage(){
 const h=R.history(),row=h.rows.find(x=>x.year===F.year),early=h.rows.find(x=>x.year===F.compareYear);
 const table=h.rows.map(z=>'<tr><td>'+z.year+'</td><td>'+fmt(z.gdp,2)+'</td><td>'+fmt(z.shares[0],1)+'%</td><td>'+fmt(z.shares[1],1)+'%</td><td>'+fmt(z.shares[2],1)+'%</td><td>'+sourceLink(z.source==="y2025"?"year":z.source,"统计公报 ↗")+'</td></tr>').join("");
 const grap=h.rows.map(x=>({year:x.year,primary:x.sectors[0],secondary:x.sectors[1],tertiary:x.sectors[2]}));
 return title("2020—2025 / COMPOSITION","每一年都是真实统计，但不是同一修订版本")+
 '<div class="panel glow">'+tabs(h.rows.map(x=>[String(x.year),String(x.year)]),String(F.year),"year")+
 '<div class="grid cols3" style="margin:14px 0">'+
 [0,1,2].map(i=>metric(M.SECTOR_NAMES[i],fmt(row.sectors[i],1)+"亿元","结构份额 "+fmt(row.shares[i],1)+"%",["up","",""][i])).join("")+'</div>'+
 percentbar(row.sectors,M.SECTOR_NAMES,C)+
 '<p class="notice" style="margin:15px 0 0">年份选择只表示当年公布的现价结构；不构成价格不变的行业增长贡献。</p></div>'+
 title("CHANGE / SIX YEARS","分行业现价增加值变化","读曲线，不必猜GDP增长原因")+
 '<div class="layout-wide"><section class="panel">'+interpolateSvg("海南2020—2025三次产业现价增加值",grap,["primary","secondary","tertiary"],C)+
 '<div class="legend">'+M.SECTOR_NAMES.map((x,i)=>'<span><i style="background:'+C[i]+'"></i>'+x+'</span>').join("")+'</div></section>'+
 '<aside class="panel"><span class="kicker">STRUCTURAL DISTANCE</span><h2>两年的产业组合，距离多远？</h2><label for="compareYear" class="notice">对比基准年份</label><select id="compareYear" class="select">'+h.rows.map(x=>'<option value="'+x.year+'" '+(x.year===F.compareYear?"selected":"")+'>'+x.year+'</option>').join("")+'</select>'+
 '<div class="value-big cyan" style="margin:18px 0">'+fmt(R.jsd(early.sectors,row.sectors),3)+'</div><p>三次产业组合的 Jensen-Shannon 距离（0为相同）。它不是GDP增长率、产业竞争力评分或地理距离。</p>'+
 note('尚未统一历史最终核实版本。对跨年度绝对差额及结构跳变的解释必须审慎。')+'</aside></div>'+
 title("AUDIT / YEAR-BY-YEAR","六年事实账本")+'<div class="panel" style="overflow-x:auto"><table class="matrix"><thead><tr><th>年份</th><th>GDP现价/亿元</th><th>第一产业</th><th>第二产业</th><th>第三产业</th><th>来源</th></tr></thead><tbody>'+table+'</tbody></table></div>';
}
function networkSvg(r){
 const selected=F.node,chosen=R.NODES.find(n=>n.id===selected);
 let s='<defs><radialGradient id="bg"><stop stop-color="#227f8960"/><stop offset="1" stop-color="#0c243800"/></radialGradient></defs><ellipse cx="390" cy="280" rx="345" ry="250" fill="url(#bg)"/>';
 for(let i=0;i<R.EDGES.length;i++){const e=R.EDGES[i];if(F.layer!=="all"&&e.layer!==F.layer)continue;
  const a=R.NODES.find(x=>x.id===e.from),b=R.NODES.find(x=>x.id===e.to);
  const hl=e.from===selected||e.to===selected,cut=F.removed===e.id;
  const mx=(a.x+b.x)/2,my=(a.y+b.y)/2+((i%2)?24:-24);
  s+='<path class="edge '+(hl?"highlight":"")+' '+(cut?"cut":"")+'" d="M'+a.x+' '+a.y+' Q'+mx+' '+my+' '+b.x+' '+b.y+'"><title>'+esc(e.label)+(cut?" · 假设边已删除":" · 尚未实测")+'</title></path>';
 }
 for(const n of R.NODES){const chosen=n.id===selected,related=r.edges.some(e=>(e.from===selected&&e.to===n.id)||(e.to===selected&&e.from===n.id));s+='<g class="node '+(chosen?"active":related?"":"dim")+'" data-node="'+n.id+'" tabindex="0" role="button" aria-label="选中'+n.name+'"><circle cx="'+n.x+'" cy="'+n.y+'" r="31"/><text class="glyph" x="'+n.x+'" y="'+(n.y+8)+'">'+n.icon+'</text><text class="node-name" x="'+n.x+'" y="'+(n.y+48)+'">'+n.short+'</text></g>';}
 return '<svg class="network-svg" viewBox="0 0 790 540" role="group" aria-label="8个功能节点与18条假设产业关系层，点击可选择节点">'+s+'</svg>';
}
function networkPage(){
 const r=R.graph({layer:F.layer,start:F.node,remove:F.removed,intensity:F.intensity,rounds:F.rounds});
 const base=R.graph({layer:F.layer,start:F.node,remove:"none",intensity:F.intensity,rounds:F.rounds});
 const n=R.NODES.find(n=>n.id===F.node),cut=R.EDGES.find(e=>e.id===F.removed);
 const diff=Object.entries(base.exposure).map(([id,v])=>({id,delta:v-r.exposure[id]})).filter(x=>x.delta>1e-8).sort((a,b)=>b.delta-a.delta);
 return title("MULTIPLEX NETWORK / CANDIDATE","三层假设网络，分层看","节点是产业功能。连线仅代表研究问题，不是已证实的采购合同。")+
 '<div class="layout-wide"><section class="panel glow">'+tabs(Object.entries(R.LAYERS),F.layer,"layer")+'<div class="stage">'+networkSvg(r)+'</div>'+
 '<div class="legend">'+[["#8ce6d8","已选节点"],["#a8cee0","候选关系（H）"],["#ff879c","被删除的候选边"]].map(x=>'<span><i style="background:'+x[0]+'"></i>'+x[1]+'</span>').join("")+'</div></section>'+
 '<aside class="panel"><span class="kicker">RELATION INSPECTOR</span><div style="font-size:40px;margin-top:13px">'+n.icon+'</div><h2>'+n.name+'</h2><p>'+n.desc+'</p>'+
 '<div class="divider"></div><h3>当前连接</h3><div class="item-list">'+r.edges.filter(e=>e.from===F.node||e.to===F.node).map(e=>'<div class="item"><div><strong>'+e.label+'</strong><small>'+e.from+' → '+e.to+' · H级</small></div></div>').join("")+'</div>'+
 '<div class="divider"></div><h3>选择一条假设关系断开</h3><select class="select" id="removeEdge"><option value="none">不删除任何候选边</option>'+R.EDGES.filter(e=>F.layer==="all"||e.layer===F.layer).map(e=>'<option value="'+e.id+'" '+(e.id===F.removed?"selected":"")+'>'+e.label+'</option>').join("")+'</select>'+
 range("示意传导强度","intensity",F.intensity,0,.8,.05,"")+range("可达传播轮数","rounds",F.rounds,1,5,1,"")+
 note('图上的传播指数不是企业经济损失。真实投入产出矩阵缺失时禁止换算成GDP。')+'</aside></div>'+
 title("BEFORE / AFTER","断开前后，传播差多少？")+'<div class="layout-even"><div class="panel"><span class="kicker">BASELINE vs REMOVED</span><div class="contrast"><div><small>原假设图三轮内可达节点</small><div class="value-big blue">'+base.reached+'</div></div><div><small>改变后可达节点</small><div class="value-big cyan">'+r.reached+'</div></div></div><p class="notice" style="margin-top:14px">改变边的结果是结构可达性，不代表实际经济主体数。</p></div>'+
 '<div class="panel"><span class="kicker">SYNTHETIC EXPOSURE</span><h3>暴露减少最多的候选节点</h3>'+
 (diff.length?diff.slice(0,5).map(x=>'<div class="barrow"><span>'+R.NODES.find(n=>n.id===x.id).short+'</span><div class="bar"><i style="width:'+Math.min(100,x.delta/.4*100)+'%"></i></div><strong>−'+fmt(x.delta,3)+'</strong></div>').join(""):'<p class="notice">本次条件变化没有减少可测的示意暴露。尝试不同节点、图层或删边。</p>')+'</div></div>'+
 title("EMPIRICAL GATE","怎样把这张网变成真正的社会网络研究？")+
 '<div class="grid cols3">'+[
 ["边类型和方向","区分货物流、企业采购、人才流、信息流，不将它们混称。"],
 ["实际边权","至少需要时间、金额或流量、主体编码、采样覆盖率。"],
 ["动态验证","观察断裂前后真实行为，检查替代路径、遗漏边与统计偏差。"]
 ].map(z=>'<div class="panel soft"><h3>'+z[0]+'</h3><p>'+z[1]+'</p></div>').join("")+'</div>';
}
function sectorPage(){
 const a=R.CLUSTERS.find(x=>x.id===F.sector),matches=R.INDICATORS.filter(x=>x.source===a.source);
 const ladder=[
 ["可见事实",a.fact],["容易误解",a.value],["竞争性解释",a.competing[0]],["首先补的证据",a.need]
 ];
 return title("FIVE INDUSTRIES","五个真正不同的产业研究现场")+'<div class="card-switch">'+R.CLUSTERS.map(x=>'<button type="button" data-act="sector" data-v="'+x.id+'" class="sector-card '+(F.sector===x.id?"active":"")+'"><span class="emoji">'+x.icon+'</span><strong>'+x.title+'</strong><small>'+x.period+'</small></button>').join("")+'</div>'+
 '<div class="layout-wide" style="margin-top:17px"><section class="panel glow"><span class="kicker">THE SECTOR QUESTION</span><h2 style="font-size:clamp(23px,2.7vw,36px)">'+a.question+'</h2>'+
 '<div class="grid cols2">'+metric(a.period,a.fact,"公开统计观察，不等于产业绩效因果","")+
 metric("最容易忽略的口径","≠","增长、销售、利润、增加值不可混用","")+'</div>'+
 title("STRUCTURAL STORY","四步拆开一个产业问题")+'<div class="story-steps">'+ladder.map((x,i)=>'<div><small>0'+(i+1)+' '+x[0]+'</small><strong style="font-size:14px;margin-top:8px">'+x[1]+'</strong></div>').join("")+'</div>'+
 '<div class="divider"></div><h3>这条产业的三种竞争解释</h3>'+
 '<div class="item-list">'+a.competing.map((x,i)=>'<div class="item"><div><strong>'+x+'</strong><small>机制候选 '+String(i+1).padStart(2,"0")+' · 尚待真实证据鉴别</small></div></div>').join("")+'</div></section>'+
 '<aside class="panel"><span class="kicker">EVIDENCE DESK</span><h2>这些数字来自哪里？</h2>'+
 matches.slice(0,4).map(x=>'<div class="metric" style="margin-top:10px"><small>'+x.period+' · '+x.name+'</small><strong>'+signed(x.value,1)+x.unit+'</strong><span>'+x.type+' · '+x.tier+'级</span></div>').join("")+
 '<div class="divider"></div><h3>下一份最有价值的数据</h3><p>'+a.need+'</p>'+sourceLink(a.source)+
 '<div class="divider"></div>'+button("把这个问题存入研究档案","saveSector","primary",'data-v="'+a.id+'"')+'</aside></div>'+
 title("ROLE / STRUCTURE","海南的功能定位，不能用另一座岛的标准代替")+
 panel("从比较GDP，转向比较你在哪一层创造价值",'<p>海南与新加坡的产业结构、法律制度、贸易网络、人才储备和市场腹地不同。不能用港口吞吐或GDP一项指标决定谁“领先”。这里要问：海南的生产、服务、开放制度与岛内就业之间，哪些功能正在形成可验证的连接？</p>'+note('国际比较需要统一统计口径与可复核网络数据。当前项目不计算没有观测支持的跨岛排名。'),"soft");
}
function valueHeat(opts){
 const a=[],v=R.accounting(opts);for(let j=10;j>=0;j--)for(let i=0;i<=10;i++){const val=i*j;const l=Math.round(val/100*55+15);const color='hsl('+(172-val/3.5)+',62%,'+l+'%)';a.push('<button class="heatcell" type="button" data-act="valueCell" data-x="'+i*10+'" data-y="'+j*10+'" title="本地采购'+i*10+'%，增加值率'+j*10+'%，假设增加值'+val+'单位" style="background:'+color+'">'+(((i+j)%3===0)?val:"")+'</button>');}
 return '<div class="heatmap">'+a.join("")+'</div><div class="legend"><span>横向：本地采购比例从0到100%</span><span>纵向：增加值率从100%到0%</span></div>';
}
function valuePage(){
 const v=R.accounting(F.val),a=v.components;
 return title("LOCAL VALUE CAPTURE / PARTIAL IDENTIFICATION","没有真实采购数据，就不能发明留岛率")+
 '<div class="grid cols4">'+metric("采购预算","100单位","规范化账本，非人民币"),metric("假设本地采购支付",fmt(a.localPay,1),"无现实数据"),metric("假设本地服务增加值",fmt(a.value,1),"模型条件点值",""),metric("可能增加值区间",fmt(v.min,1)+"—"+fmt(v.max,1),"完全由你设置的边界决定")+'</div>'+
 '<div class="layout-wide" style="margin-top:17px"><section class="panel glow"><span class="kicker">IDENTIFICATION SURFACE</span><h2>121格价值留存可能空间</h2>'+valueHeat(F.val)+
 '<div class="divider"></div><h3>100单位采购支出，钱怎么分？</h3><div class="flowline"><span class="local" style="width:'+a.localPay+'%">'+fmt(a.localPay,0)+'</span><span class="other" style="width:'+a.external+'%">'+fmt(a.external,0)+'</span></div>'+
 '<div class="legend"><span><i style="background:var(--cyan)"></i>假设岛内采购 '+fmt(a.localPay,1)+'单位</span><span><i style="background:var(--gold)"></i>假设岛外采购 '+fmt(a.external,1)+'单位</span></div>'+
 note('本地采购支付不等于本地增加值。所谓“岛外采购”也不能自动定义为经济损失。')+'</section>'+
 '<aside class="panel"><span class="kicker">YOU SET THE BOUNDS</span><h2>收紧条件，观察识别集</h2>'+
 range("本地采购率下界（假设）","lower",F.val.lower,0,100,5,"%")+
 range("本地采购率上界（假设）","upper",F.val.upper,0,100,5,"%")+
 range("供应商增加值率下界（假设）","vlow",F.val.vlow,0,100,5,"%")+
 range("供应商增加值率上界（假设）","vhigh",F.val.vhigh,0,100,5,"%")+
 '<h3>当前部分识别宽度</h3><div class="value-big cyan">'+fmt(v.width,1)+'</div><p>单位/100单位采购。边界缩小是你手动加强了假设，不是我们的证据自动变好了。</p>'+
 button("恢复完全未知的[0,100]","valueUnknown","ghost")+'</aside></div>'+
 title("RESEARCH DATA / MISSING","给研究者的四项取证任务")+
 '<div class="grid cols4">'+[
 ["采购金额","制造企业服务采购总额、分行业拆分"],["采购所在地","真实交付地与结算地是否一致"],
 ["增加值率","本地服务供应商的中间投入结构"],["替代成本","向岛内采购的能力、价格和质量约束"]
 ].map(x=>'<div class="panel soft"><h3>'+x[0]+'</h3><p>'+x[1]+'</p></div>').join("")+'</div>';
}
function worldSvg(base,active){
 const W=800,H=345,L=68,R=36,T=26,B=293;
 const all=base.series.concat(active.series),lo=Math.min(...all.map(x=>x.p10))*.975,hi=Math.max(...all.map(x=>x.p90))*1.02;
 const x=year=>L+(year-2025)/5*(W-L-R),y=v=>B-(v-lo)/(hi-lo)*(B-T);
 const path=(s,k)=>s.map((p,i)=>(i?"L":"M")+x(p.year)+" "+y(p[k])).join(" ");
 const area=s=>path(s,"p90")+" "+path(s.slice().reverse(),"p10").replace(/^M/,"L")+"Z";
 let z="";
 for(let i=0;i<5;i++){let v=lo+(hi-lo)*i/4;z+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="#547487" opacity=".33" stroke-dasharray="4 7"/><text x="'+(L-8)+'" y="'+(y(v)+4)+'" fill="#9bb6c9" font-size="11" text-anchor="end">'+fmt(v,0)+'</text>';}
 for(let year=2025;year<=2030;year++)z+='<text x="'+x(year)+'" y="323" text-anchor="middle" fill="#adc4d3" font-size="12">'+year+'</text>';
 z+='<path d="'+area(base.series)+'" fill="#83bfff" opacity=".15"/><path d="'+area(active.series)+'" fill="#78e8dc" opacity=".19"/>';
 z+='<path d="'+path(base.series,"p50")+'" fill="none" stroke="#84bfff" stroke-width="3.2"/><path d="'+path(active.series,"p50")+'" fill="none" stroke="#7ae6d9" stroke-width="4"/>';
 z+='<text x="'+(W-R)+'" y="'+(y(active.finish.p50)-13)+'" text-anchor="end" font-size="12" fill="#78e6dd">你的世界</text>';
 z+='<text x="'+L+'" y="12" font-size="11" fill="#9abccc">2025现价基数 + 直接设定名义增长假设</text>';
 return '<svg class="svg-chart" role="img" aria-label="海南2030条件情景对照，P10和P90是模型内分位" viewBox="0 0 '+W+' '+H+'">'+z+'</svg>';
}
function worldPage(){
 const c=F.world,r=M.compare(c,{seed:SEED,draws:400}),s=M.sensitivity(c,{seed:SEED}),max=Math.max(...s.map(x=>Math.abs(x.span)),.01);
 const rb=M.robustness(c,{seed:SEED});
 return title("CONTROLLED COUNTERFACTUAL / TWO WORLDS","两个世界的随机扰动完全配对","基准不是现实预测。默认年增长率也只是研究者预先设定的假设。")+
 '<div class="layout-wide"><section class="panel glow"><div class="contrast"><div><small>中性假设世界 · 2030</small><div class="value-big blue">'+fmt(r.base.finish.p50,0)+'亿</div><small>模型内P50，不是预测</small></div><div><small>你的假设世界 · 2030</small><div class="value-big cyan">'+fmt(r.active.finish.p50,0)+'亿</div><small>与中性差 '+signed(r.delta,0)+' 假设亿元</small></div></div>'+
 worldSvg(r.base,r.active)+
 '<div class="legend"><span><i style="background:#84bfff"></i>默认条件</span><span><i style="background:#7ae6d9"></i>改变条件</span><span>半透明带：模型分位区间</span></div>'+
 title("COMPOSITION","你的世界 · 三次产业结构")+
 percentbar(r.active.finish.sectors.map(x=>x.p50),M.SECTOR_NAMES,C)+
 '<div class="divider"></div><h3>与默认假设相比，各产业中位值差异</h3>'+
 r.sectorDelta.map((v,i)=>'<div class="barrow"><span>'+M.SECTOR_NAMES[i]+'</span><div class="bar"><i style="width:'+Math.min(100,Math.abs(v)/Math.max(1,...r.sectorDelta.map(Math.abs))*100)+'%"></i></div><strong>'+signed(v,0)+'</strong></div>').join("")+
 '</section><aside class="panel"><span class="kicker">CONTROL ROOM</span><h2>只改变有意义的条件</h2>'+
 tabs(Object.entries(M.PRESETS).map(([id,p])=>[id,p.name]),F.world.presetId||"neutral","preset")+
 M.RATE_META.map((m,i)=>range(m.label,"rate"+i,c.rates[i],m.min,m.max,.5,"%")).join("")+
 range("2027/2028统一冲击百分点","shock",c.shock,0,8,.5,"pp")+
 range("模型内随机扰动幅度","vol",c.volatility,0,2.5,.1,"")+
 '<label for="worldModel" class="notice">时间演化机制</label><select class="select" id="worldModel">'+Object.entries(M.MODELS).map(([id,v])=>'<option value="'+id+'" '+(id===c.model?"selected":"")+'>'+v.name+'</option>').join("")+'</select>'+
 '<div class="divider"></div><div class="buttons">'+button("保存这组实验","saveWorld","primary")+button("恢复中性","neutral","ghost")+'</div>'+
 note('改变名义部门增速不是实施政策；无真实可识别弹性，不计算投入产出乘数或就业损失。')+'</aside></div>'+
 title("SENSITIVITY vs MODEL DISAGREEMENT","不确定性不只有随机波动")+
 '<div class="layout-even"><section class="panel"><h2>哪个直接设定的年率最敏感？</h2>'+s.map(x=>'<div class="barrow"><span>'+x.name.replace("：名义年变动假设","")+'</span><div class="bar"><i style="width:'+fmt(Math.abs(x.span)/max*100,1)+'%"></i></div><strong>'+signed(x.span,0)+'亿</strong></div>').join("")+'<p class="notice">每个部门名义增速假设上下改动0.5个百分点。不是政策边际效应。</p></section>'+
 '<section class="panel"><h2>三种演化机制，同一组条件</h2>'+
 rb.variants.map(v=>'<div class="item"><div><strong>'+v.name+'</strong><small>结构假设不同</small></div><strong>'+fmt(v.p50,0)+'亿</strong></div>').join("")+
 '<p class="notice">结构机制分歧不能与某个机制内部的P10/P90合成一条“准确率”。</p></section></div>';
}
function pressurePage(){
 const z=R.grid(F.pressure),pass=z.pass,sel=F.pressure;
 const colors=v=>v.pass?"#146962":"#6b3345";
 return title("ROBUST DECISION MAKING / STRESS FIELD","121个条件组合，寻找脆弱区")+
 '<div class="grid cols4">'+metric("人为指定的观察格","121","11×11 工业×服务直接名义增长假设"),metric("条件格达到门槛",String(pass),"不是真实命中数",""),metric("假设格覆盖率",fmt(z.share,1)+"%","不是现实成功概率",""),metric("人为对照门槛",fmt(sel.target,0)+"亿","2030假设现价GDP，并非官方承诺")+'</div>'+
 '<div class="layout-wide" style="margin-top:17px"><section class="panel glow"><span class="kicker">VULNERABILITY SURFACE</span><h2>工业与服务双变量压力面</h2>'+
 '<div class="heatmap">'+z.cells.map(v=>'<button type="button" data-act="stressCell" data-col="'+v.col+'" data-row="'+v.row+'" class="heatcell" title="工业名义年率'+fmt(v.x,1)+'%，服务'+fmt(v.y,1)+'%，2030结果'+fmt(v.total,0)+'亿" style="background:'+colors(v)+';opacity:'+(0.42+Math.min(0.58,Math.abs(v.total-sel.target)/2500))+'">'+((v.row+v.col)%4===0?Math.round(v.total/100)/10:"")+'</button>').join("")+'</div>'+
 '<div class="legend"><span><i style="background:#146962"></i>该假设下达到设置的门槛</span><span><i style="background:#6b3345"></i>该假设下未达到门槛</span><span>点击格子把该条件带入双世界</span></div>'+
 note('121格是有意选择的参数网格，没有为不同格赋予现实概率。因此“覆盖率”绝不是达标发生概率。')+'</section>'+
 '<aside class="panel"><span class="kicker">STRESS LAB</span><h2>设定扫描条件</h2>'+
 range("中心工业名义年率","stressIndustrial",sel.industrial,-6,10,.5,"%")+
 range("中心服务名义年率","stressServices",sel.services,-2,11,.5,"%")+
 range("农业名义年率","stressAgri",sel.agri,-3,9,.5,"%")+
 range("统一冲击百分点","stressShock",sel.shock,0,8,.5,"pp")+
 range("2030假设目标门槛","stressTarget",sel.target,7000,15000,250,"亿")+
 '<div class="divider"></div>'+button("对照更多机制","goModels","secondary")+
 '<p class="notice" style="margin-top:14px">不确定性有两个来源：随机扰动与模型结构本身。下一页研究不同假设机制是否导致结论反转。</p></aside></div>'+
 title("SCENARIO DISCOVERY","下一步不是选择最好看的格子，而是追查翻转边界")+
 '<div class="grid cols3">'+[
 ["找红绿交界","哪一组工业与服务年率只要轻微变化，目标状态就翻转？"],
 ["挑战目标本身","GDP门槛为何是这个数？更有意义的就业、收入、服务增加值条件是什么？"],
 ["检验证据","这些名义年率是否落在任何可观察项目兑现与产能限制之内？"]
 ].map(x=>panel(x[0],'<p>'+x[1]+'</p>',"soft")).join("")+'</div>';
}
function modelsPage(){
 const r=R.robust(),b=R.backtest(),s=r.strategies;
 const top=Math.max(...s.map(x=>x.maxRegret));
 return title("MODEL CHALLENGE / NOT A SINGLE FORECAST","同一种决策，在不同假设下会怎样？")+
 '<div class="layout-wide"><section class="panel glow"><span class="kicker">9 ALTERNATE CONDITIONS · 4 ASSUMPTION BUNDLES</span><h2>最坏后悔值，不等于政策最优</h2>'+
 '<div class="item-list">'+s.map((x,i)=>'<div class="item"><div style="flex:1"><strong>0'+(i+1)+' · '+x.name+'</strong><small>'+x.meaning+'</small><div class="bar" style="margin-top:8px"><i style="width:'+fmt(x.maxRegret/Math.max(1,top)*100,1)+'%"></i></div></div><div style="text-align:right;min-width:100px"><small class="tiny">最大后悔值</small><strong>'+fmt(x.maxRegret,0)+'假设亿</strong></div></div>').join("")+'</div>'+
 '<div class="divider"></div><p class="notice">九种压力环境：3种时间机制×3种压力强度；四种增长率组合并未满足同等财政预算、同等产业成本，所以当前只是展示稳健决策方法，不能直接排名现实政策。</p></section>'+
 '<aside class="panel"><span class="kicker">RESEARCH WARNING</span><h2>你认为哪条战略最优？</h2><p>单一世界的赢家往往取决于设定的增长率。更严肃的问题是：哪条路径在多种可能机制下不易失效？</p>'+
 '<div class="contrast"><div><small>竞争机制</small><div class="value-big cyan">3</div></div><div><small>压力环境</small><div class="value-big gold">9</div></div></div>'+
 note('这是结构不确定性研究示例，并非针对现实政策可行集优化。要升级为决策支持，至少需要约束预算、土地、人才、环境以及政策实施效应。')+
 '<div class="divider"></div>'+button("进入121格压力面","goPressure","secondary")+'</aside></div>'+
 title("OUT-OF-SAMPLE? / LIMITED BACKTEST","历史回测也是研究对象，不是质量徽章")+
 '<div class="layout-even"><section class="panel"><h2>一个极简的单年外推实验</h2><p class="notice">用过去两年的部门现价比率推下一年，观察是否与公布现价GDP相差很大。</p>'+
 '<table class="matrix"><thead><tr><th>留出年</th><th>公开现价</th><th>机械外推</th><th>绝对误差</th></tr></thead><tbody>'+
 b.cases.map(x=>'<tr><td>'+x.year+'</td><td>'+fmt(x.observed,0)+'</td><td>'+fmt(x.naive,0)+'</td><td>'+fmt(x.error,0)+'</td></tr>').join("")+'</tbody></table>'+
 '<div class="divider"></div><div class="value-big rose">'+fmt(b.mape,1)+'%</div><p>仅4个一年留出点的平均绝对百分比误差，不能认证预测性能。初始公报的修订问题会进一步影响结果。</p></section>'+
 '<section class="panel"><h2>科研准入门槛</h2>'+
 [["已做","三产结构及现价账本"],["可演示","条件路径 / 双冲击 / 结构后悔值"],["暂不可识别","投入产出GDP乘数"],["暂不可识别","真实SEM、PLS测量结果"],["暂不可识别","因果政策收益估计"]].map(x=>'<div class="method-row"><b>'+x[0]+'</b><p>'+x[1]+'</p></div>').join("")+
 '<div class="divider"></div><p class="notice">更先进的算法不是越多越好，关键是其估计对象和观察数据能否匹配。</p></section></div>';
}
function blindspotsPage(){
 const qs=R.UNKNOWNS;
 const d=qs[F.challenge%qs.length];
 return title("RED TEAM / FALSIFICATION FIRST","停止为自己喜欢的解释找证据")+
 '<div class="mosaic">'+qs.slice(0,4).map((x,i)=>'<button type="button" data-act="challenge" data-v="'+i+'" class="'+(i===F.challenge?"active":"")+'"><small class="kicker">CRITICAL GAP 0'+(i+1)+'</small><strong>'+x.name+'</strong><small>'+x.why+'</small></button>').join("")+'</div>'+
 '<div class="layout-wide" style="margin-top:17px"><section class="panel glow"><span class="kicker">RESEARCH QUESTION</span><h2>'+d.name+'</h2><p>'+d.why+'</p>'+
 '<div class="story-steps">'+[
 ["当前问题",d.name],["为何重要",d.why],["最少要取得什么",d.minimum],["取得后能改变什么",d.effect]
 ].map((x,i)=>'<div><small>0'+(i+1)+' '+x[0]+'</small><strong style="font-size:13px;margin-top:9px">'+x[1]+'</strong></div>').join("")+'</div>'+
 '<div class="divider"></div>'+note('不要把“暂时不知道”用一个未经验证的平均比例填上。研究升级的价值恰恰是说明什么仍无法识别。')+
 '<div class="buttons" style="margin-top:15px">'+button("存入研究待办","saveGap","primary",'data-v="'+d.id+'"')+'</div></section>'+
 '<aside class="panel"><span class="kicker">EVIDENCE READINESS</span><h2>目前研究知道什么？</h2>'+
 '<div class="item-list">'+[
 ["A","2025官方三产规模和工业、投资数据","a"],["A","2026年1—8月工业、贸易、投资","a"],["B","2026年前三季度GDP转引，待原件复核","b"],["H","多层产业候选关系，尚无真实交易权重","h"],["C","未来年率、压力和随机分布设定","c"]
 ].map(x=>'<div class="item"><div>'+chip(x[0],x[2])+' <strong>'+x[1]+'</strong></div></div>').join("")+'</div></aside></div>'+
 title("RESEARCH ADMISSION","什么结论暂时不准说？")+
 '<div class="grid cols3">'+[
 ["真实采购网络已识别？","否。尚无代表性的匿名企业交易边。"],
 ["已经得到SmartPLS因果效应？","否。缺真实问卷、潜变量题项、抽样框与跨软件核验。"],
 ["模拟GDP达标比例就是现实概率？","否。未来名义年率和随机扰动均未实证标定。"]
 ].map(x=>panel(x[0],'<p>'+x[1]+'</p>',"soft")).join("")+'</div>';
}
function archivePage(){
 const saved=read(S,[]),questions=read(Q,[]);
 const choose=(id,v)=>'<select class="select" id="'+id+'"><option value="">不选择</option>'+saved.map((z,i)=>'<option value="'+i+'" '+(i===v?"selected":"")+'>'+esc(z.created.slice(0,16))+' · '+esc(z.controls?.model||"?")+' · '+fmt(z.p50,0)+'</option>').join("")+'</select>';
 const a=saved[F.archiveLeft],b=saved[F.archiveRight];
 const delta=a&&b?a.p50-b.p50:null;
 return title("YOUR SCIENTIFIC TRACE","把一次直觉，变成可复核研究")+
 '<div class="grid cols4">'+metric("当前浏览器快照",String(saved.length),"不会同步至云端"),metric("已记录研究问题",String(questions.length),"只记录待核验问题"),
 metric("模型版本",M.VERSION,"变更数据版本必须重新登记"),metric("固定随机种子",String(SEED),"用于条件世界对照")+'</div>'+
 '<div class="layout-wide" style="margin-top:17px"><section class="panel glow"><span class="kicker">EXPERIMENT COMPARISON</span><h2>挑两个以前的世界，检查判断是否改变</h2>'+
 '<div class="contrast"><div><label for="archiveA">实验 A</label>'+choose("archiveA",F.archiveLeft)+(a?'<div class="value-big cyan" style="margin-top:13px">'+fmt(a.p50,0)+'亿</div>':'<p>未选择</p>')+'</div><div><label for="archiveB">实验 B</label>'+choose("archiveB",F.archiveRight)+(b?'<div class="value-big blue" style="margin-top:13px">'+fmt(b.p50,0)+'亿</div>':'<p>未选择</p>')+'</div></div>'+
 '<div class="divider"></div><h3>两条条件路径之间的模型中位差</h3><div class="value-big gold">'+(delta===null?"尚未选两条":signed(delta,0)+"假设亿元")+'</div>'+
 '<p>这是两个条件实验之间的差异，不是政策收益差。只有同一代码、数据版本、条件和随机设置下才可完整复现。</p>'+
 '<div class="buttons">'+button("下载JSON研究档案","exportJson","secondary")+button("复制研究概要","copySummary","ghost")+'</div></section>'+
 '<aside class="panel"><span class="kicker">SAVED WORLDS</span><h2>你的实验历史</h2>'+
 (saved.length?'<div class="item-list">'+saved.map((z,i)=>'<div class="item"><div><strong>'+esc(z.created.slice(0,19).replace("T"," "))+'</strong><small>'+esc(z.modelVersion)+' · '+fmt(z.p50,0)+'假设亿元</small></div>'+button("重开","restore","secondary",'data-v="'+i+'"')+'</div>').join("")+'</div>':'<div class="evidence-note">还没有保存任何实验。到第六页改变条件，保存一组作为开始。</div>')+
 '<div class="divider"></div><h3>待核验问题</h3>'+ (questions.length?'<div class="item-list">'+questions.slice(0,9).map(x=>'<div class="item"><small>'+esc(x.question)+'</small></div>').join("")+'</div>':'<p>尚未记录问题。</p>')+'</aside></div>'+
 title("REPRODUCIBILITY","什么才是值得信任的研究留痕？")+
 panel("记录的不只是结果，还有模型为什么可能错",'<div class="story-steps">'+[
 ["数据版本","来源、时间窗口、修订情况"],["模型版本","实际代码和结构假设"],["输入条件","名义年率、压力、网络层及区间"],["验证边界","哪些证据尚未收集"]
 ].map((x,i)=>'<div><small>0'+(i+1)+' '+x[0]+'</small><strong style="font-size:13px;margin-top:8px">'+x[1]+'</strong></div>').join("")+'</div>',"soft");
}
function render(){
 const mapping={discover:guessSection,history:historyPage,network:networkPage,sectors:sectorPage,value:valuePage,worlds:worldPage,pressure:pressurePage,models:modelsPage,blindspots:blindspotsPage,archive:archivePage};
 try{apply((mapping[page]||guessSection)());}
 catch(e){console.error(e);apply('<div class="panel"><h2>这个实验遇到计算错误</h2><p>请刷新页面。如问题持续存在，请到GitHub查看自动验收状态。</p><code>'+esc(e.message)+'</code></div>');}
}
function changeRange(id,v){
 const n=Number(v);
 if(id.startsWith("rate")){F.world.rates[Number(id.slice(-1))]=n;put(K,F.world);}
 else if(id==="shock"){F.world.shock=n;put(K,F.world);}
 else if(id==="vol"){F.world.volatility=n;put(K,F.world);}
 else if(id==="intensity"){F.intensity=n;}
 else if(id==="rounds"){F.rounds=n;}
 else if(["lower","upper","vlow","vhigh"].includes(id))F.val[id]=n;
 else if(id.startsWith("stress")){const k=id.replace("stress","");const field=k.charAt(0).toLowerCase()+k.slice(1);F.pressure[field]=n;}
 if($(id+"Out"))$(id+"Out").textContent=fmt(n,String(document.getElementById(id).step).includes(".")?1:0)+(id.startsWith("rate")||["lower","upper","vlow","vhigh","stressIndustrial","stressServices","stressAgri"].includes(id)?"%":id==="shock"?"pp":id==="stressTarget"?"亿":"");
 // Keep the slider DOM node alive through continuous gestures; re-render on "change".
}
document.addEventListener("input",e=>{const t=e.target;if(t.dataset.range)changeRange(t.dataset.range,t.value);});
document.addEventListener("change",e=>{
 const id=e.target.id;
 if(e.target.dataset.range){render();return;}
 if(id==="compareYear"){F.compareYear=Number(e.target.value);render();}
 if(id==="removeEdge"){F.removed=e.target.value;render();}
 if(id==="worldModel"){F.world.model=e.target.value;put(K,F.world);render();}
 if(id==="archiveA"){F.archiveLeft=Number(e.target.value);render();}
 if(id==="archiveB"){F.archiveRight=Number(e.target.value);render();}
});
document.addEventListener("click",e=>{
 const b=e.target.closest("[data-act]");if(!b)return;
 const act=b.dataset.act,v=b.dataset.v;
 if(act==="signal"){F.selectedSignal=Number(v);F.guessed=null;render();}
 if(act==="guess"){F.guessed=Number(v);render();}
 if(act==="year"){F.year=Number(v);render();}
 if(act==="layer"){F.layer=v;F.removed="none";render();}
 if(act==="sector"){F.sector=v;render();}
 if(act==="preset"){F.world=M.sanitize(M.PRESETS[v]);F.world.presetId=v;put(K,F.world);render();}
 if(act==="neutral"){F.world=M.sanitize(M.PRESETS.neutral);F.world.presetId="neutral";put(K,F.world);render();}
 if(act==="saveWorld")saveWorld();
 if(act==="valueUnknown"){F.val={lower:0,upper:100,vlow:0,vhigh:100};render();}
 if(act==="valueCell"){F.val={lower:Number(b.dataset.x),upper:Number(b.dataset.x),vlow:Number(b.dataset.y),vhigh:Number(b.dataset.y)};render();}
 if(act==="stressCell"){
  const g=R.grid(F.pressure),cell=g.cells.find(x=>x.row===Number(b.dataset.row)&&x.col===Number(b.dataset.col));if(!cell)return;
  F.world=M.sanitize({...F.world,rates:[F.pressure.agri,cell.x,cell.y],shock:F.pressure.shock,model:"constant"});
  put(K,F.world);toast("这组条件已带入第06页");window.location.assign("./worlds.html");
 }
 if(act==="goModels")window.location.assign("./models.html");
 if(act==="goPressure")window.location.assign("./pressure.html");
 if(act==="challenge"){F.challenge=Number(v);render();}
 if(act==="saveGap"){archiveQuestion(R.UNKNOWNS.find(q=>q.id===v)?.minimum||"需要补充新的证据");}
 if(act==="saveSector"){archiveQuestion(R.CLUSTERS.find(q=>q.id===v)?.question||"研究问题");}
 if(act==="restore"){const s=read(S,[])[Number(v)];if(s){F.world=M.sanitize(s.controls);put(K,F.world);window.location.assign("./worlds.html");}}
 if(act==="exportJson"){const data={schema:"hainan-research-v2",generated:new Date().toISOString(),modelVersion:M.VERSION,dataVersion:"2025_OFFICIAL_2026_OBSERVED",observedSources:R.SOURCES,saved:read(S,[]),questions:read(Q,[]),limitations:["条件模拟无经验标定","研究候选边不代表实测交易","无政策因果识别"]};
   const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="hainan-v2-research-archive.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),800);toast("研究档案已生成");}
 if(act==="copySummary"){const list=read(S,[]);const content="海南V2研究摘要\n模型版本："+M.VERSION+"\n保存实验："+list.length+"\n最新实验："+(list[0]?fmt(list[0].p50,0)+"假设亿元":"尚无")+"\n数据等级：A/B/C/H分离，非政策预测。";if(navigator.clipboard?.writeText)navigator.clipboard.writeText(content).then(()=>toast("研究概要已复制")).catch(()=>window.prompt("复制",content));else window.prompt("复制",content);}
});
document.addEventListener("click",e=>{const b=e.target.closest("[data-node]");if(b){F.node=b.dataset.node;render();}});
document.addEventListener("keydown",e=>{const b=e.target.closest("[data-node]");if(b&&(e.key==="Enter"||e.key===" ")){e.preventDefault();F.node=b.dataset.node;render();}});
$("copyLink").addEventListener("click",()=>{if(navigator.clipboard?.writeText)navigator.clipboard.writeText(location.href).then(()=>toast("本页地址已复制")).catch(()=>toast("复制失败"));else window.prompt("复制地址",location.href);});
render();
})();