export function validateTestimonials(items) {
  if(!Array.isArray(items)||items.length>100)throw Error('Invalid testimonial list');
  const ids=new Set();
  for(const item of items){if(!item||typeof item.id!=='string'||!/^[a-f0-9-]{36}$/i.test(item.id)||ids.has(item.id)||item.year!==2027||typeof item.name!=='string'||!item.name.trim()||item.name.length>80||typeof item.quote!=='string'||!item.quote.trim()||item.quote.length>1500||!(item.rating===null||(Number.isInteger(item.rating)&&item.rating>=1&&item.rating<=5))||Object.hasOwn(item,'comparisonRating')&&!(item.comparisonRating===null||Number.isInteger(item.comparisonRating)&&item.comparisonRating>=1&&item.comparisonRating<=5)||Object.keys(item).some(key=>!['id','year','name','quote','rating','comparisonRating'].includes(key)))throw Error('Invalid public testimonial');ids.add(item.id);}
  return items;
}
export function renderTestimonials(section,items) {
  validateTestimonials(items);const cards=section.querySelector('[data-testimonial-cards]');cards.replaceChildren();
  for(const item of items){
    const card=document.createElement('figure');card.className='annual-testimonial-card';
    const addScore=(score,title,comparison=false)=>{const rating=document.createElement('p');rating.className='annual-testimonial-stars';const label=document.createElement('span');label.className='annual-testimonial-rating-label';label.textContent=title;const stars=document.createElement('span');stars.setAttribute('aria-label',title+': '+score+' out of 5 stars');stars.textContent='★'.repeat(score)+'☆'.repeat(5-score);rating.append(label,stars);if(comparison){const scale=document.createElement('span');scale.className='annual-testimonial-rating-scale';scale.textContent='1: Very similar · 5: Refreshingly different';rating.append(scale)}card.append(rating)};
    if(item.rating!==null)addScore(item.rating,'Overall experience');
    if(item.comparisonRating!==undefined&&item.comparisonRating!==null)addScore(item.comparisonRating,'Compared with previous reports',true);
    const quote=document.createElement('blockquote'),text=document.createElement('p');text.textContent=item.quote;quote.append(text);const author=document.createElement('figcaption');author.textContent=item.name;card.append(quote,author);cards.append(card)
  }
  section.hidden=items.length===0;
}
if(typeof document!=='undefined'){
 const section=document.querySelector('[data-annual-testimonials]');
 if(section)fetch('/data/annual-2027-testimonials.json',{cache:'no-store'}).then(response=>{if(!response.ok)throw Error('Testimonial data unavailable');return response.json()}).then(items=>renderTestimonials(section,items)).catch(error=>{section.hidden=true;console.error('Annual testimonials could not be loaded:',error.message)});
}
