// Shared browser/server input contract. Birth receipts never change a saved client profile.
export const ANNUAL_COLUMNS = ['intakeId','subjectName','residenceCity','residenceRegion','residenceCountry','reportTimeZone','reportTimeZoneConfirmed','reportTimeZoneSource','reportTimeZoneConfirmedAt','employmentStatus','careerFocus','contextObservedAt','circumstances','focalQuestions','exclusions','birthTimeZone','birthTimeConvention'];
export const EMPLOYMENT = ['employed','self-employed','employed-and-self-employed','between-jobs','student','retired','prefer-not-to-say'];
export const FOCUS = ['career','business','both','general'];
export function validZone(zone) {
  if(!/^[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?$/.test(zone||''))return false;
  try{new Intl.DateTimeFormat('en-GB',{timeZone:zone}).format(0);return true;}catch{return false;}
}
export function dateOnly(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value||'') && !Number.isNaN(Date.parse(value+'T00:00:00Z')) && new Date(value+'T00:00:00Z').toISOString().startsWith(value);
}
export function validateAnnualIntake(data) {
  if(!data||typeof data!=='object'||Array.isArray(data)||data.product!=='2027-annual-outlook'||data.intakeSchemaVersion!==2)throw Error('Unsupported annual intake');
  for(const value of Object.values(data)) {
    if(typeof value==='string'&&value.length>2000)throw Error('A field exceeds 2,000 characters');
    if(Array.isArray(value)&&(!value.every(item=>typeof item==='string')||value.join('\n').length>2000))throw Error('Invalid or oversized list');
  }
  const requiredText=key=>{if(typeof data[key]!=='string'||!data[key].trim())throw Error('Missing '+key);};
  for(const key of ['name','subjectName','email','birthCity','residenceCity','residenceCountry'])requiredText(key);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)||data.name.trim().length<2||data.subjectName.trim().length<2)throw Error('Invalid name or email');
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.intakeId||''))throw Error('Invalid intake ID');
  if(!dateOnly(data.birthDate)||new Date(data.birthDate+'T00:00:00Z')>new Date())throw Error('Invalid birth date');
  if(typeof data.birthTimeUnknown!=='boolean'||(!data.birthTimeUnknown&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(data.birthTime||''))||(data.birthTimeUnknown&&data.birthTime!==''))throw Error('Invalid birth time');
  if(!['female','male'].includes(data.gender)||!['simplified','advanced'].includes(data.edition)||data.consent!==true)throw Error('Please complete the required choices');
  if(!validZone(data.reportTimeZone)||data.reportTimeZoneConfirmed!==true||!['subject-confirmed','gift-buyer-confirmed'].includes(data.reportTimeZoneSource)||!dateOnly(data.reportTimeZoneConfirmedAt))throw Error('Confirm the report residence and time zone');
  if(data.birthTimeZone&&!validZone(data.birthTimeZone))throw Error('Invalid birth time zone');
  if(!EMPLOYMENT.includes(data.employmentStatus)||!FOCUS.includes(data.careerFocus))throw Error('Invalid work status or reading focus');
  if(data.contextObservedAt&&!dateOnly(data.contextObservedAt))throw Error('Invalid circumstance observation date');
  if(!Array.isArray(data.focalQuestions)||data.focalQuestions.length<1||data.focalQuestions.length>5||data.focalQuestions.some(q=>q.trim().length<3))throw Error('Enter one to five questions, one per line');
  if(!Array.isArray(data.exclusions))throw Error('Invalid exclusions');
  if(typeof data.elapsedMs!=='number'||!Number.isFinite(data.elapsedMs)||data.elapsedMs<3000||data.website)throw Error('Please try submitting again');
  return data;
}
