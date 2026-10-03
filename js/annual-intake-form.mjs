import {validateAnnualIntake} from './annual-intake.mjs';
const form=document.getElementById('intakeForm'),readyAt=Date.now();
const field=id=>document.getElementById(id),value=id=>field(id).value.trim();
const unknown=field('unknownTime');
let previousSignature=null,pendingPayload=null;
field('giftOrder').addEventListener('change',()=>{
  const gift=field('giftOrder').checked;
  field('subjectNameLabel').textContent=gift?"Recipient's full name":'Your full name';
  field('subjectDetailsHelp').textContent=gift?'Enter the recipient\'s birth details, work status and questions below.':'Enter your birth details, work status and questions below.';
});
unknown.addEventListener('change',()=>{field('birthTime').value='';field('birthTime').disabled=unknown.checked;field('birthTime').required=!unknown.checked;});
const lines=id=>value(id).split(/\r?\n/).map(v=>v.trim()).filter(Boolean);
form.addEventListener('submit',async event=>{
  event.preventDefault();field('successState').classList.remove('visible');field('errorState').classList.remove('visible');
  if(value('company_website')||Date.now()-readyAt<3000)return;
  if(!form.reportValidity())return;
  const button=field('submitBtn');
  try{
    const params=new URLSearchParams(location.search),employmentStatus=value('employmentStatus');
    const payload={product:'2027-annual-outlook',intakeSchemaVersion:2,intakeId:pendingPayload?.intakeId||crypto.randomUUID(),name:value('fullName'),subjectName:value('fullName'),email:value('email'),calendarEmail:'',birthDate:value('birthDate'),birthTime:unknown.checked?'':value('birthTime'),birthTimeUnknown:unknown.checked,birthCity:value('birthCity'),birthTimeZone:'',birthTimeConvention:'',gender:form.elements.gender.value,workType:({'self-employed':'business-owner','employed-and-self-employed':'both'})[employmentStatus]||employmentStatus,employmentStatus,careerFocus:value('careerFocus'),contextObservedAt:'',circumstances:value('circumstances'),focalQuestions:lines('decisions'),decisions:value('decisions'),exclusions:lines('exclusions'),edition:'simplified',consent:field('consent').checked,paid:params.get('paid')==='1'||(params.get('session_id')||'').startsWith('cs_'),stripeSessionId:params.get('session_id')||'',residenceCity:'',residenceRegion:'',residenceCountry:'',reportTimeZone:'',reportTimeZoneConfirmed:false,reportTimeZoneSource:'local-clock-policy',reportTimeZoneConfirmedAt:'',submittedAt:pendingPayload?.submittedAt||new Date().toISOString(),elapsedMs:Date.now()-readyAt,website:''};
    validateAnnualIntake(payload);
    const {intakeId,submittedAt,elapsedMs,...details}=payload,signature=JSON.stringify(details);
    if(previousSignature!==null&&previousSignature!==signature){payload.intakeId=crypto.randomUUID();payload.submittedAt=new Date().toISOString();}
    previousSignature=signature;pendingPayload=payload;
    button.disabled=true;button.textContent='Saving...';
    const response=await fetch('/api/annual-intake',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(30000)});
    const receipt=await response.json();
    if(!response.ok||receipt.result!=='success'||receipt.saved!==true||receipt.intakeId!==payload.intakeId||receipt.intakeSchemaVersion!==2)throw Error('We could not confirm that your details were saved. Please retry.');
    form.hidden=true;field('successState').classList.add('visible');field('successState').scrollIntoView({block:'center',behavior:'smooth'});
  }catch(error){field('formErrorText').textContent=error.name==='TimeoutError'?'We could not confirm that your details were saved. Please retry.':error.message;field('errorState').classList.add('visible');button.disabled=false;button.textContent='Send report details';field('errorState').scrollIntoView({block:'center',behavior:'smooth'});}
});
