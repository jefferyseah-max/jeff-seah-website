import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire('C:/Users/jeffe/Developer/home-reno-website/package.json');
const {chromium}=require('playwright');
const root=process.cwd(),out=resolve(process.env.PORTAL_GUIDE_QA||'G:/AgentDesk/Client Monthly Workflow/output/portal-guide-20261122/features-qa');
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'}),results=[];
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.vtt':'text/vtt'};
async function fixture(context,events){
 await context.addInitScript(()=>Object.defineProperty(navigator,'webdriver',{get:()=>false}));
 await context.route('https://jeffseah.rocks/**',async route=>{
  const pathname=new URL(route.request().url()).pathname;
  try{const file=resolve(root,'.'+pathname+(extname(pathname)?'':'.html'));assert.ok(file.startsWith(root));const body=await readFile(file);await route.fulfill({status:200,contentType:types[extname(file)]||'application/octet-stream',body});}
  catch{await route.fulfill({status:404,body:'Fixture not found'});}
 });
 await context.route('**/events',async route=>{events.push(...JSON.parse(route.request().postData()).events);await route.fulfill({status:200,body:'{}',headers:{'Access-Control-Allow-Origin':'*'}});});
}
try{
 for(const width of [1440,390,320]){
  const events=[],context=await browser.newContext({viewport:{width,height:1000},reducedMotion:width===320?'reduce':'no-preference'});
  await fixture(context,events);const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install();
  await page.goto('https://jeffseah.rocks/portal-guide?utm_source=qa_test&email=must-not-collect');
  assert.equal(await page.locator('.feature-cards>a').count(),8);
  assert.ok(await page.locator('.video-section+section').getAttribute('class').then(x=>x.includes('feature-intro')));
  assert.equal(await page.locator('video track').getAttribute('kind'),'captions');
  await page.evaluate(()=>document.addEventListener('click',e=>{if(e.target.closest('a[data-track-target]'))e.preventDefault();}));
  await page.locator('.hero-actions a.button').click();
  await page.locator('details').first().locator('summary').click();
  await page.waitForFunction(()=>document.querySelector('video').readyState>=1);
  const video=await page.locator('video').evaluate(async v=>{v.muted=true;await v.play();return {width:v.videoWidth,height:v.videoHeight,duration:v.duration};});
  assert.equal(video.width,1920);assert.ok(Math.abs(video.duration-523.178)<.2);
  await page.waitForFunction(()=>document.querySelector('video').currentTime>0);
  await page.locator('video').evaluate(v=>{v.pause();v.currentTime=v.duration*.51;v.dispatchEvent(new Event('timeupdate'));});
  await page.evaluate(()=>dispatchEvent(new Event('pagehide')));
  await page.waitForTimeout(100);
  assert.ok(events.some(e=>e.page==='portal-guide'&&e.name==='Page visit'));
  assert.ok(events.some(e=>e.name==='Link clicked'&&e.data.target==='portal'&&e.data.placement==='hero'));
  assert.ok(events.some(e=>e.name==='Video started'));
  assert.ok(events.some(e=>e.name==='Video progress'&&e.data.percent===50));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.screenshot({path:resolve(out,`portal-${width}.png`),fullPage:true});
  await page.goto('https://jeffseah.rocks/tongshu-guide#saved-dates');
  assert.equal(await page.locator('.feature-panel:visible').getAttribute('id'),'saved-dates');
  await page.locator('[data-feature-link]').first().click();
  for(let i=0;i<8;i++){
   assert.equal(await page.locator('.feature-panel:visible').count(),1);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Overflow at ${width}, feature ${i}`);
   if(width===390)await page.screenshot({path:resolve(out,`feature-${i+1}.png`),fullPage:true});
   if(i<7)await page.locator('#tour-next').click();
  }
  await page.locator('[data-feature-link]').first().click();await page.locator('#tour-play').click();
  await page.clock.fastForward(30100);assert.equal(await page.locator('.feature-panel:visible').getAttribute('id'),'today');
  await page.locator('#tour-play').click();await page.clock.fastForward(31000);assert.equal(await page.locator('.feature-panel:visible').getAttribute('id'),'today');
  if(width===320)assert.equal(await page.locator('.feature-panel:visible .flow-in').first().evaluate(el=>getComputedStyle(el).animationName),'none');
  assert.equal(errors.length,0,errors.join('\n'));
  assert.doesNotMatch(JSON.stringify(events),/must-not-collect|email=|123456|reports\.jeffseah|buy\.stripe/);
  assert.ok(events.some(e=>e.page==='tongshu-guide'&&e.name==='Feature viewed'&&e.data.feature==='saved-dates'));
  results.push({width,overflow:false,features:8,captions:true,video,events:events.length,errors});
  await context.close();
 }
 const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});const page=await nojs.newPage();await page.goto('http://127.0.0.1:8768/tongshu-guide.html');assert.equal(await page.locator('.feature-panel:visible').count(),8);await nojs.close();
 // The actual local preview must not send events even in an ordinary human browser context.
 const local=await browser.newContext();await local.addInitScript(()=>Object.defineProperty(navigator,'webdriver',{get:()=>false}));let requests=0;local.on('request',r=>{if(r.url().endsWith('/events'))requests++;});const lp=await local.newPage();await lp.goto('http://127.0.0.1:8768/portal-guide.html');await lp.evaluate(()=>dispatchEvent(new Event('pagehide')));assert.equal(requests,0);await local.close();
 await writeFile(resolve(out,'verification.json'),JSON.stringify({results,noJavaScriptReadable:true,localPreviewExcluded:true,productionEventsIntercepted:true},null,2));
 console.log(JSON.stringify({passed:true,widths:results.map(r=>r.width),features:8,tracking:'intercepted and verified',noJavaScriptReadable:true,localPreviewExcluded:true}));
}finally{await browser.close();}
