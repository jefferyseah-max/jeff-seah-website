import test from 'node:test';
import assert from 'node:assert/strict';
import {annualIntake} from './fixtures/annual-intake.mjs';
import {validateAnnualIntake} from '../js/annual-intake.mjs';
import {submitAnnualIntake,POST} from '../api/annual-intake.mjs';
test('server requires the saved matching v2 receipt and follows the Apps Script redirect',async()=>{
  let sent;const receipt=await submitAnnualIntake(annualIntake,{fetchImpl:async(url,options)=>{sent={url,options};return Response.json({result:'success',saved:true,intakeId:annualIntake.intakeId,intakeSchemaVersion:2});}});
  assert.equal(receipt.saved,true);assert.equal(sent.options.redirect,'follow');assert.equal(JSON.parse(sent.options.body).exclusions[0],'No health discussion');
  for(const response of [{result:'success'},{result:'ignored'},{result:'success',saved:true,intakeId:'another',intakeSchemaVersion:2}])await assert.rejects(submitAnnualIntake(annualIntake,{fetchImpl:async()=>Response.json(response)}),/did not confirm/);
});
test('server rejects invalid input before contacting Apps Script and does not accept another product',async()=>{
  for(const patch of [{reportTimeZoneConfirmed:false},{product:'monthly-welcome'},{employmentStatus:'business interest'},{careerFocus:'maybe'},{birthTimeUnknown:true,birthTime:'Unknown'}]){
    assert.throws(()=>validateAnnualIntake({...annualIntake,...patch}));
    const response=await POST(new Request('https://test.invalid/api/annual-intake',{method:'POST',body:JSON.stringify({...annualIntake,...patch})}));assert.equal(response.status,400);
  }
});
test('Singapore, India, seasonal and nonseasonal US zones and gift confirmation are retained',()=>{
  for(const zone of ['Asia/Singapore','Asia/Kolkata','America/New_York','America/Phoenix'])assert.equal(validateAnnualIntake({...annualIntake,reportTimeZone:zone,reportTimeZoneSource:'gift-buyer-confirmed',employmentStatus:'between-jobs'}).reportTimeZone,zone);
  assert.equal(validateAnnualIntake(annualIntake).contextObservedAt,'');
});
