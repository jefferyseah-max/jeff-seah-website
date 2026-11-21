// Anonymous guide measurements. Fixed event labels only; no email, code or full URLs.
(function(){
  'use strict';
  var pages={'/portal-guide':'portal-guide','/tongshu-guide':'tongshu-guide'};
  var page=pages[location.pathname.replace(/\.html$|\/$/g,'')];
  var params=new URLSearchParams(location.search);
  if(!page||!['jeffseah.rocks','www.jeffseah.rocks'].includes(location.hostname)||params.has('noanalytics')||navigator.webdriver)return;
  var endpoint='https://jeffseah-engagement.jefferyseah.workers.dev/events';
  var visit=crypto.randomUUID(),sequence=0,queue=[],sent=new Set(),active=0,last=performance.now(),input=last,depth=0,snapshot='';
  var label=function(x){return /^[a-zA-Z0-9_-]{1,80}$/.test(x||'')?x:'';};
  var source=label(params.get('utm_source'))||'direct',campaign=label(params.get('utm_campaign'));
  function flush(){
    if(!queue.length)return;
    var batch=queue.splice(0,20);
    fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({events:batch}),credentials:'omit',keepalive:true}).then(function(r){if(!r.ok&&r.status!==400&&r.status!==429)queue=batch.concat(queue).slice(0,100);}).catch(function(){queue=batch.concat(queue).slice(0,100);});
  }
  function track(name,data){queue.push({id:visit+':'+(++sequence),visit:visit,page:page,name:name,source:source,campaign:campaign,device:matchMedia('(pointer: coarse)').matches?'mobile':'desktop',data:data||{}});if(queue.length>=10)flush();}
  function once(key,name,data){if(!sent.has(key)){sent.add(key);track(name,data);}}
  function tick(){var now=performance.now();if(!document.hidden&&now-input<60000)active+=Math.max(0,Math.min(1500,now-last));last=now;[15,30,60,120,300].forEach(function(s){if(active>=s*1000)once('active:'+s,'Active reading',{seconds:s});});}
  function checkpoint(){tick();var value=Math.floor(active/1000)+':'+depth;if(value!==snapshot){snapshot=value;track('Engagement',{active_seconds:Math.floor(active/1000),max_scroll:depth});}flush();}
  ['pointerdown','keydown','touchstart','scroll'].forEach(function(event){addEventListener(event,function(){input=performance.now();},{passive:true});});
  addEventListener('scroll',function(){var height=document.documentElement.scrollHeight-innerHeight;depth=Math.max(depth,height>0?Math.min(100,Math.round(scrollY/height*100)):100);[25,50,75,100].forEach(function(p){if(depth>=p)once('scroll:'+p,'Scroll depth',{percent:p});});},{passive:true});
  document.addEventListener('visibilitychange',function(){if(document.hidden)checkpoint();else{last=performance.now();input=last;}});
  addEventListener('pagehide',checkpoint);
  setInterval(tick,1000);setInterval(function(){if(!document.hidden)checkpoint();},15000);
  document.addEventListener('click',function(event){var link=event.target.closest('a[data-track-target]');if(!link)return;track('Link clicked',{target:label(link.dataset.trackTarget),placement:label(link.dataset.trackPlacement)});flush();},true);
  document.addEventListener('tongshu-feature-view',function(event){var detail=event.detail||{};track('Feature viewed',{feature:label(detail.feature),trigger:label(detail.trigger)});flush();});
  document.querySelectorAll('details[data-track-help]').forEach(function(d){d.addEventListener('toggle',function(){if(d.open){track('Help opened',{target:label(d.dataset.trackHelp)});flush();}});});
  document.querySelectorAll('video[data-guide-video]').forEach(function(video){
    video.addEventListener('playing',function(){once('video-start','Video started',{video:'portal-v4'});flush();});
    video.addEventListener('timeupdate',function(){if(document.hidden||!Number.isFinite(video.duration)||video.duration<=0)return;[25,50,75,95].forEach(function(p){if(video.currentTime/video.duration*100>=p)once('video:'+p,'Video progress',{video:'portal-v4',percent:p});});});
    video.addEventListener('ended',function(){once('video:100','Video progress',{video:'portal-v4',percent:100});flush();});
  });
  track('Page visit');flush();
})();
