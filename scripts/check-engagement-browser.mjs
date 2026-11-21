import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=process.cwd(),types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.mp4':'video/mp4','.webp':'image/webp','.jpg':'image/jpeg'};
const server=createServer(async(req,res)=>{
 try{let pathname=new URL(req.url,'http://localhost').pathname;let file=resolve(root,'.'+pathname+(extname(pathname)?'':'.html'));
  if(!file.startsWith(root+'\\')&&!file.startsWith(root+'/')){res.writeHead(403);return res.end();}
  const data=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(data);
 }catch{res.writeHead(404);res.end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const browser=await chromium.launch({headless:true,channel:'chrome'}),base='http://127.0.0.1:'+server.address().port;
try{
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage(),events=[];
  await page.addInitScript(()=>Object.defineProperty(navigator,'webdriver',{get:()=>false}));
  await page.route('**/events',async route=>{events.push(...JSON.parse(route.request().postData()).events);await route.fulfill({status:200,body:'{}',headers:{'Access-Control-Allow-Origin':'*'}});});
  await page.route('**/_vercel/insights/script.js',route=>route.fulfill({contentType:'text/javascript',body:'window.va=function(){};'}));
  await page.clock.install();await page.goto(base+'/2027?utm_source=qa_test');await page.clock.fastForward(9000);
  await page.locator('#teaser').scrollIntoViewIfNeeded();await page.clock.runFor(1000);
  await page.locator('#birthYear').fill('1988',{force:true});await page.locator('#birthYear').dispatchEvent('change');
  if(mobile){
   await page.evaluate(()=>scrollTo(0,3000));await page.clock.fastForward(100);
   await page.evaluate(()=>scrollTo(0,1000));await page.clock.fastForward(100);
  }else await page.locator('body').dispatchEvent('mouseout',{bubbles:true,clientY:0,relatedTarget:null});
  await page.locator('#exit-offer').waitFor({state:'visible'});
  await page.getByRole('button',{name:'No thanks, keep reading'}).click();
  await page.clock.fastForward(16000);
  for(let attempt=0;attempt<30&&!events.some(e=>e.name==='Popup dismissed');attempt++)await new Promise(done=>setTimeout(done,100));
  assert.equal(events.filter(e=>e.name==='Popup shown').length,1);
  assert.equal(events.find(e=>e.name==='Popup shown').data.trigger,mobile?'mobile-scroll':'desktop-exit');
  assert.equal(events.find(e=>e.name==='Popup dismissed').data.reason,'keep-reading');
  assert.ok(events.some(e=>e.name==='Tool used'));
  assert.doesNotMatch(JSON.stringify(events),/1988|birthYear/);
  console.log((mobile?'Mobile':'Desktop')+': actual popup, dismissal and tool events verified; form values excluded.');
  await context.close();
 }
}finally{await browser.close();await new Promise(done=>server.close(done));}
