import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {trialSignupFact,relayTrialSignup,TRIAL_RECEIVER,TRIAL_PAYMENT_LINK} from '../lib/trial-order.mjs';
import {CALENDAR_PRICE} from '../lib/billing-anchor.mjs';
import {POST} from '../api/stripe-webhook.mjs';
const now=Math.floor(Date.now()/1000);
const subscription={id:'evt_SubCreated',created:now,type:'customer.subscription.created',livemode:true,data:{object:{id:'sub_FictionalTrial',object:'subscription',customer:'cus_FictionalTrial',livemode:true,status:'trialing',trial_start:now,trial_end:now+30*86400,items:{data:[{price:{id:CALENDAR_PRICE},quantity:1}]},metadata:{birthDate:'not forwarded'},default_payment_method:{id:'pm_private'}}}};
const checkout={id:'evt_Checkout',created:now,type:'checkout.session.completed',livemode:true,data:{object:{id:'cs_live_Fictional',mode:'subscription',subscription:'sub_FictionalTrial',customer:'cus_FictionalTrial',customer_details:{email:'fictional@example.invalid',name:'Fictional buyer'},payment_link:TRIAL_PAYMENT_LINK,status:'complete',payment_status:'no_payment_required',livemode:true}}};
test('only known live checkout and subscription facts are selected, never birth or payment method details',()=>{
 const sub=trialSignupFact(subscription),c=trialSignupFact(checkout);assert.equal(sub.priceId,CALENDAR_PRICE);assert.equal(c.sessionId,'cs_live_Fictional');assert.equal(c.email,'fictional@example.invalid');assert.doesNotMatch(JSON.stringify(sub),/birthDate|default_payment_method|pm_private/);
 for(const event of [{...checkout,livemode:false},{...checkout,data:{object:{...checkout.data.object,payment_link:'plink_other'}}},{...subscription,data:{object:{...subscription.data.object,items:{data:[{price:{id:'price_other'}}]}}}}])assert.equal(trialSignupFact(event),null);
 const update={...subscription,type:'customer.subscription.updated',data:{object:{...subscription.data.object,items:{data:[{price:{id:'price_upgraded'}}]}}}};assert.equal(trialSignupFact(update).priceId,'price_upgraded');
});
test('receipt acknowledgements are required and transport errors expose no private response body',async()=>{
 let called=false;const result=await relayTrialSignup(checkout,{secret:'fictional',fetchImpl:async(url,options)=>{called=true;assert.equal(url,TRIAL_RECEIVER);assert.equal(options.headers.Authorization,'Bearer fictional');return Response.json({ok:true});}});assert.equal(result.registered,true);assert.equal(called,true);
 await assert.rejects(relayTrialSignup(checkout,{secret:'fictional',fetchImpl:async()=>new Response('private body',{status:503})}),/HTTP 503/);
});
test('the webhook rejects unsigned starts and retries a failed registry receipt before any CRM calls',async()=>{
 const previous={...process.env},real=globalThis.fetch;Object.assign(process.env,{STRIPE_API_KEY:'rk_fixture',STRIPE_WEBHOOK_SECRET:'whsec_fixture',TRIAL_ORDER_AUTOSTART_ENABLED:'enabled',PORTAL_TRIAL_SIGNUP_SECRET:'fictional',ENCHARGE_WRITE_KEY:'fictional'});
 const body=JSON.stringify(checkout),signature='t='+now+',v1='+createHmac('sha256','whsec_fixture').update(now+'.'+body).digest('hex');const req=sig=>new Request('https://www.jeffseah.rocks/api/stripe-webhook',{method:'POST',headers:{'stripe-signature':sig},body});const calls=[];globalThis.fetch=async url=>{calls.push(url);return new Response('unavailable',{status:503});};
 const originalError=console.error;console.error=()=>{};
 try{assert.equal((await POST(req('invalid'))).status,400);assert.equal(calls.length,0);assert.equal((await POST(req(signature))).status,500);assert.deepEqual(calls,[TRIAL_RECEIVER]);}
 finally{console.error=originalError;globalThis.fetch=real;process.env=previous;}
});
