/* Hainan Industrial Research Lab V2
   Typed observed evidence + explicit candidate mechanisms + conditional exercises.
   No synthetic network edge feeds into GDP. Do not equate simulator outputs with predictions. */
(function(root,factory){const obj=factory(root.HainanModel);root.HainanResearch=obj;if(typeof module!=="undefined"&&module.exports)module.exports=obj;})(typeof globalThis!=="undefined"?globalThis:this,function(M){
"use strict";
if(!M)throw Error("HainanModel V1 required");
const SOURCES={
 ...M.SOURCES,
 year:"https://stats.hainan.gov.cn/tjj/tjgb/fzgb/2023_88252/202602/t20260226_4032927.html",
 latest:"https://stats.hainan.gov.cn/tjj/ywdt/xwfb/202609/t20260918_4149645.html",
 industry:"https://stats.hainan.gov.cn/tjj/ywdt/xwfb/202609/t20260922_4152139.html",
 investments:"https://stats.hainan.gov.cn/tjj/ywdt/xwfb/202609/t20260918_4149646.html",
 recent:"https://www.cei.cn/defaultsite/s/article/2026/10/30/4b4ff607-9d914745-01a1-8b8b5a47-08d2_home.html?columnId=4028c7ca-37115425-0137-115c411b-1128&referCode=dqbghaifx",
 methodsEnroads:"https://mitsloan.mit.edu/centers-initiatives/climate-policy-center/mit-climate-pathways-project/simulators",
 methodsRand:"https://www.rand.org/content/dam/rand/pubs/research_reports/RR1200/RR1286/RAND_RR1286.pdf",
 methodsWB:"https://www.worldbank.org/en/data/interactive/2025/12/15/trade-simulator-tariffs"
};
const INDICATORS=[
 {id:"gdp25",value:8108.85,unit:"亿元",name:"2025地区生产总值",period:"2025全年",tier:"A",source:"year",type:"现价规模"},
 {id:"gdp26",value:1.2,unit:"%",name:"GDP实际同比",period:"2026年前三季度",tier:"B",source:"recent",type:"不变价"},
 {id:"industrial25",value:9.9,unit:"%",name:"规上工业增加值同比",period:"2025全年",tier:"A",source:"year",type:"可比价"},
 {id:"industrial26",value:-6.2,unit:"%",name:"规上工业增加值同比",period:"2026年1—8月",tier:"A",source:"latest",type:"可比价"},
 {id:"trade26",value:55.2,unit:"%",name:"货物进出口金额同比",period:"2026年1—8月",tier:"A",source:"latest",type:"货物贸易金额"},
 {id:"invest26",value:-10.3,unit:"%",name:"固定资产投资同比",period:"2026年1—8月",tier:"A",source:"latest",type:"投资金额"},
 {id:"tourism25",value:10.5,unit:"%",name:"游客总花费同比",period:"2025全年",tier:"A",source:"year",type:"支出金额"},
 {id:"hightech25",value:28.1,unit:"%",name:"规上高技术制造同比",period:"2025全年",tier:"A",source:"year",type:"规上工业子集"},
 {id:"mining25",value:40.4,unit:"%",name:"采矿业增加值同比",period:"2025全年",tier:"A",source:"year",type:"工业门类"},
 {id:"construction25",value:-10.4,unit:"%",name:"建筑业增加值实际同比",period:"2025全年",tier:"A",source:"year",type:"第二产业分项"},
 {id:"consumer26",value:6.5,unit:"%",name:"规上消费品制造同比",period:"2026年1—8月",tier:"A",source:"industry",type:"规上工业子集"},
 {id:"infrastructure26",value:10.2,unit:"%",name:"基础设施投资同比",period:"2026年1—8月",tier:"A",source:"investments",type:"投资分项"}
];
const CLUSTERS=[
 {id:"trade",title:"港航与开放贸易",icon:"⚓",theme:"cyan",fact:"2026年1—8月进出口同比+55.2%",period:"2026年1—8月",source:"latest",question:"外贸扩张，哪些生产、加工和物流订单真正发生在岛内？",value:"跨境贸易 ≠ 岛内增加值",need:"企业级加工环节、物流收入、采购归属地与服务增加值",competing:["转口与进口结构变化","岛内加工增加值同步增长","贸易时间窗口与工业分行业不同步"]},
 {id:"industry",title:"制造、能源与高技术",icon:"⚙",theme:"blue",fact:"2025规上高技术制造同比+28.1%",period:"2025全年",source:"year",question:"工业增长的内部结构是否可能被少数行业主导？",value:"子行业增长 ≠ 总体增长贡献",need:"高技术制造增加值基数、产能利用率、项目实际投产日与价格变动",competing:["采矿与制造同步贡献","行业价格和基数变化","2026年检修扰动"]},
 {id:"service",title:"现代服务与消费",icon:"✦",theme:"violet",fact:"2025服务业增加值5002.44亿元",period:"2025全年",source:"year",question:"研发、检测、工业软件与结算等高价值服务能否被岛内承接？",value:"服务业大 ≠ 生产性服务充分",need:"分行业服务增加值、企业服务采购地及结算链",competing:["消费者服务主导","专业服务逐步扩展","总部和供应商在岛外"]},
 {id:"agri",title:"热带农业与冷链",icon:"❀",theme:"green",fact:"2025第一产业增加值1642.55亿元",period:"2025全年",source:"year",question:"种养规模增加，农户能否通过加工、冷链和议价获得更高收入？",value:"产量 ≠ 农户净收入",need:"订单价格、加工率、冷链损耗、账期及农户增值份额",competing:["加工收益留岛","贸易商获得主要利润","损耗和回款吞噬增长"]},
 {id:"tourism",title:"旅游、医疗与体验",icon:"☼",theme:"amber",fact:"2025游客总花费同比+10.5%",period:"2025全年",source:"year",question:"旅游热度如何传给岗位工资、医疗消费、在地服务和居民收入？",value:"游客花费 ≠ 增加值或利润",need:"分场景消费、企业成本、工资、外部平台抽成与医疗服务量",competing:["游客消费升级","资本与平台收益外流","季节性就业波动"]}
];
const NODES=[
 {id:"port",name:"口岸与物流",short:"港航",x:124,y:144,icon:"⚓",group:"通道",desc:"港口与贸易便利改变连接的可能性，不等于岛内自动创造增加值"},
 {id:"manufacture",name:"制造与能源",short:"制造",x:362,y:102,icon:"⚙",group:"生产",desc:"真实产量、价格和项目兑现存在不同时间尺度"},
 {id:"services",name:"研发与专业服务",short:"服务",x:630,y:160,icon:"✧",group:"能力",desc:"研发检测物流与数字服务的本地采购份额尚不可识别"},
 {id:"tourism",name:"旅游消费",short:"旅游",x:703,y:368,icon:"☼",group:"流量",desc:"游客花费、企业利润和居民收入必须拆开核算"},
 {id:"talent",name:"人才与知识",short:"人才",x:475,y:266,icon:"◇",group:"能力",desc:"岗位、知识服务和人才流动尚无可靠因果弹性"},
 {id:"agri",name:"热带农业",short:"农业",x:128,y:389,icon:"❀",group:"生产",desc:"产量不能等同农户可支配收入"},
 {id:"processing",name:"冷链与加工",short:"加工",x:348,y:451,icon:"◈",group:"转换",desc:"真实损耗、账期、加工增值尚待核实"},
 {id:"income",name:"居民就业收入",short:"居民",x:604,y:472,icon:"⌂",group:"结果",desc:"岛内收入分配无法仅从产业总量推导"}
];
const EDGES=[
 ["port","manufacture","physical","物流进入"],["manufacture","port","physical","货运出岛"],["agri","processing","physical","农产加工"],["processing","port","physical","冷链发运"],["processing","tourism","physical","在岛消费"],
 ["manufacture","services","value","专业服务采购"],["port","services","value","口岸服务采购"],["tourism","services","value","商业与数字服务"],["agri","income","value","农户收入"],["manufacture","income","value","制造就业"],["services","income","value","服务就业"],["tourism","income","value","消费就业"],
 ["talent","manufacture","knowledge","技能与工程"],["talent","services","knowledge","专业人才"],["services","manufacture","knowledge","研发检测"],["services","processing","knowledge","加工技术"],["talent","tourism","knowledge","旅游服务人才"],["talent","agri","knowledge","农业技术"]
].map((z,i)=>({id:"e"+i,from:z[0],to:z[1],layer:z[2],label:z[3],grade:"H"}));
const LAYERS={all:"全部候选联系",physical:"货物与生产",value:"支付与价值",knowledge:"技能与知识"};
const UNKNOWNS=[
 {id:"servicePurchase",name:"制造企业专业服务采购地",why:"缺分母则无法知道本地采购率",minimum:"匿名采购额及本地/岛外供货分类",effect:"收窄本地服务采购留存的识别集"},
 {id:"io",name:"海南产业投入产出关系",why:"不能从假设网络推出GDP损失",minimum:"合法获得的部门间交易矩阵与岛外进口/转入比",effect:"建立可审计的投入产出压力传播"},
 {id:"firm",name:"项目兑现与产能使用",why:"投资与工业变化时间尺度不同",minimum:"项目投产日期、行业产量及产能利用率",effect:"区分存量产能释放与下一轮项目接续"},
 {id:"jobs",name:"就业工资与居民获得感",why:"产出增长不一定让每个人受益",minimum:"分行业工资、岗位稳定性、就业与消费数据",effect:"建立真实的福利与收入分配核验"},
 {id:"survey",name:"企业调查与潜变量测量",why:"不能用合成问卷直接推定企业行为",minimum:"抽样框、题项、有效样本与无应答偏差",effect:"允许正式SEM/PLS测量验证"}
];
const sum=a=>a.reduce((s,x)=>s+x,0);
function jsd(a,b){const p=a.map(x=>x/sum(a)),q=b.map(x=>x/sum(b)),m=p.map((x,i)=>(x+q[i])/2);const d=(v,w)=>sum(v.map((x,i)=>x?x*Math.log2(x/w[i]):0));return Math.sqrt(Math.max(0,(d(p,m)+d(q,m))/2));}
function history(){const rows=M.historical();return {rows,change:rows[rows.length-1].sectors.map((x,i)=>x-rows[0].sectors[i]),compositionDistance:jsd(rows[0].sectors,rows[rows.length-1].sectors),vintage:"各年初始公报，未统一终核"};}
function graph(opts={}){
 const layer=LAYERS[opts.layer]?opts.layer:"all",removed=opts.remove||"none",intensity=M.clamp(opts.intensity??.42,0,.8),rounds=Math.round(M.clamp(opts.rounds??3,1,5)),start=NODES.some(x=>x.id===opts.start)?opts.start:"port";
 let edges=EDGES.filter(e=>(layer==="all"||e.layer===layer)&&e.id!==removed);
 const deg=Object.fromEntries(NODES.map(n=>[n.id,edges.filter(e=>e.from===n.id).length]));
 let cur=Object.fromEntries(NODES.map(n=>[n.id,n.id===start?1:0])),total={...cur},waves=[{...cur}];
 for(let k=0;k<rounds;k++){const next=Object.fromEntries(NODES.map(n=>[n.id,0]));for(let e of edges){if(deg[e.from])next[e.to]+=cur[e.from]*intensity/deg[e.from];}
 for(const n of NODES)total[n.id]+=next[n.id];waves.push(next);cur=next;}
 const top=Object.entries(total).sort((a,b)=>b[1]-a[1]);
 const degree=NODES.map(n=>({id:n.id,name:n.name,out:deg[n.id],in:edges.filter(e=>e.to===n.id).length})).sort((a,b)=>b.in+b.out-a.in-a.out);
 return {layer,edges,nodes:NODES,waves,exposure:total,top,degree,reached:Object.values(total).filter(x=>x>1e-9).length,meta:"H级候选边，单位冲击仅为无量纲示意；不映射为GDP、岗位或实际损失"};
}
function accounting(opts={}){const lower=M.clamp(opts.lower??20,0,100),upper=M.clamp(opts.upper??80,0,100),vlow=M.clamp(opts.vlow??25,0,100),vhigh=M.clamp(opts.vhigh??70,0,100),s0=Math.min(lower,upper)/100,s1=Math.max(lower,upper)/100,v0=Math.min(vlow,vhigh)/100,v1=Math.max(vlow,vhigh)/100;
 const min=100*s0*v0,max=100*s1*v1,point=100*((s0+s1)/2)*((v0+v1)/2);
 return{min,max,point,width:max-min,assumption:{share:[s0,s1],va:[v0,v1]},components:{localPay:100*(s0+s1)/2,external:100*(1-(s0+s1)/2),value:point,intermediate:100*(s0+s1)/2-point},limits:"无真实采购地与增加值率时[0,100]。当前范围全部是人为假设，不能叫统计置信区间。"};}
function deterministic(rates,model="constant",shock=0){const base=M.DATA.sectors.slice(),defaultRates=[3,4,4.5];for(let year=2026;year<=2030;year++)for(let i=0;i<3;i++){
 const rate=model==="delay"&&year===2026?defaultRates[i]:model==="decay"?defaultRates[i]+(rates[i]-defaultRates[i])*Math.pow(.7,year-2026):rates[i];
 base[i]*=1+(rate-((year===2027||year===2028)?shock:0))/100;
 }return {total:sum(base),sectors:base};}
function grid(opts={}){const industrial=M.clamp(opts.industrial??4,-6,10),services=M.clamp(opts.services??4.5,-2,11),agri=M.clamp(opts.agri??3,-3,9),shock=M.clamp(opts.shock??0,0,8),target=M.clamp(opts.target??10000,7000,15000),cells=[];
 const xs=Array.from({length:11},(_,i)=>industrial-5+i),ys=Array.from({length:11},(_,i)=>services-5+i);
 for(let row=0;row<11;row++)for(let col=0;col<11;col++){const x=M.clamp(xs[col],-8,13),y=M.clamp(ys[row],-6,11),v=deterministic([agri,x,y],"constant",shock).total;cells.push({row,col,x,y,total:v,pass:v>=target});}
 const pass=cells.filter(z=>z.pass).length;
 return{cells,count:cells.length,pass,share:pass/cells.length*100,target,meta:"11×11条件格：覆盖率只是人为扫描格中的达标比例，不是现实概率。"};}
const STRATEGIES=[
 {id:"balanced",name:"均衡缓进",rates:[4,5,5],meaning:"三产渐进，不突出单部门"},
 {id:"manufacture",name:"制造接续",rates:[3,7.5,4],meaning:"以制造增长假设为主要变化"},
 {id:"services",name:"服务沉淀",rates:[3,4,7],meaning:"以本地服务增长假设为主要变化"},
 {id:"agri",name:"农业链升级",rates:[6.5,4.5,4.5],meaning:"以农业名义增长假设为主要变化"}
];
function robust(){
 const cases=[],ids=["constant","decay","delay"],shocks=[0,2,5];
 for(const model of ids)for(const shock of shocks){const options=STRATEGIES.map(s=>({id:s.id,total:deterministic(s.rates,model,shock).total}));let best=Math.max(...options.map(x=>x.total));cases.push({model,shock,options:options.map(x=>({...x,regret:best-x.total}))});}
 const strategies=STRATEGIES.map(s=>{const values=cases.map(c=>c.options.find(x=>x.id===s.id));return {...s,min:Math.min(...values.map(x=>x.total)),max:Math.max(...values.map(x=>x.total)),maxRegret:Math.max(...values.map(x=>x.regret)),meanRegret:sum(values.map(x=>x.regret))/values.length};}).sort((a,b)=>a.maxRegret-b.maxRegret);
 return {cases,strategies,meta:"模拟策略并非预算等成本政策包；只是预先定义的增长假设组合，minimax regret为演示判别而非政策最优性。"};
}
function backtest(){const h=M.historical(),cases=[];for(let i=2;i<h.length;i++){const prev=h[i-1],older=h[i-2],target=h[i],grow=prev.sectors.map((x,j)=>x/older.sectors[j]-1),pred=sum(prev.sectors.map((v,j)=>v*(1+grow[j])));cases.push({year:target.year,observed:target.gdp,naive:pred,error:pred-target.gdp,absPct:Math.abs(pred-target.gdp)/target.gdp*100});}
 return {cases,mape:sum(cases.map(x=>x.absPct))/cases.length,caution:"仅四个一年留出点；使用不同初始公报现价数据，不能宣称经过严谨样本外验证，更不是政策模型检验。"};}
function controlsDigest(c={}){const obj=M.sanitize(c);return JSON.stringify({modelVersion:M.VERSION,rates:obj.rates,shock:obj.shock,model:obj.model,volatility:obj.volatility,breakLink:obj.breakLink,localShare:obj.localShare,supplierVA:obj.supplierVA});}
return {M,SOURCES,INDICATORS,CLUSTERS,NODES,EDGES,LAYERS,UNKNOWNS,STRATEGIES,history,jsd,graph,accounting,deterministic,grid,robust,backtest,controlsDigest};
});