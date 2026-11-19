// Called only after verifyStripeSignature in stripe-webhook.mjs. No birth or
// payment-method details leave Stripe here. The receiver joins two signed facts.
import {CALENDAR_PRICE} from './billing-anchor.mjs';
export const TRIAL_PAYMENT_LINK='plink_1UJU5nRmcvZfydHfycEdDsgE';
export const TRIAL_RECEIVER='https://reports.jeffseah.rocks/members/__trial_signup';
const id=value=>typeof value==='string'?value:value?.id;
export function trialSignupFact(event){
 if(event?.livemode!==true||event.data?.object?.livemode!==true)return null;
 const object=event.data.object,base={version:1,eventId:event.id,eventCreated:event.created,livemode:true};
 if(event.type==='checkout.session.completed'){
  if(object.payment_link!==TRIAL_PAYMENT_LINK||object.mode!=='subscription')return null;
  if(object.status!=='complete'||!['paid','no_payment_required'].includes(object.payment_status))return null;
  return {...base,kind:'checkout',subscriptionId:id(object.subscription),customerId:id(object.customer),sessionId:object.id,email:object.customer_details?.email||object.customer_email||'',status:object.status,paymentStatus:object.payment_status,paymentLink:object.payment_link};
 }
 if(['customer.subscription.created','customer.subscription.updated','customer.subscription.deleted'].includes(event.type)){
  const items=object.items?.data,single=Array.isArray(items)&&items.length===1&&!object.items.has_more;
  const price=single?id(items[0].price):'mixed-plan';
  if(event.type==='customer.subscription.created'&&price!==CALENDAR_PRICE)return null;
  return {...base,kind:'subscription',subscriptionId:object.id,customerId:id(object.customer),priceId:price,quantity:single?(items[0].quantity??1):0,status:object.status,trialStart:object.trial_start??null,trialEnd:object.trial_end??null};
 }
 return null;
}
export async function relayTrialSignup(event,{secret,fetchImpl=fetch}={}){
 const fact=trialSignupFact(event);if(!fact)return null;
 if(!secret)throw Error('Trial signup relay is enabled but not configured');
 const response=await fetchImpl(TRIAL_RECEIVER,{method:'POST',headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json'},body:JSON.stringify(fact),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('Trial signup receipt failed: HTTP '+response.status);
 const saved=await response.json();if(saved.ok!==true&&saved.ignored!==true)throw Error('Trial signup was not acknowledged');
 return {registered:saved.ok===true,kind:fact.kind};
}
