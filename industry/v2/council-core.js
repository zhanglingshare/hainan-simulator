/* Hainan Discovery Council v1.0: auditable research-role protocol.
 * All claims are hypotheses unless explicitly labelled observed.
 * Deterministic offline research agents, NOT autonomous hosted language models.
 */
(function(root,factory){const api=factory(root.HainanResearch,root.HainanModel);if(typeof module!=="undefined"&&module.exports)module.exports=api;root.HainanCouncil=api;})(typeof globalThis!=="undefined"?globalThis:this,function(R,M){
"use strict";
if(!R||!M)throw Error("HainanResearch and HainanModel required");
const VERSION="HDC-1.0.0";
const TYPES=["发现","质疑","交接","异见","改判"];
const AGENTS=[
 ["host","主持","把分歧摆上桌","怀疑被平均掉的假确定性","全站"],
 ["question","提问","寻找最值得重新提出的问题","怀疑含混问题与隐藏前提","discover"],
 ["data","数据","核对时间窗、总体与出处","怀疑没有来源或跨口径拼接的数字","history"],
 ["cliff","断崖","追踪订单、资金与兑现接续","怀疑流量会自动变成存量与收入","value"],
 ["measurement","测量","让每条推断拥有测量标准","怀疑代理信号被误称为事实","blindspots"],
 ["relation","关系","发现产业主体之间可能遗漏的连接","怀疑关联被当作因果","network"],
 ["mechanism","机制","提出竞争性生成机制","怀疑漂亮故事无法被反驳","sectors"],
 ["fragility","脆弱度","寻找结构断点与替代路径","怀疑平均情况掩盖最坏条件","pressure"],
 ["tunnel","风洞","比较不确定性与多个假设世界","怀疑单一输出与虚假精确","models"],
 ["counterfactual","反事实","比较不同初始条件的平行世界","怀疑改变一项条件就能识别政策效果","worlds"],
 ["brief","简报","凝练用户真正能带走的发现","怀疑没有条件的行动建议","全站"],
 ["archive","档案","保留原判断、退役错误与改判原因","怀疑丢失上下文的结论","archive"]
].map(([id,name,mission,skepticism,home])=>Object.freeze({id,name,mission,skepticism,home}));
const BY_PAGE={
 discover:["trade-contrast","industry-investment","tourism-benefit"],
 history:["history-vintage","industry-investment"],
 network:["hidden-services","agri-chain","trade-contrast"],
 sectors:["industry-investment","agri-chain","tourism-benefit"],
 value:["hidden-services","trade-contrast","tourism-benefit"],
 worlds:["scenario-identity","industry-investment"],
 pressure:["fragile-connectivity","scenario-identity"],
 models:["scenario-identity","history-vintage"],
 blindspots:["hidden-services","fragile-connectivity","history-vintage"],
 archive:["scenario-identity","hidden-services","trade-contrast"]
};
const LEADS={
 "trade-contrast":{
  title:"贸易越来越活跃，岛内专业服务是否真的接住了机会？",
  origin:"2026年1—8月货物进出口同比+55.2%，同期规上工业增加值同比−6.2%。两者统计对象不同，不能从差额推断价值外流。",
  construct:"是否存在贸易连接改善，但岛内研发、检测、物流及商务服务采购份额尚未同步提高的结构？",
  challenge:"进出口货值和工业增加值并不是同一经济量，也可能只是产品结构、时点与行业边界变化。没有企业采购去向，就无法确认服务承接不足。",
  rival:"竞争假说：岛内加工与服务承接正在改善，只是工业统计窗口、产能检修或货值构成使两条曲线短期分离。",
  test:"匿名企业服务采购地、加工/再出口比例、分行业工业增加值、供应商实际服务交付地。",
  vision:"把贸易规模与本地创造的价值拆成两个完全不同的问题。",
  tool:"用候选网络追踪‘港口→制造→服务’，再用采购账本检查识别边界。",
  insight:"外贸增长本身不能证明本地收入或供应商机会同步增加。",
  inspiration:"研究是否存在值得培育的岛内研发、检测、工业软件及专业服务供需桥梁。",
  retire:"如果实测匿名采购与增加值表明岛内承接持续增强，‘没有接住’这一方向应退役。",
  source:["trade26","industrial26"],inventor:"relation",reviewer:"data",dissenter:"mechanism",target:"value",grade:"H"
 },
 "industry-investment":{
  title:"工厂生产与项目投资背离，究竟是断档还是存量释放？",
  origin:"2025年规上工业增加值增长9.9%，固定资产投资下降16.5%；第二产业增速并不等同规上工业增速。",
  construct:"已建产能继续贡献产出，但新项目兑现可能出现时滞，是否形成下一轮产业接续约束？",
  challenge:"投资是当期投资流量，产出是已经投入运营的生产活动，指标方向不同不足以证明产能断档。",
  rival:"竞争假说：前期重大项目已投产，存量产能与生产效率提高，当前投资下降未必降低近期供给。",
  test:"重点项目投产日程、分行业产能利用率、建成产能、库存、投资资金构成与价格基准。",
  vision:"不能把‘今年投资下降’直接翻译成‘明年没有增长’。",
  tool:"进入产业史看不同结构，再到双世界进行‘项目延迟’条件实验。",
  insight:"先识别生产与投资之间的时间差，而不是套用一个投资乘数。",
  inspiration:"建立重点项目的‘从开工到实际出货’时间映射，可能发现隐蔽瓶颈。",
  retire:"若项目兑现率与产能利用率持续处于安全区间，断档解释应下调。",
  source:["industrial25","invest26"],inventor:"cliff",reviewer:"data",dissenter:"mechanism",target:"sectors",grade:"H"
 },
 "tourism-benefit":{
  title:"游客花费更多，为什么居民和小商户未必同样受益？",
  origin:"2025年海南游客总花费同比增长10.5%。游客花费不是GDP增加值，更不是企业利润或居民可支配收入。",
  construct:"旅游总消费上升时，收益是否因跨区采购、平台结算、房租和季节性就业而呈现不均衡分配？",
  challenge:"没有商户利润、工资和采购地数据，就不能把收入分配不均衡宣称为已观测事实。",
  rival:"竞争假说：旅游消费升级带来本地就业、品牌溢价和专业服务机会，收益可在产业链内逐渐扩散。",
  test:"游客分行业支出、商户经营利润、员工工资分布、平台抽成、采购地点和淡旺季分解。",
  vision:"游客花费增长与某个居民拿到多少钱之间隔着一张收入分配网。",
  tool:"用价值留岛中的100单位账本检查无法识别的环节。",
  insight:"单一消费总额不足以支撑居民获得感判断。",
  inspiration:"寻找本地供应商、旅游产品、医养与人才服务之间可核验的连接。",
  retire:"若真实样本显示当地工资和中小商户净利润稳定同步改善，该负面假说应退役。",
  source:["tourism25"],inventor:"mechanism",reviewer:"measurement",dissenter:"brief",target:"value",grade:"H"
 },
 "agri-chain":{
  title:"热带农产能否从多卖原料，走向多留加工与服务价值？",
  origin:"2025年第一产业增加值1642.55亿元，这是现价产业规模，并不能识别加工率、损耗率或农户净收入。",
  construct:"冷链、加工、订单回款和在地餐饮是否构成农户价值留存的关键联接？",
  challenge:"当前只有省级部门规模，缺少具体品类的加工流、价格和回款证据；网络连线只是候选关系。",
  rival:"竞争假说：某些品类已有充分的岛外加工与品牌渠道，本地全链条并不一定更高效或更有利农户。",
  test:"分品类产地收购价、运输损耗、合同账期、加工毛利、冷链利用率、实际收益分配。",
  vision:"原料产量不是农户净收入，增加本地加工也未必自动改善农户所得。",
  tool:"对候选‘农业→冷链加工→市场’联系做删边与替代路径实验。",
  insight:"价值提升问题可能首先是交易结构，而不是扩大种植面积。",
  inspiration:"跨接热带农产、旅游消费与冷链服务的合作订单，先找真正的损耗与回款瓶颈。",
  retire:"若真实数据表明本地加工成本高于收益或农户分配不改善，应退役本地加工必然更优的叙述。",
  source:["gdp25"],inventor:"relation",reviewer:"measurement",dissenter:"mechanism",target:"network",grade:"H"
 },
 "hidden-services":{
  title:"有没有一条被GDP总量掩盖的企业专业服务采购网络？",
  origin:"2025年第三产业增加值5002.44亿元，但省级产业总量无法识别制造企业服务采购地和供应商增加值率。",
  construct:"把制造、贸易、检测、研发、软件、财税、物流与本地人才看成潜在的生产性服务网络，是否存在被忽略的配套缺口？",
  challenge:"三产规模不能直接代表生产性服务。没有企业级采购额、真实供应商边和抽样框，这张网络只是结构假设。",
  rival:"竞争假说：专业服务在岛外采购可能是有效分工，而不是本地能力不足；本地化也可能提高成本。",
  test:"企业匿名分项采购额、服务交付地点、质量成本、供应商增加值率及替代价格。",
  vision:"行政边界内服务业很大，不代表本地制造业已获得所需的专业服务。",
  tool:"把本地采购份额设为未知区间，检查‘留岛率’能不能被真实数据识别。",
  insight:"缺少微观采购证据时，精确留存率不是发现，而可能是错觉。",
  inspiration:"建立产业供应商连接目录，让真实需求与服务能力先在问题层面对接。",
  retire:"若匿名采购与供给能力证明没有本地匹配需求，‘隐藏服务市场’应退出机会清单。",
  source:["gdp25"],inventor:"relation",reviewer:"measurement",dissenter:"cliff",target:"value",grade:"H"
 },
 "history-vintage":{
  title:"所谓产业转折，有多少来自统计口径与版本修订？",
  origin:"2020—2025年产业史使用各年的初始公报，不等于已经统一修订的最终可比时间序列。",
  construct:"重新选择统计基期或修订版本后，某些看似显著的结构断点是否会移动？",
  challenge:"没有全部年度统一修订序列，不能将原始年份间跳动归因为政策或产业转型。",
  rival:"竞争假说：即使统一修订，某些产业比例变化仍很明显，说明部分结构变化可能是稳健的。",
  test:"统一修订后的历年GDP与三产口径、经济普查调整、行业分类调整及分市县数据。",
  vision:"数字变化之前，先检查尺子有没有变。",
  tool:"比较三产组成距离、检查对应年份的统计公报版本。",
  insight:"历史事实和历史统计版本不是同一回事。",
  inspiration:"把证据版本本身做成可追踪时间轴，发现哪些旧结论值得改判。",
  retire:"获得统一修订序列后，将本假设从‘可能影响’改写为实测差异审计。",
  source:["gdp25"],inventor:"data",reviewer:"measurement",dissenter:"mechanism",target:"history",grade:"H"
 },
 "scenario-identity":{
  title:"一条漂亮的2030分布，究竟代表未来概率还是人为假设？",
  origin:"当前风洞以2025年现价基数出发，未来名义年增速、随机扰动和机制结构由研究者直接设定，未获得实证校准。",
  construct:"如果相同直接增速假设在不同演化机制下产生分歧，哪些结论依赖于‘模型怎么设’而不是‘现实是什么’？",
  challenge:"即使Monte Carlo跑十万次，也无法把没有校准的输入变成客观发生概率。",
  rival:"竞争假说：如果将来具备可比历史序列、项目兑现数据、投资和服务需求约束，就可能逐步缩小合理的参数范围。",
  test:"名义增长率历史估计、外部回测、预测误差诊断、结构机制校准与参数来源登记。",
  vision:"计算次数越多，不代表未知假设更真实。",
  tool:"固定随机种子改变一个条件，再比较三种机制的输出是否翻转。",
  insight:"必须分别报告模型内随机波动和模型结构分歧。",
  inspiration:"与其竞争谁的终值最好看，不如竞争谁能发现最脆弱的前提。",
  retire:"若有独立样本和参数校准，在新版本将模型升级为经验证的推断体系。",
  source:["gdp25"],inventor:"counterfactual",reviewer:"tunnel",dissenter:"measurement",target:"models",grade:"C"
 },
 "fragile-connectivity":{
  title:"产业网络最脆弱的，可能是一条还没有被测量的联系。",
  origin:"当前产业网络有8个功能节点及18条候选机制边，图层区分物流、支付/价值与知识；全部未观测企业级真实边权。",
  construct:"若删除一条候选关系，是否会出现功能节点无法通过当前假设路径获得服务或知识的结构空洞？",
  challenge:"有向图的可达性变化不能解释为真实GDP、就业损失，也不能证明断裂确实会发生。",
  rival:"竞争假说：真实产业网络具有多供应商、多地区和非正式替代渠道，所画断点在现实中可能并不脆弱。",
  test:"供应商替代率、真实合同关系、网络漏边率、恢复时长、跨行业冗余度。",
  vision:"一个指标看似安全，不代表真实网络里的替代路径充足。",
  tool:"切换货流、价值、知识三个候选图层，比较断边前后结构暴露。",
  insight:"结构韧性必须讨论连接的替代性，不只是节点数量。",
  inspiration:"优先发现关键连接的替代方案，而不是只扩大总量。",
  retire:"当真实多层数据表明网络冗余充足时，撤销脆弱断点判断。",
  source:["industrial26","trade26"],inventor:"fragility",reviewer:"relation",dissenter:"mechanism",target:"network",grade:"H"
 }
};
for(const [id,c] of Object.entries(LEADS)){LEADS[id]=Object.freeze({id,status:"未判定",...c});}
const CLAIMS=Object.freeze(LEADS);
const MAX_EVENTS=360,MAX_USER_CLAIMS=24;
function agent(id){return AGENTS.find(x=>x.id===id)||AGENTS[0];}
function evidence(id){const item=R.INDICATORS.find(x=>x.id===id);if(!item)return null;return {id:item.id,label:item.name,period:item.period,value:item.value,unit:item.unit,tier:item.tier,source:R.SOURCES[item.source],unitType:item.type};}
function gradeClaim(c){return c?.grade==="C"?"C":"H";}
function epistemic(c){const direct=(c.source||[]).map(evidence).filter(Boolean);return {hypothesis:gradeClaim(c),facts:direct,distinctSources:new Set(direct.map(x=>x.source)).size,gradeExplanation:direct.length?"公开指标只支持观察，尚不足以证明候选机制。":"用户提出的候选解释尚无核验来源。"};}
function fresh(){return {schema:VERSION,active:"trade-contrast",claims:{},messages:[],notebook:[],round:0};}
function safeText(v,max=600){return typeof v==="string"?v.trim().slice(0,max):"";}
function normalize(raw){
 const s=fresh();if(!raw||typeof raw!=="object")return s;
 if(raw.schema!==VERSION)return s;
 s.active=CLAIMS[raw.active]||String(raw.active||"").startsWith("user-")?String(raw.active):s.active;
 s.round=Number.isSafeInteger(raw.round)&&raw.round>=0?raw.round:0;
 if(raw.claims&&typeof raw.claims==="object"){
  for(const [id,v] of Object.entries(raw.claims).slice(0,MAX_USER_CLAIMS+Object.keys(CLAIMS).length)){
   if(!CLAIMS[id]&&!id.startsWith("user-"))continue;
   if(!v||typeof v!=="object")continue;
   const status=["open","challenged","retired","revised"].includes(v.status)?v.status:"open";
   const obj={status,reason:safeText(v.reason,500)};
   if(id.startsWith("user-")&&typeof v.title==="string"){obj.title=safeText(v.title,160);obj.construct=safeText(v.construct,520);obj.origin="用户提出的未经核实的候选关系";obj.challenge="请提供可观察单位、时点、反例与可靠来源";obj.rival="竞争解释尚需提出";obj.test="最少需要两类独立来源或可反驳观察";obj.vision="将直觉转化为可以挑战的研究问题";obj.tool="选择一名审查Agent核验命题";obj.insight="怀疑与证据分开记录";obj.inspiration="寻找没有被现有假说覆盖的关系";obj.retire="有更强反证时退役";obj.source=[];obj.grade="H";obj.inventor="question";obj.reviewer="measurement";obj.dissenter="host";obj.target="blindspots";}
   s.claims[id]=obj;
  }
 }
 if(Array.isArray(raw.messages))s.messages=raw.messages.slice(-MAX_EVENTS).filter(m=>m&&TYPES.includes(m.type)&&safeText(m.text).length>0).map(m=>({id:safeText(m.id,80),type:m.type,agent:safeText(m.agent,30),target:safeText(m.target,30),claim:safeText(m.claim,80),text:safeText(m.text,1100),tier:["A","B","C","H"].includes(m.tier)?m.tier:"H",refs:Array.isArray(m.refs)?m.refs.filter(x=>typeof x==="string").slice(0,5):[],parentId:safeText(m.parentId,80),date:safeText(m.date,40),round:Number(m.round)||0,reason:safeText(m.reason,600)}));
 if(Array.isArray(raw.notebook))s.notebook=raw.notebook.slice(-120).map(x=>({claim:safeText(x.claim,80),type:safeText(x.type,24),note:safeText(x.note,600),date:safeText(x.date,40)}));
 return s;
}
function claimFor(s,id){if(CLAIMS[id])return CLAIMS[id];if(s.claims[id]&&String(id).startsWith("user-"))return {id,...s.claims[id]};return null;}
function append(s,record){
 const d=normalize(s),round=d.round+1;
 const message={id:VERSION+"-"+round,type:record.type,agent:record.agent||"host",target:record.target||"",claim:record.claim,
 text:safeText(record.text,1100),tier:record.tier||"H",refs:record.refs||[],parentId:record.parentId||"",date:new Date().toISOString(),round,reason:record.reason||""};
 if(!TYPES.includes(message.type)||!claimFor(d,message.claim))throw Error("invalid council message");
 d.round=round;d.active=message.claim;d.messages.push(message);d.messages=d.messages.slice(-MAX_EVENTS);return d;
}
function runRound(raw,id){
 let s=normalize(raw),c=claimFor(s,id);if(!c)throw Error("unknown research claim");
 const evid=epistemic(c);const first=evid.facts.map(x=>x.label+"（"+x.period+"）").join("、");
 const start=s.messages.length;
 s=append(s,{type:"发现",agent:c.inventor,target:c.reviewer,claim:id,text:"【建构之手】"+c.construct+"。观察起点："+c.origin,tier:gradeClaim(c),refs:c.source||[]});
 s=append(s,{type:"质疑",agent:c.reviewer,target:c.inventor,claim:id,text:"【验证之手】"+c.challenge+"。当前能直接核对的指标："+(first||"暂无独立指标")+"；"+evid.gradeExplanation,tier:gradeClaim(c),refs:c.source||[],parentId:s.messages[s.messages.length-1].id});
 s=append(s,{type:"异见",agent:c.dissenter,target:c.inventor,claim:id,text:"我反对直接认定最初解释。"+c.rival,tier:gradeClaim(c),refs:c.source||[],parentId:s.messages[start].id});
 s=append(s,{type:"交接",agent:"host",target:agentForPage(c.target),claim:id,text:"将未解决的问题交给「"+agent(agentForPage(c.target)).name+"」：优先核验 "+c.test+"。保留异见，不平均成共识。",tier:gradeClaim(c),refs:c.source||[]});
 if(!s.claims[id])s.claims[id]={status:"open",reason:""};return s;
}
function agentForPage(page){return ({discover:"question",history:"data",network:"relation",sectors:"mechanism",value:"cliff",worlds:"counterfactual",pressure:"fragility",models:"tunnel",blindspots:"measurement",archive:"archive"})[page]||"host";}
function workPage(page){return BY_PAGE[page]||BY_PAGE.discover;}
function debate(raw,id,kind){
 let s=normalize(raw),c=claimFor(s,id);if(!c)throw Error("unknown claim");const {facts}=epistemic(c);
 if(kind==="challenge"){s=append(s,{type:"质疑",agent:"measurement",target:c.inventor,claim:id,text:"请公开能使该解释被推翻的观察："+c.retire+"。当前最先缺的是："+c.test,tier:gradeClaim(c),refs:c.source||[]});}
 else if(kind==="invent"){s=append(s,{type:"发现",agent:"relation",target:"mechanism",claim:id,text:"【跨域候选连接，不是事实】"+c.inspiration+"。研究者下一步应先把主体、交易、时序和替代解释明确化。",tier:"H",refs:[]});
  s=append(s,{type:"质疑",agent:"data",target:"relation",claim:id,text:"这个灵感尚无独立实证支持。现有"+facts.length+"个观察指标不等于机制证据，先核验："+c.test,tier:"H",refs:c.source||[]});}
 else if(kind==="dissent"){s=append(s,{type:"异见",agent:c.dissenter,target:c.inventor,claim:id,text:"另一种同样需要验证的解释："+c.rival+"。禁止把多Agent多数票包装成概率。",tier:gradeClaim(c),refs:c.source||[]});}
 else throw Error("unknown debate action");
 s.claims[id]=s.claims[id]||{status:"open",reason:""};s.claims[id].status="challenged";return s;
}
function revise(raw,id,status,reason){
 if(!["retired","revised","open"].includes(status))throw Error("invalid revision");
 const r=safeText(reason,400);if(r.length<8)throw Error("必须写出至少8字的改判理由");
 let s=normalize(raw),c=claimFor(s,id);if(!c)throw Error("unknown claim");
 s.claims[id]={...s.claims[id],status,reason:r};
 s=append(s,{type:"改判",agent:"archive",target:c.inventor,claim:id,text:(status==="retired"?"【退役假设】":status==="revised"?"【条件改判】":"【重新开放】")+r+"。原始争论流完整保留，状态更新不代表外部事实已获得认证。",tier:gradeClaim(c),refs:c.source||[],reason:r});
 s.notebook.push({claim:id,type:status,note:r,date:new Date().toISOString()});s.notebook=s.notebook.slice(-120);return s;
}
function addHypothesis(raw,title,construct){
 let s=normalize(raw),t=safeText(title,160),x=safeText(construct,500);
 if(t.length<8||x.length<12)throw Error("标题至少8字，候选机制至少12字");
 const existing=Object.entries(s.claims).filter(([k])=>k.startsWith("user-")).length;
 if(existing>=MAX_USER_CLAIMS)throw Error("本地自建假设达到24个，请先导出研究档案");
 const id="user-"+Date.now().toString(36)+"-"+((s.round+1)%10000);
 s.claims[id]={status:"open",reason:"",title:t,construct:x};
 s=append(s,{type:"发现",agent:"question",target:"measurement",claim:id,text:"【用户候选想法·H级】"+t+"；可能机制："+x+"。尚无独立证据，下一步要找能推翻它的事实。",tier:"H",refs:[]});
 s=append(s,{type:"交接",agent:"host",target:"measurement",claim:id,text:"交给测量Agent：核对观察单位、时间窗、潜在反例及必要证据。用户输入不能自动升级为A级事实。",tier:"H",refs:[]});
 return {state:s,id};
}
function exportState(raw){const s=normalize(raw);return {schema:VERSION,modelVersion:M.VERSION,sourceVersion:"2025官方/2026阶段观察",generated:new Date().toISOString(),state:s,description:"离线规则驱动Agent通信；非联网LLM；所有候选机制均需人工/真实资料验证。"};}
return {VERSION,TYPES,AGENTS,BY_PAGE,CLAIMS,MAX_EVENTS,MAX_USER_CLAIMS,agent,agentForPage,workPage,evidence,epistemic,fresh,normalize,claimFor,runRound,debate,revise,addHypothesis,exportState};
});