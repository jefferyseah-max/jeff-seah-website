export const EVENT_NAMES = new Set(['Page visit','Engagement','Active reading','Scroll depth','Tool used','Popup shown','Popup dismissed','Video started','Video sound on','Video progress','Trial checkout','Checkout']);
const text = value => typeof value === 'string' && /^[A-Za-z0-9_-]{0,80}$/.test(value) ? value : '';
const integer = (value,max) => Number.isInteger(value) && value>=0 && value<=max;
export function cleanEvent(input) {
  if(!input || !EVENT_NAMES.has(input.name) || !/^[a-f0-9-]{36}:\d{1,5}$/.test(input.id||'') || !/^[a-f0-9-]{36}$/.test(input.visit||'') || !input.id.startsWith(input.visit+':')) return null;
  if(!['mobile','desktop'].includes(input.device))return null;
  const data={}, original=input.data||{};
  for(const key of ['placement','trigger','reason','tool','video'])if(text(original[key]))data[key]=text(original[key]);
  for(const key of ['percent','max_scroll'])if(integer(original[key],100))data[key]=original[key];
  for(const key of ['seconds','active_seconds'])if(integer(original[key],86400))data[key]=original[key];
  return {id:input.id,visit:input.visit,name:input.name,source:text(input.source)||'direct',campaign:text(input.campaign),device:input.device,data};
}
