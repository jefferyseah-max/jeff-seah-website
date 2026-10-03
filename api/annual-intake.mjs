// Same-origin receipt for the annual form. No opaque no-cors success or payment verification.
import {validateAnnualIntake} from '../js/annual-intake.mjs';
import {INTAKE_ENDPOINT} from '../lib/signup-alert.mjs';

export async function submitAnnualIntake(data,{fetchImpl=fetch,url=INTAKE_ENDPOINT}={}) {
  validateAnnualIntake(data);
  const response=await fetchImpl(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=UTF-8'},body:JSON.stringify(data),redirect:'follow',signal:AbortSignal.timeout(25000)});
  if(!response.ok)throw Error('Intake service unavailable');
  const receipt=await response.json();
  if(receipt.result!=='success'||receipt.saved!==true||receipt.intakeId!==data.intakeId||receipt.intakeSchemaVersion!==2)throw Error('The intake service did not confirm your saved details');
  return {result:'success',saved:true,intakeId:data.intakeId,intakeSchemaVersion:2};
}
export async function POST(request) {
  let data;
  try{
    const body=await request.text();
    if(body.length>96000)return Response.json({result:'error',error:'Submission too large'},{status:413});
    data=JSON.parse(body);validateAnnualIntake(data);
  }catch{return Response.json({result:'error',error:'Please check the form details'},{status:400});}
  try{return Response.json(await submitAnnualIntake(data),{headers:{'Cache-Control':'no-store'}});}
  catch{
    console.error('annual-intake: saved receipt unavailable; retry with the same intake ID');
    return Response.json({result:'error',error:'We could not confirm that your details were saved. Please retry.'},{status:502,headers:{'Cache-Control':'no-store'}});
  }
}
