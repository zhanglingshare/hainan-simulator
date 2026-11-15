"use strict";
const {chromium}=require("playwright"),assert=require("node:assert/strict");
(async()=>{
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]}),errors=[];
const base="http://127.0.0.1:8765/industry/v2/";
const pages=["index","history","network","sectors","value","worlds","pressure","models","blindspots","archive"];
try{
 const page=await browser.newPage({viewport:{width:1440,height:900},acceptDownloads:true});
 page.on("pageerror",e=>errors.push("desktop "+e.message));
 for(const path of pages){
  const res=await page.goto(base+path+".html",{waitUntil:"networkidle"});
  assert.equal(res.status(),200,path+" HTTP");
  await page.locator("#page-content .panel").first().waitFor();
  assert.ok((await page.locator("#page-content").innerText()).length>220,path+" needs substantive research content");
  assert.equal(await page.locator(".nav a").count(),10,"ten nav items on "+path);
 }
 await page.goto(base+"index.html");await page.locator("#mapMenu").click();
 assert.equal(await page.locator("#navMap").isVisible(),true,"research map opens on demand");
 assert.equal(await page.locator("#navMap a").count(),10);
 await page.keyboard.press("Escape");assert.equal(await page.locator("#navMap").isVisible(),false,"Escape dismisses map");
 await page.locator("[data-act=guess][data-v='1']").click();
 assert.match(await page.locator("#page-content").innerText(),/判断正确/);
 await page.goto(base+"history.html");await page.locator("[data-act=year][data-v='2020']").click();
 assert.match(await page.locator("#page-content").innerText(),/2020/);
 await page.goto(base+"network.html");assert.equal(await page.locator(".network-svg .node").count(),8);
 await page.locator(".network-svg .node[data-node=services]").click();
 assert.match(await page.locator("#page-content").innerText(),/研发与专业服务/);
 await page.locator("[data-act=layer][data-v='physical']").click();
 await page.locator("#removeEdge").selectOption("e0");
 assert.match(await page.locator(".network-svg .cut").count().then(String),/1/);
 await page.goto(base+"sectors.html");await page.locator("[data-act=sector][data-v=agri]").click();
 assert.match(await page.locator("#page-content").innerText(),/冷链|农户/);
 await page.goto(base+"value.html");assert.equal(await page.locator(".heatcell").count(),121);
 await page.locator("[data-act=valueCell][data-x='50'][data-y='50']").click();
 assert.match(await page.locator("#page-content").innerText(),/25\.0/);
 await page.goto(base+"worlds.html");const before=await page.locator(".contrast .value-big").nth(1).innerText();
 await page.locator("#rate1").evaluate(el=>{el.value="8";el.dispatchEvent(new Event("input",{bubbles:true}));el.dispatchEvent(new Event("change",{bubbles:true}));});
 const after=await page.locator(".contrast .value-big").nth(1).innerText();
 assert.notEqual(before,after,"sector rate changes rendered trajectory");
 await page.locator("[data-act=saveWorld]").click();
 await page.goto(base+"pressure.html");assert.equal(await page.locator(".heatcell").count(),121);
 await page.locator(".heatcell").nth(60).click();await page.waitForURL("**/industry/v2/worlds.html");
 await page.goto(base+"models.html");assert.match(await page.locator("#page-content").innerText(),/最坏后悔值/);
 await page.goto(base+"blindspots.html");await page.locator("[data-act=challenge][data-v='1']").click();await page.locator("[data-act=saveGap]").click();
 await page.goto(base+"archive.html");assert.ok(await page.locator("[data-act=restore]").count()>0,"previous world recorded");
 assert.match(await page.locator("#page-content").innerText(),/待核验问题/);
 const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 mobile.on("pageerror",e=>errors.push("mobile "+e.message));
 for(const path of pages){
  const res=await mobile.goto(base+path+".html",{waitUntil:"domcontentloaded"});
  assert.equal(res.status(),200,"mobile "+path);
  await mobile.locator("#page-content .panel").first().waitFor();
  const width=await mobile.evaluate(()=>document.documentElement.scrollWidth);
  assert.ok(width<=425,"horizontal overflow "+path+" "+width);
 }
 assert.deepEqual(errors,[],"uncaught JS errors");
 console.log("PASS 10 desktop pages and 10 mobile pages + guesses, time series, 3-layer network, edge removal, sector drill, value grid, scenario, archive and red-team");
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});