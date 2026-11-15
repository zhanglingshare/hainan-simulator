/* Hainan Research Council UI: on-page agent mission + opt-in debate + persistent trace.
 * Offline, transparent rule-based hypothesis exploration. Never calls a hosted LLM.
 */
(function(){
"use strict";
const API=window.HainanCouncil;
if(!API)return;
const PAGE=document.body.dataset.page||"discover",STORAGE="HAINAN_COUNCIL_V1";
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,x=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[x]));
const safeGet=()=>{try{return API.normalize(JSON.parse(localStorage.getItem(STORAGE)||"null"));}catch{return API.fresh();}};
let state=safeGet(),tab="debate",open=false;
const context=new URLSearchParams(location.search),qClaim=context.get("claim");
const PAGE_LINKS={discover:"index.html",history:"history.html",network:"network.html",sectors:"sectors.html",value:"value.html",worlds:"worlds.html",pressure:"pressure.html",models:"models.html",blindspots:"blindspots.html",archive:"archive.html"};
const PAGE_LABELS={discover:"岛屿异动",history:"六年产业史",network:"全息关系",sectors:"五大产业现场",value:"价值留岛",worlds:"双世界实验",pressure:"压力风洞",models:"机制对抗",blindspots:"忽略了什么",archive:"我的研究档案"};

const LENSES=[["worker","工作与家庭"],["shop","小店与个体"],["founder","企业与创业"],["researcher","研究与决策"]];
const LENS_QUESTIONS={
 "trade-contrast":{
 worker:"进出口变化是否对应新增的稳定岗位、工资和技能需求？先核对招聘、就业和行业工资，而不是只看贸易额。",
 shop:"货物贸易更活跃，是否让本地运输、餐饮或生活服务产生真实订单？先查分行业经营额和客户来源。",
 founder:"研发检测、软件和跨境物流的哪些服务仍从岛外采购？先找实际客户需求与采购门槛。",
 researcher:"能否在同一行业与时间窗口里同时测量贸易货值、本地加工增加值和企业服务采购地？"},
 "industry-investment":{
 worker:"现有工厂是加班生产、用工扩张还是少人自动化？先查实际招聘、工时和岗位稳定性。",
 shop:"项目投产或延期会改变哪些周边消费需求？先查真实投产日程与商圈经营数据。",
 founder:"新增产能来自已投产项目还是在建项目？在决定投资配套前先确认客户兑现计划。",
 researcher:"能否构建项目开工、完工、投产与产出的时间对照，排除价格和行业组成干扰？"},
 "tourism-benefit":{
 worker:"游客消费增长是否改善旺淡季岗位、工资和工作稳定性？需要真实就业样本。",
 shop:"游客花费增长，你的净利润有无增长？最值得拆开看房租、平台抽成、采购成本和客单价。",
 founder:"本地文化产品、医养服务、农产供应链是否真的有新增复购，而不只是客流热闹？",
 researcher:"如何区分游客总花费、行业增加值、经营利润和居民收入，并进行分行业统计？"},
 "agri-chain":{
 worker:"冷链加工能否创造更稳定的本地岗位，还是只是机械替代？需要企业用工与工资证据。",
 shop:"当地农产品的产地价格、损耗与终端售价之间，谁真正得到差额？",
 founder:"先找真实损耗、账期和订单约束，再决定是否有必要投资加工或冷链。",
 researcher:"如何取得分品类的价格、产销流量、采购合同和农户净收入数据？"},
 "hidden-services":{
 worker:"本地是否存在尚未被注意的研发、检测、工业软件岗位需求？先查企业招聘和采购意向。",
 shop:"是否有可承接的本地专业服务订单，而不是凭‘产业很大’就盲目转型？",
 founder:"哪些企业真实愿意付费购买检测、物流、软件或供应商配套？先验证客户需求和替代成本。",
 researcher:"如何用匿名企业采购样本收紧本地价值留存的识别区间？"},
 "history-vintage":{
 worker:"产业结构变化是否对应你所在行业的长期用工趋势？需要岗位数据与修订后产业数据配对。",
 shop:"自己看到的经营变化是否真是产业转型，还是季节、价格和统计口径的影响？",
 founder:"用哪个修订版本的行业数据判断长期市场？未经核对的份额变化可能误导选址。",
 researcher:"统计修订、产业分类和价格基期变动会怎样影响结构断点识别？"},
 "scenario-identity":{
 worker:"模型里GDP多增长几百亿，并不等于你的工资会上升。还需要就业与分配传导证据。",
 shop:"情景里的增长与小店客流不是同一个变量。能否找到具体行业的中间传导？",
 founder:"不要用未经标定的2030终值直接决定投入。先测试在哪些前提改变时结果会翻转。",
 researcher:"同随机种子对照、结构模型分歧和真实参数不确定性该怎样严格区分？"},
 "fragile-connectivity":{
 worker:"关键产业联系中断时，哪些职业能转岗，哪些技能没有替代路径？先查真实岗位网络。",
 shop:"一个大客户或大渠道出现问题，是否存在真正能替代的供应与客源？",
 founder:"企业对单一物流、供应商或关键技能有多大依赖？先调查替代率和恢复周期。",
 researcher:"候选网络删边暴露如何在真实关系权重与漏边估计下重新检验？"}
};
let lens=(()=>{try{const v=localStorage.getItem("HAINAN_COUNCIL_LENS");return LENSES.some(x=>x[0]===v)?v:"worker";}catch{return "worker";}})();
function lensQuestion(c){return LENS_QUESTIONS[c.id]?.[lens]||"你最希望知道这条候选机制会怎样影响自己？先找到能够观察的主体、行为和数据，再讨论结果。";}
function disputeMap(c){
 const ms=state.messages.filter(m=>m.claim===c.id);
 const conf={build:ms.filter(m=>m.type==="发现").length,check:ms.filter(m=>m.type==="质疑").length,dissent:ms.filter(m=>m.type==="异见").length};
 return '<div class="hdc-argument-map"><div class="hdc-argument-title">三种意见正面交锋 <small>下方数字是发言次数，不是可信度评分</small></div>'+
 '<div class="hdc-argument-cols">'+
 '<button type="button" data-hdc="round" class="hdc-argument-role builder"><span>✦</span><b>建构</b><strong>'+conf.build+'</strong><small>'+esc(API.agent(c.inventor).name)+'：提出连接</small></button>'+
 '<button type="button" data-hdc="challenge" class="hdc-argument-role skeptic"><span>⌁</span><b>反证</b><strong>'+conf.check+'</strong><small>'+esc(API.agent(c.reviewer).name)+'：质疑依据</small></button>'+
 '<button type="button" data-hdc="dissent" class="hdc-argument-role dissenter"><span>◇</span><b>异见</b><strong>'+conf.dissent+'</strong><small>'+esc(API.agent(c.dissenter).name)+'：替代解释</small></button></div></div>';
}
const role=API.agent(API.agentForPage(PAGE));
const ids=API.workPage(PAGE);
if(qClaim&&(API.CLAIMS[qClaim]||state.claims[qClaim]))state.active=qClaim;
else if(!ids.includes(state.active))state.active=ids[0];
function save(){try{localStorage.setItem(STORAGE,JSON.stringify(API.normalize(state)));return true;}catch{return false;}}
function activeClaim(){return API.claimFor(state,state.active)||API.CLAIMS[ids[0]];}
function badge(t){return '<span class="hdc-tier '+(t==="A"?"a":t==="B"?"b":t==="C"?"c":"h")+'">'+esc(t)+'</span>';}
function anchor(page,claim){return './'+(PAGE_LINKS[page]||"index.html")+'?claim='+encodeURIComponent(claim||state.active);}
function line(text){return '<p>'+esc(text)+'</p>';}
function toDate(date){if(!date)return "";const d=new Date(date);return Number.isNaN(d.valueOf())?"":d.toLocaleString("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});}
function select(id){if(!API.claimFor(state,id))return;state.active=id;save();render();}
function toast(msg){const e=$("toast");if(!e)return;e.textContent=msg;e.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>e.classList.remove("show"),2300);}
const leadItems=ids.map(id=>{const c=API.CLAIMS[id];return {id,title:c.title};});
function missionBanner(){
 const c=activeClaim(),entry=API.CLAIMS[state.active]?state.active:ids[0],count=state.messages.length;
 return '<div class="hdc-inline">'+
 '<div class="hdc-who"><span class="hdc-avatar" aria-hidden="true">✦</span><div><span class="hdc-kicker">THIS PAGE HAS A RESEARCH AGENT</span><strong>'+esc(role.name)+'Agent · '+esc(role.mission)+'</strong><small>它最怀疑：'+esc(role.skepticism)+'</small></div></div>'+
 '<div class="hdc-next"><span>它现在追问</span><strong>'+esc(c.title)+'</strong><small>候选假说 · 未经实证确认</small></div>'+
 '<button type="button" id="hdcOpen" class="hdc-enter" aria-controls="hdcDrawer" aria-expanded="'+(open?"true":"false")+'">进入争论现场 <span aria-hidden="true">↗</span><small>'+count+' 条本地研究消息</small></button>'+
 '</div>';
}
function councilHeader(){
 const c=activeClaim(),status=state.claims[state.active]?.status||"open",count=state.messages.length,persona=API.agent(c.inventor);
 return '<div class="hdc-head"><div><span class="hdc-kicker">HAINAN DISCOVERY COUNCIL · 12 RESEARCH ROLES</span>'+
 '<h2>让不同的解释正面交锋</h2><p>当前问题由「'+esc(persona.name)+'」提出，接受其他角色的质疑。</p></div>'+
 '<button type="button" class="hdc-close" data-hdc="close" aria-label="关闭研究争论台">×</button></div>'+
 '<div class="hdc-stats"><span>记录 '+count+' 条</span><span>状态：'+esc(status==="retired"?"退役假设":status==="revised"?"已改判":status==="challenged"?"正在质疑":"开放问题")+'</span><span>规则协议 HDC 1.0</span></div>'+
 '<div class="hdc-tabs"><button data-hdc="tab" data-tab="debate" class="'+(tab==="debate"?"active":"")+'">正在争论</button>'+
 '<button data-hdc="tab" data-tab="value" class="'+(tab==="value"?"active":"")+'">我得到了什么</button>'+
 '<button data-hdc="tab" data-tab="memory" class="'+(tab==="memory"?"active":"")+'">研究留痕</button></div>';
}
function discoveryTopics(){
 const current=activeClaim();
 const list=API.workPage(PAGE).map(id=>({id,title:API.CLAIMS[id].title}));
 if(state.active.startsWith("user-")&&!list.some(x=>x.id===state.active)){list.unshift({id:state.active,title:current.title});}
 return '<div class="hdc-topic-label">本页值得争论的候选发现</div><div class="hdc-topic-list">'+
 list.map(c=>'<button type="button" data-hdc="select" data-id="'+esc(c.id)+'" class="'+(c.id===state.active?"active":"")+'" aria-pressed="'+(c.id===state.active)+'">'+esc(c.title)+'</button>').join("")+'</div>';
}
function messageCard(m){
 const a=API.agent(m.agent),target=API.agent(m.target),facts=m.refs.map(API.evidence).filter(Boolean);
 return '<article class="hdc-message hdc-'+({"发现":"discovery","质疑":"challenge","异见":"dissent","交接":"handoff","改判":"revision"}[m.type]||"discovery")+'">'+
 '<div class="hdc-msg-top"><strong>'+esc(a.name)+'Agent</strong><span class="hdc-type">'+esc(m.type)+'</span>'+badge(m.tier)+
 '<small>'+esc(toDate(m.date))+'</small></div>'+
 '<p>'+esc(m.text)+'</p>'+
 (facts.length?'<details><summary>查看所依据的公开指标 · '+facts.length+'项</summary><div class="hdc-facts">'+facts.map(e=>'<div><b>'+esc(e.label)+'</b><span>'+esc(e.period)+' · '+esc(e.value)+esc(e.unit)+' · '+esc(e.tier)+'级</span><a href="'+esc(e.source)+'" rel="noopener noreferrer" target="_blank">原始来源 ↗</a></div>').join("")+'</div></details>':'<span class="hdc-unverified">未引用独立可检验的实测关系</span>')+
 (m.type==="交接"&&target.home!=="全站"?'<a class="hdc-handoff" href="'+anchor(target.home,m.claim)+'">带着问题去'+esc(PAGE_LABELS[target.home]||target.home)+' ↗</a>':"")+
 '</article>';
}
function debateView(){
 const c=activeClaim(),g=API.epistemic(c);
 const feed=state.messages.filter(m=>m.claim===c.id).slice(-24);
 const assigned=API.agent(c.inventor),reviewer=API.agent(c.reviewer),dissenter=API.agent(c.dissenter);
 const cstatus=state.claims[c.id]?.status||"open";
 return discoveryTopics()+
 '<div class="hdc-question"><div class="hdc-label-row"><span>候选发现 '+esc(c.id)+'</span>'+badge(c.grade||"H")+'</div>'+
 '<h3>'+esc(c.title)+'</h3>'+line(c.origin)+
 '<div class="hdc-trio"><span><b>建构</b> '+esc(assigned.name)+'</span><span><b>审查</b> '+esc(reviewer.name)+'</span><span><b>异见</b> '+esc(dissenter.name)+'</span></div>'+
 '<div class="hdc-evidence-grade">引用公开指标 '+g.facts.length+' 项 / 不等于已经验证产业机制。</div></div>'+
 disputeMap(c)+
 '<div class="hdc-action-row"><button type="button" class="primary" data-hdc="round">召开一轮研究争论</button>'+
 '<button type="button" data-hdc="challenge">专门反驳它</button><button type="button" data-hdc="invent">跨域再想一种可能</button>'+
 '<button type="button" data-hdc="dissent">让异见发言</button></div>'+
 '<div class="hdc-flow"><h3>公开争论流 <small>五种消息 · 不强行平均</small></h3>'+
 (feed.length?feed.map(messageCard).join(""):'<p class="hdc-empty">本题还没有争论记录。点击“召开一轮研究争论”，会出现建构、质疑、异见、交接四种声音。</p>')+'</div>'+
 '<div class="hdc-retirement"><h3>一个判断错了，也可以留下研究价值</h3>'+
 '<p>改判不是删除。需要明确写下原因；所有原始消息仍保存在本浏览器。</p>'+
 '<label for="hdcRevisionReason">为什么要改判？</label><textarea id="hdcRevisionReason" rows="2" placeholder="例如：新证据显示原有解释忽略了行业构成，需重新分类……"></textarea>'+
 '<div class="hdc-action-row"><button type="button" data-hdc="retire" '+(cstatus==="retired"?"disabled":"")+'>退役这条假设</button>'+
 '<button type="button" data-hdc="revise">条件改判</button><button type="button" data-hdc="reopen">重新开放</button></div></div>';
}
function valueView(){
 const c=activeClaim(),facts=API.epistemic(c).facts;
 const gains=[["视野","eye",c.vision],["思维工具","sliders-horizontal",c.tool],["认知升级","brain-circuit",c.insight],["灵感","lightbulb",c.inspiration],["下一个核验动作","search",c.test]];
 return discoveryTopics()+'<div class="hdc-lens"><div class="hdc-argument-title">这件事，与你有什么关系？</div><div class="hdc-lens-buttons">'+LENSES.map(x=>'<button data-hdc="lens" data-lens="'+x[0]+'" class="'+(lens===x[0]?"active":"")+'">'+x[1]+'</button>').join("")+'</div><p>'+esc(lensQuestion(c))+'</p></div>'+'<div class="hdc-question"><span class="hdc-kicker">WHAT THE USER TAKES AWAY</span><h3>'+esc(c.title)+'</h3>'+
 '<p>并不是每个问题都要在这里算出答案。更重要的是用户有没有获得新的观察角度和调查方向。</p></div>'+
 '<div class="hdc-gains">'+gains.map(x=>'<div class="hdc-gain"><span>'+x[0]+'</span><p>'+esc(x[2])+'</p></div>').join("")+'</div>'+
 '<div class="hdc-next-evidence"><h3>最能改变当前判断的证据</h3><p>'+esc(c.test)+'</p>'+
 '<div class="hdc-action-row"><button data-hdc="challenge">反过来挑战这个发现</button>'+
 '<a href="'+anchor(c.target,c.id)+'">进入下一实验 ↗</a></div></div>'+
 '<div class="hdc-question"><h3>当前可以直接引用的观察</h3>'+ (facts.length?facts.map(e=>'<div class="hdc-fact-row">'+badge(e.tier)+' <b>'+esc(e.label)+'</b> · '+esc(e.period)+' · '+esc(e.value)+esc(e.unit)+' <a href="'+esc(e.source)+'" target="_blank" rel="noopener noreferrer">查看出处</a></div>').join(""):'<p>目前没有可引用的独立事实来源，仍处于创意阶段。</p>')+'</div>';
}
function memoryView(){
 const c=activeClaim(),revisions=state.notebook.slice().reverse(),userClaims=Object.entries(state.claims).filter(([id,v])=>id.startsWith("user-")&&v.title);
 return '<div class="hdc-question"><span class="hdc-kicker">THE MEMORY OF WRONG IDEAS</span><h3>被推翻的路径，也是一份研究资产</h3><p>当前浏览器保留研究消息、开放争论、改判理由和用户新假说。不会自动同步云端。</p>'+
 '<div class="hdc-memory-num"><div><b>'+state.messages.length+'</b><small>研究消息</small></div><div><b>'+revisions.length+'</b><small>改判记录</small></div><div><b>'+userClaims.length+'</b><small>你的候选假说</small></div></div></div>'+
 '<div class="hdc-action-row"><button data-hdc="export" class="primary">导出完整Agent研究日志 JSON</button><button data-hdc="tab" data-tab="debate">返回争论台</button></div>'+
 '<div class="hdc-compose"><h3>你来提出一条别人没想到的连接</h3><p>可以大胆，甚至反直觉。但必须把它写成一个以后有机会检验的机制，而不是宣称已证实。</p>'+
 '<label for="hdcIdeaTitle">我怀疑……</label><input id="hdcIdeaTitle" maxlength="160" placeholder="例如：旅游订单是否正在改变热带农产的议价方式？">'+
 '<label for="hdcIdeaMechanism">为什么可能这样？如何发生？</label><textarea id="hdcIdeaMechanism" rows="3" maxlength="500" placeholder="提出两个环节之间可能存在的联系，说明为什么值得追查……"></textarea>'+
 '<button type="button" data-hdc="idea" class="primary">写入研究议题并交给测量Agent</button></div>'+
 '<h3 class="hdc-small-head">退役与改判记录</h3>'+
 (revisions.length?revisions.slice(0,20).map(x=>'<div class="hdc-memory-item"><b>'+esc(x.type)+' · '+esc(x.claim)+'</b><small>'+esc(toDate(x.date))+'</small><p>'+esc(x.note)+'</p></div>').join(""):'<p class="hdc-empty">暂无改判。你可以在“正在争论”中主动退役一个无法支撑的解释。</p>')+
 '<h3 class="hdc-small-head">你的新假说</h3>'+
 (userClaims.length?userClaims.map(([id,v])=>'<button class="hdc-user-item" data-hdc="select" data-id="'+esc(id)+'">'+esc(v.title)+' ↗</button>').join(""):'<p class="hdc-empty">还没有自己提出的候选机制。</p>');
}
function renderDrawer(){
 const drawer=$("hdcDrawer"),overlay=$("hdcBackdrop");
 if(!drawer||!overlay)return;
 drawer.setAttribute("aria-hidden",String(!open));
 overlay.hidden=!open;document.body.classList.toggle("hdc-lock",open);
 drawer.classList.toggle("is-open",open);
 drawer.innerHTML=councilHeader()+'<div class="hdc-body">'+(tab==="debate"?debateView():tab==="value"?valueView():memoryView())+'</div>'+
 '<div class="hdc-bottom"><span>本地规则驱动研究协议 · 不是联网大模型自动研究</span><a href="./RESEARCH.md">查看科研边界 ↗</a></div>';
 if(open)drawer.scrollTop=0;
 const entry=$("hdcOpen");if(entry)entry.setAttribute("aria-expanded",String(open));
}
function render(){const before=$("hdcInline");if(before)before.innerHTML=missionBanner();renderDrawer();}
function persist(next){state=next;if(!save())toast("浏览器存储不可用，本次争论仅存在当前页面");render();}
function openDrawer(activeTab="debate"){tab=activeTab;open=true;render();const close=$("hdcDrawer").querySelector(".hdc-close");if(close)close.focus();}
function closeDrawer(){open=false;render();$("hdcOpen")?.focus();}
function exportJson(){
 const data=API.exportState(state),blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json;charset=utf-8"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="hainan-agent-council-研究争论与改判.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);
 toast("研究日志已导出，包括退役假设");
}
function act(name,button){
 const id=state.active;
 try{
  if(name==="lens"){const next=button.dataset.lens;if(LENSES.some(x=>x[0]===next)){lens=next;try{localStorage.setItem("HAINAN_COUNCIL_LENS",next);}catch{}render();}return;}
  if(name==="close"){closeDrawer();return;}
  if(name==="select"){select(button.dataset.id);return;}
  if(name==="tab"){tab=button.dataset.tab||"debate";render();return;}
  if(name==="round"){persist(API.runRound(state,id));toast("本轮已完成：建构、质疑、异见、交接");return;}
  if(["challenge","invent","dissent"].includes(name)){persist(API.debate(state,id,name));tab="debate";toast("已追加"+(name==="invent"?"建构与反证":"新的竞争观点"));return;}
  if(["retire","revise","reopen"].includes(name)){
   const reason=$("hdcRevisionReason")?.value||"";
   const status=name==="retire"?"retired":name==="reopen"?"open":"revised";
   persist(API.revise(state,id,status,reason));toast("改判已登记，原始错误仍可追溯");return;
  }
  if(name==="idea"){
   const title=$("hdcIdeaTitle")?.value||"",construct=$("hdcIdeaMechanism")?.value||"";
   const r=API.addHypothesis(state,title,construct);state=r.state;state.active=r.id;save();tab="debate";render();toast("候选假说已交给测量Agent，证据等级H");return;
  }
  if(name==="export"){exportJson();return;}
 }catch(e){toast(e.message||"研究操作失败");}
}
function onExperience(action,origin){
 if(!origin)return;
 const map={guess:"trade-contrast",year:"history-vintage",layer:"fragile-connectivity",sector:"agri-chain",
 valueCell:"hidden-services",stressCell:"scenario-identity",challenge:"fragile-connectivity",saveWorld:"scenario-identity",
 saveGap:"hidden-services",saveSector:"tourism-benefit",neutral:"scenario-identity",preset:"scenario-identity"};
 let id=map[action];if(!id)return;
 if(action==="sector"){const x=origin.dataset.v;id=x==="agri"?"agri-chain":x==="tourism"?"tourism-benefit":x==="industry"?"industry-investment":x==="service"?"hidden-services":"trade-contrast";}
 if(action==="challenge"){const i=Number(origin.dataset.v);id=["hidden-services","industry-investment","tourism-benefit","agri-chain","fragile-connectivity"][i]||"fragile-connectivity";}
 if(!API.CLAIMS[id])return;
 const local=API.workPage(PAGE);
 // Switch to related research question only if it belongs to the current page; never hijack navigation.
 if(!local.includes(id))return;
 if(state.active!==id){state.active=id;save();render();}
}
function initialRound(){
 // A small proactive discovery when visiting a research room for the first time.
 const id=ids[0];
 if(state.messages.some(m=>m.claim===id))return;
 state=API.runRound(state,id);save();
}
function setup(){
 const entry=document.createElement("section");
 entry.id="hdcInline";entry.setAttribute("aria-label","本页专职研究Agent");
 const content=$("page-content");content.parentNode.insertBefore(entry,content);
 const overlay=document.createElement("div");overlay.id="hdcBackdrop";overlay.className="hdc-backdrop";overlay.hidden=true;
 const drawer=document.createElement("aside");drawer.id="hdcDrawer";drawer.className="hdc-drawer";drawer.setAttribute("role","dialog");drawer.setAttribute("aria-label","海南Agent研究争论台");drawer.setAttribute("aria-modal","true");
 document.body.append(overlay,drawer);
 overlay.addEventListener("click",closeDrawer);
 document.addEventListener("click",e=>{
  const b=e.target.closest("[data-hdc]");
  if(b){act(b.dataset.hdc,b);return;}
  if(e.target.closest("#hdcOpen")){openDrawer();return;}
  const experience=e.target.closest("[data-act]");if(experience)onExperience(experience.dataset.act,experience);
 });
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&open){e.preventDefault();closeDrawer();} if(open&&e.key==="Tab"){const focusables=[...drawer.querySelectorAll('button:not([disabled]),a[href],input,textarea,select,[tabindex]:not([tabindex="-1"])')].filter(el=>el.getClientRects().length);if(focusables.length){const first=focusables[0],last=focusables[focusables.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}});
 initialRound();
 if(qClaim&&API.claimFor(state,qClaim)){state.active=qClaim;save();}
 render();
 if(qClaim&&API.claimFor(state,qClaim))setTimeout(()=>openDrawer("debate"),200);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",setup,{once:true});else setup();
})();