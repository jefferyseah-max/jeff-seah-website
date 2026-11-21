(function(){
  'use strict';
  var panels=Array.from(document.querySelectorAll('.feature-panel'));
  var links=Array.from(document.querySelectorAll('[data-feature-link]'));
  var controls=document.querySelector('.tour-controls');
  if(!panels.length||!controls)return;
  var current=0,timer=null,playing=false;
  var reduce=matchMedia('(prefers-reduced-motion: reduce)');
  var play=document.querySelector('#tour-play'),prev=document.querySelector('#tour-prev'),next=document.querySelector('#tour-next');
  function stop(){clearTimeout(timer);timer=null;playing=false;play.textContent='Play guided tour';play.setAttribute('aria-pressed','false');}
  function schedule(){clearTimeout(timer);if(playing&&!document.hidden)timer=setTimeout(function(){if(current<panels.length-1){show(current+1,'tour',true);schedule();}else stop();},30000);}
  function show(index,trigger,updateHash){
    current=index;
    panels.forEach(function(panel,i){panel.hidden=i!==index;panel.classList.toggle('is-active',i===index);});
    links.forEach(function(link,i){if(i===index)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');});
    prev.disabled=index===0;next.disabled=index===panels.length-1;
    document.querySelector('#tour-count').textContent=(index+1)+' of '+panels.length+' · '+panels[index].querySelector('h2').textContent;
    if(updateHash)history.replaceState(null,'','#'+panels[index].id);
    document.dispatchEvent(new CustomEvent('tongshu-feature-view',{detail:{feature:panels[index].id,trigger:trigger}}));
  }
  links.forEach(function(link,i){link.addEventListener('click',function(event){event.preventDefault();stop();show(i,'feature-menu',true);document.querySelector('#feature-stage').scrollIntoView({behavior:reduce.matches?'instant':'smooth',block:'start'});});});
  prev.addEventListener('click',function(){stop();show(Math.max(0,current-1),'previous',true);});
  next.addEventListener('click',function(){stop();show(Math.min(panels.length-1,current+1),'next',true);});
  play.addEventListener('click',function(){if(playing){stop();return;}if(current===panels.length-1)show(0,'replay',true);playing=true;play.textContent='Pause guided tour';play.setAttribute('aria-pressed','true');schedule();});
  document.addEventListener('visibilitychange',function(){if(document.hidden)clearTimeout(timer);else schedule();});
  addEventListener('hashchange',function(){var i=panels.findIndex(function(p){return '#'+p.id===location.hash;});if(i>=0){stop();show(i,'deep-link',false);}});
  controls.hidden=false;
  var initial=panels.findIndex(function(p){return '#'+p.id===location.hash;});
  show(initial<0?0:initial,'initial',false);
})();
