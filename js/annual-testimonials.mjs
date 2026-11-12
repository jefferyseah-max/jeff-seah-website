export function validateTestimonials(items) {
  if(!Array.isArray(items)||items.length>100)throw Error('Invalid testimonial list');
  const ids=new Set();
  for(const item of items){if(!item||typeof item.id!=='string'||!/^[a-f0-9-]{36}$/i.test(item.id)||ids.has(item.id)||item.year!==2027||typeof item.name!=='string'||!item.name.trim()||item.name.length>80||typeof item.quote!=='string'||!item.quote.trim()||item.quote.length>1500||!(item.rating===null||(Number.isInteger(item.rating)&&item.rating>=1&&item.rating<=5))||Object.hasOwn(item,'comparisonRating')&&!(item.comparisonRating===null||Number.isInteger(item.comparisonRating)&&item.comparisonRating>=1&&item.comparisonRating<=5)||Object.hasOwn(item,'highlight')&&!(typeof item.highlight==='string'&&item.highlight.trim()&&item.quote.includes(item.highlight))||Object.keys(item).some(key=>!['id','year','name','quote','highlight','rating','comparisonRating'].includes(key)))throw Error('Invalid public testimonial');ids.add(item.id);}
  return items;
}

const addScore=(card,score,title,comparison=false)=>{const rating=document.createElement('p');rating.className='annual-testimonial-stars';const label=document.createElement('span');label.className='annual-testimonial-rating-label';label.textContent=title;const stars=document.createElement('span');stars.setAttribute('aria-label',title+': '+score+' out of 5 stars');stars.textContent='★'.repeat(score)+'☆'.repeat(5-score);rating.append(label,stars);if(comparison){const scale=document.createElement('span');scale.className='annual-testimonial-rating-scale';scale.textContent='1: Very similar · 5: Refreshingly different';rating.append(scale)}card.append(rating)};
const addScores=(card,item)=>{if(item.rating!==null)addScore(card,item.rating,'Overall experience');if(item.comparisonRating!==undefined&&item.comparisonRating!==null)addScore(card,item.comparisonRating,'Compared with previous reports',true)};

// Words as spans so the dial can ink them in one by one; the highlight phrase is gold.
function inkQuote(item){
  const text=document.createElement('p'),q=item.quote,h=item.highlight,k=h?q.indexOf(h):-1;
  const parts=k<0?[[q,false]]:[[q.slice(0,k),false],[h,true],[q.slice(k+h.length),false]];
  let n=0;
  for(const [chunk,gold] of parts)for(const piece of chunk.split(/(\s+)/)){
    if(!piece)continue;
    if(/^\s+$/.test(piece)){text.append(document.createTextNode(' '));continue}
    const w=document.createElement('span');w.className='rd-w'+(gold?' rd-gold':'');w.style.setProperty('--i',n++);w.textContent=piece;text.append(w);
  }
  return [text,n];
}

function renderGrid(cards,items){
  cards.className='annual-testimonial-grid';
  for(const item of items){
    const card=document.createElement('figure');card.className='annual-testimonial-card';addScores(card,item);
    const quote=document.createElement('blockquote'),text=document.createElement('p');text.textContent=item.quote;quote.append(text);const author=document.createElement('figcaption');author.textContent=item.name;card.append(quote,author);cards.append(card);
  }
}

const SVG='http://www.w3.org/2000/svg';
function renderDial(section,cards,items){
  const N=items.length,span=Math.min(140,22*(N-1)),angle=i=>N<2?0:-span/2+i*span/(N-1);
  cards.className='rd';cards.setAttribute('role','region');cards.setAttribute('aria-roledescription','carousel');cards.setAttribute('aria-label','Reader experiences');

  const svg=document.createElementNS(SVG,'svg');svg.setAttribute('viewBox','0 0 280 104');svg.setAttribute('class','rd-dial');svg.setAttribute('aria-hidden','true');
  const arc=document.createElementNS(SVG,'path');arc.setAttribute('d','M24 98 A116 116 0 0 1 256 98');arc.setAttribute('class','rd-arc');svg.append(arc);
  const ticks=items.map((_,i)=>{const a=(angle(i)-90)*Math.PI/180,c=document.createElementNS(SVG,'circle');c.setAttribute('cx',(140+Math.cos(a)*104).toFixed(2));c.setAttribute('cy',(98+Math.sin(a)*104).toFixed(2));c.setAttribute('r','5.5');c.setAttribute('class','rd-tick');c.addEventListener('click',()=>{go(i);hold()});svg.append(c);return c});
  const hand=document.createElementNS(SVG,'line');hand.setAttribute('x1','140');hand.setAttribute('y1','98');hand.setAttribute('x2','140');hand.setAttribute('y2','18');hand.setAttribute('class','rd-hand');
  const hub=document.createElementNS(SVG,'circle');hub.setAttribute('cx','140');hub.setAttribute('cy','98');hub.setAttribute('r','4');hub.setAttribute('class','rd-hub');svg.append(hand,hub);

  const stage=document.createElement('div');stage.className='rd-stage';stage.setAttribute('aria-live','off');
  const slides=items.map((item,i)=>{
    const fig=document.createElement('figure');fig.className='rd-slide';fig.setAttribute('role','group');fig.setAttribute('aria-roledescription','slide');fig.setAttribute('aria-label',(i+1)+' of '+N);addScores(fig,item);
    const quote=document.createElement('blockquote'),[text,words]=inkQuote(item);quote.append(text);
    const author=document.createElement('figcaption');author.textContent=item.name;author.style.setProperty('--i',words);
    fig.append(quote,author);fig.dataset.words=words;stage.append(fig);return fig;
  });

  const bar=document.createElement('div');bar.className='rd-bar';
  const btn=(label,glyph)=>{const b=document.createElement('button');b.type='button';b.className='rd-btn';b.setAttribute('aria-label',label);b.textContent=glyph;bar.append(b);return b};
  const prev=btn('Previous reader','←'),pause=btn('Pause','❙❙'),next=btn('Next reader','→');
  const count=document.createElement('span');count.className='rd-count';bar.append(count);
  // Every reader's highlight phrase at a glance, so the proof does not depend on waiting for the dial to turn.
  const marks=document.createElement('ul');marks.className='rd-marks';
  const markBtns=items.map((item,i)=>{if(!item.highlight)return null;const li=document.createElement('li'),b=document.createElement('button'),ph=document.createElement('b'),who=document.createElement('span');b.type='button';b.className='rd-mark';ph.textContent='“'+item.highlight+'”';who.textContent=item.name;b.append(ph,who);b.addEventListener('click',()=>{go(i);hold()});li.append(b);marks.append(li);return b});
  if(marks.children.length)cards.append(marks);
  cards.append(svg,stage,bar);

  let cur=-1,timer=0,auto=true,visible=false,hovering=false;
  function go(i){
    cur=(i+N)%N;
    slides.forEach((s,j)=>{const on=j===cur;s.classList.toggle('is-active',on);s.setAttribute('aria-hidden',on?'false':'true')});
    ticks.forEach((t,j)=>t.classList.toggle('is-on',j===cur));
    markBtns.forEach((b,j)=>{if(b)b.classList.toggle('is-on',j===cur)});
    hand.style.transform='rotate('+angle(cur)+'deg)';
    count.textContent=(cur+1)+' / '+N;
    schedule();
  }
  // Time on each reader scales with quote length so a 50-word quote can actually be read.
  function schedule(){clearTimeout(timer);if(auto&&visible&&!hovering)timer=setTimeout(()=>go(cur+1),Math.max(8000,Number(slides[cur].dataset.words)*260))}
  function setAuto(on){auto=on;pause.textContent=on?'❙❙':'▶';pause.setAttribute('aria-label',on?'Pause':'Play');stage.setAttribute('aria-live',on?'off':'polite');schedule()}
  const hold=()=>setAuto(false);
  prev.addEventListener('click',()=>{go(cur-1);hold()});
  next.addEventListener('click',()=>{go(cur+1);hold()});
  pause.addEventListener('click',()=>setAuto(!auto));
  cards.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){hovering=true;schedule()}});
  cards.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'){hovering=false;schedule()}});
  cards.addEventListener('focusin',()=>{hovering=true;schedule()});
  cards.addEventListener('focusout',e=>{if(!cards.contains(e.relatedTarget)){hovering=false;schedule()}});
  let x0=null;
  stage.addEventListener('pointerdown',e=>{x0=e.clientX});
  stage.addEventListener('pointerup',e=>{if(x0===null)return;const dx=e.clientX-x0;x0=null;if(Math.abs(dx)>40){go(cur+(dx<0?1:-1));hold()}});
  cards.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){go(cur+1);hold()}else if(e.key==='ArrowLeft'){go(cur-1);hold()}});

  // Nothing inks or advances until the dial is on screen; it rests again when scrolled away.
  section.hidden=false;
  if('IntersectionObserver' in window){
    new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible&&cur<0)go(0);else schedule()},{threshold:0.35}).observe(cards);
  }else{visible=true;go(0)}
}

export function renderTestimonials(section,items) {
  validateTestimonials(items);const cards=section.querySelector('[data-testimonial-cards]');cards.replaceChildren();
  const still=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(items.length>1&&!still)renderDial(section,cards,items);else renderGrid(cards,items);
  section.hidden=items.length===0;
}
if(typeof document!=='undefined'){
 const section=document.querySelector('[data-annual-testimonials]');
 if(section)fetch('/data/annual-2027-testimonials.json',{cache:'no-store'}).then(response=>{if(!response.ok)throw Error('Testimonial data unavailable');return response.json()}).then(items=>renderTestimonials(section,items)).catch(error=>{section.hidden=true;console.error('Annual testimonials could not be loaded:',error.message)});
}
