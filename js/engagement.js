// Anonymous /2027 engagement. No form values, birth details, full URLs or ad-click IDs.
(function () {
  if (!/^\/2027\/?$/.test(location.pathname)) return;
  var params = new URLSearchParams(location.search);
  if (params.has('exit') || params.has('noanalytics') || navigator.webdriver) return;
  var endpoint = 'https://jeffseah-engagement.jefferyseah.workers.dev/events';
  var visit = crypto.randomUUID(), sequence = 0, queue = [], active = 0, depth = 0;
  var lastTick = performance.now(), lastInput = lastTick, sent = {}, leaving = false, lastSnapshot = '';
  var tags = {};
  try { var saved = JSON.parse(localStorage.getItem('js_attr') || 'null');
    if (saved && Date.now() - saved.at < 30 * 864e5) tags = saved;
  } catch (_) {}
  // Only campaign labels are sent. Query strings, oppref and form inputs never leave here.
  var label = function (value) { return /^[a-zA-Z0-9_-]{1,80}$/.test(value || '') ? value : ''; };
  var source = label(params.get('utm_source') || (params.has('oppref') ? 'chatgpt' : tags.source)) || 'direct';
  var campaign = label(params.get('utm_campaign') || tags.campaign);
  var device = matchMedia('(pointer: coarse)').matches ? 'mobile' : 'desktop';
  function track(name, data) {
    queue.push({id: visit + ':' + (++sequence), visit: visit, name: name,
      source: source, campaign: campaign, device: device, data: data || {}});
    if (queue.length >= 10) flush();
  }
  function once(key, name, data) { if (!sent[key]) { sent[key] = true; track(name, data); } }
  function flush() {
    if (!queue.length) return;
    var batch = queue.splice(0, 20), payload = JSON.stringify({events: batch});
    fetch(endpoint, {method:'POST', headers:{'Content-Type':'text/plain'}, body:payload,
      credentials:'omit', keepalive:true}).then(function (response) {
        if (!response.ok && response.status !== 400 && response.status !== 429) queue = batch.concat(queue).slice(0, 100);
      }).catch(function () { queue = batch.concat(queue).slice(0, 100); });
  }
  window.jsrEngagement = track;
  function tick() {
    var now = performance.now();
    // A visible tab counts for up to 60 seconds since the last input; hidden and idle time do not.
    if (!document.hidden && now - lastInput < 60000) active += Math.max(0, Math.min(now-lastTick, 1500));
    lastTick = now;
    [15,30,60,120,300].forEach(function (seconds) {
      if (active >= seconds*1000) once('active:'+seconds, 'Active reading', {seconds:seconds});
    });
  }
  function checkpoint() {
    tick(); var seconds=Math.floor(active/1000),snapshot=seconds+':'+depth;
    if(snapshot!==lastSnapshot){lastSnapshot=snapshot;track('Engagement',{active_seconds:seconds,max_scroll:depth});}
    flush();
  }
  ['pointerdown','keydown','touchstart','scroll'].forEach(function (event) {
    addEventListener(event, function () { lastInput=performance.now(); }, {passive:true});
  });
  addEventListener('scroll', function () {
    var height = document.documentElement.scrollHeight-innerHeight;
    depth = Math.max(depth, height>0 ? Math.min(100, Math.round(scrollY/height*100)) : 100);
    [25,50,75,100].forEach(function (percent) { if(depth>=percent) once('scroll:'+percent,'Scroll depth',{percent:percent}); });
  }, {passive:true});
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) checkpoint(); else { lastTick=performance.now(); lastInput=lastTick; leaving=false; }
  });
  addEventListener('pagehide', function () { if(!leaving) { leaving=true; checkpoint(); } });
  setInterval(tick,1000); setInterval(function(){if(!document.hidden)checkpoint();},15000);
  document.addEventListener('click', function (event) {
    var button=event.target.closest('button, a'); if(!button) return;
    var action=button.getAttribute('data-engagement');
    if(action) once('tool:'+action,'Tool used',{tool:action});
    var link=button.getAttribute('href')||'';
    if(link.indexOf('https://buy.stripe.com/')===0) {
      var url=new URL(link), placement=(url.searchParams.get('client_reference_id')||'').split('__')[0];
      track(url.pathname.indexOf('8x2cN72QvegSf6y1LPbwk05')!==-1?'Trial checkout':'Checkout',
        {placement:label(placement)||'none'}); flush();
    }
  },true);
  document.addEventListener('change',function(event){ if(event.target.matches('[data-engagement]')) once('tool:contact-clash','Tool used',{tool:'contact-clash'}); });
  document.querySelectorAll('video[data-sample-video],video[data-xo-video]').forEach(function(video){
    var name=video.hasAttribute('data-xo-video')?'popup':'sample';
    video.addEventListener('playing',function(){once('video:'+name,'Video started',{video:name});});
    video.addEventListener('volumechange',function(){if(!video.muted)once('sound:'+name,'Video sound on',{video:name});});
    video.addEventListener('timeupdate',function(){
      if(document.hidden||!Number.isFinite(video.duration)||video.duration<=0)return;
      var rect=video.getBoundingClientRect(); if(rect.bottom<=0||rect.top>=innerHeight)return;
      [25,50,75,95].forEach(function(percent){ if(video.currentTime/video.duration*100>=percent) once('video:'+name+':'+percent,'Video progress',{video:name,percent:percent}); });
    });
  });
  track('Page visit'); flush();
})();
