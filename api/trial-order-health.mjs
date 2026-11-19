import {TRIAL_RECEIVER} from '../lib/trial-order.mjs';
const equal=(a,b)=>{if(!a||!b||a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;};
export async function GET(request){
 const secret=process.env.PORTAL_TRIAL_SIGNUP_SECRET;
 if(!secret||!equal(request.headers.get('Authorization'),'Bearer '+secret))return new Response('Not found',{status:404});
 const headers={'Cache-Control':'no-store','Content-Type':'application/json'};
 try{const r=await fetch(TRIAL_RECEIVER,{method:'POST',headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json'},body:JSON.stringify({version:1,kind:'probe'}),signal:AbortSignal.timeout(15000)});
  const receipt=await r.json();if(!r.ok||receipt.ok!==true||receipt.version!=='trial-order-autostart-v1')throw Error('Receiver unavailable');
  return new Response(JSON.stringify({ok:true,enabled:process.env.TRIAL_ORDER_AUTOSTART_ENABLED==='enabled',receiverVerified:true,version:'trial-order-autostart-v1'}),{headers});
 }catch{return new Response(JSON.stringify({ok:false}),{status:503,headers});}
}
