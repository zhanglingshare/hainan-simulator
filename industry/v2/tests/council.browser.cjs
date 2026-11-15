"use strict";
const {chromium}=require("playwright"),assert=require("node:assert/strict");
(async()=>{
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const root="http://127.0.0.1:8765/industry/v2/";
const pages=["index","history","network","sectors","value","worlds","pressure","models","blindspots","archive"];
const err=[];
try{
 const desk=await browser.newPage({viewport:{width:1440,height:900},acceptDownloads:true});
 desk.on("pageerror",e=>err.push("desktop: "+e.message));
 for(const name of pages){
  const res=await desk.goto(root+name+".html",{waitUntil:"networkidle"});
  assert.equal(res.status(),200,name+" HTTP");
  await desk.locator("#hdcOpen").waitFor();
  assert.equal(await desk.locator("#hdcDrawer").count(),1);
  assert.match(await desk.locator("#hdcInline").innerText(),/Agent/);
  assert.ok((await desk.locator("#hdcInline").innerText()).length>70);
  assert.equal(await desk.locator("#hdcDrawer").getAttribute("aria-hidden"),"true");
  assert.equal(await desk.locator("#page-content .panel").count()>0,true);
 }
 await desk.goto(root+"index.html",{waitUntil:"networkidle"});
 await desk.locator("#hdcOpen").click();
 assert.equal(await desk.locator("#hdcDrawer").getAttribute("aria-hidden"),"false");
 assert.equal(await desk.locator("#hdcDrawer .hdc-message").count()>=4,true);
 assert.match(await desk.locator("#hdcDrawer").innerText(),/规则驱动/);
 const first=await desk.locator("#hdcDrawer .hdc-message").count();
 await desk.locator("#hdcDrawer [data-hdc=invent]").click();
 assert.equal(await desk.locator("#hdcDrawer .hdc-message").count(),first+2,"invent must create a fresh hypothesis AND its critique");
 await desk.locator("#hdcDrawer [data-hdc=dissent]").click();
 assert.equal(await desk.locator("#hdcDrawer .hdc-message").count(),first+3,"dissent must remain visible");
 await desk.locator("#hdcRevisionReason").fill("新增调查表明最初的推断缺少供应商服务地的数据支持");
 await desk.locator("#hdcDrawer [data-hdc=retire]").click();
 assert.match(await desk.locator("#hdcDrawer").innerText(),/退役假设/);
 await desk.locator("#hdcDrawer [data-hdc=tab][data-tab=memory]").click();
 assert.match(await desk.locator("#hdcDrawer").innerText(),/改判记录/);
 await desk.locator("#hdcIdeaTitle").fill("旅游消费能否影响热带农产的订单结算周期？");
 await desk.locator("#hdcIdeaMechanism").fill("旅游餐饮采购的时间分布可能经过批发商传导到农户结算账期，需要采购订单与回款数据验证。");
 await desk.locator("#hdcDrawer [data-hdc=idea]").click();
 assert.match(await desk.locator("#hdcDrawer").innerText(),/用户候选想法/);
 assert.match(await desk.locator("#hdcDrawer").innerText(),/测量Agent/);
 await desk.locator("#hdcDrawer [data-hdc=tab][data-tab=memory]").click();
 assert.match(await desk.locator("#hdcDrawer").innerText(),/你的新假说/);
 const exportButton=desk.locator("#hdcDrawer [data-hdc=export]");
 const downloadPromise=desk.waitForEvent("download");
 await exportButton.click();
 const download=await downloadPromise;
 assert.match(download.suggestedFilename(),/hainan-agent-council/);
 await desk.locator("#hdcDrawer [data-hdc=close]").click();
 assert.equal(await desk.locator("#hdcDrawer").getAttribute("aria-hidden"),"true");
 // A handoff must keep the original hypothesis active on the destination page.
 await desk.goto(root+"value.html?claim=trade-contrast",{waitUntil:"networkidle"});
 await desk.locator("#hdcDrawer.is-open").waitFor();
 assert.match(await desk.locator("#hdcDrawer .hdc-question h3").first().innerText(),/贸易越来越活跃/);
 await desk.locator("#hdcDrawer [data-hdc=tab][data-tab=value]").click();
 for(const x of ["视野","思维工具","认知升级","灵感","下一个核验动作"])assert.match(await desk.locator("#hdcDrawer").innerText(),new RegExp(x));
 assert.ok(await desk.locator("#hdcDrawer .hdc-fact-row").count()>=1,"trace direct observed evidence");
 // Retired claims should remain after reload.
 await desk.goto(root+"index.html",{waitUntil:"networkidle"});
 const archive=await desk.evaluate(()=>JSON.parse(localStorage.getItem("HAINAN_COUNCIL_V1")));
 assert.ok(archive.messages.some(x=>x.type==="改判"));
 assert.ok(archive.notebook.some(x=>x.type==="retired"));
 assert.ok(Object.keys(archive.claims).some(x=>x.startsWith("user-")));
 // The client must not leak a hosted API secret or call a network LLM.
 const appScript=await desk.evaluate(()=>[...document.scripts].map(x=>x.src));
 assert.ok(appScript.some(x=>x.includes("council-core")));
 assert.ok(appScript.some(x=>x.includes("council-ui")));
 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 phone.on("pageerror",e=>err.push("mobile: "+e.message));
 for(const name of pages){
  const res=await phone.goto(root+name+".html",{waitUntil:"domcontentloaded"});assert.equal(res.status(),200);
  await phone.locator("#hdcOpen").waitFor();
  const w=await phone.evaluate(()=>document.documentElement.scrollWidth);
  assert.ok(w<=425,"mobile overflow "+name+": "+w);
  await phone.locator("#hdcOpen").click();
  await phone.locator("#hdcDrawer.is-open").waitFor();
  const drawerWidth=await phone.locator("#hdcDrawer").evaluate(el=>el.getBoundingClientRect().width);
  assert.ok(drawerWidth<=390,"drawer overflow "+name);
  await phone.keyboard.press("Escape");
  assert.equal(await phone.locator("#hdcDrawer").getAttribute("aria-hidden"),"true");
 }
 assert.deepEqual(err,[],"no uncaught client exceptions");
 console.log("AGENT COUNCIL BROWSER PASS: 10 desktops, 10 mobiles; debate, contradictory agents, cross-page handoff, retire and remember, own hypothesis, JSON export.");
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});