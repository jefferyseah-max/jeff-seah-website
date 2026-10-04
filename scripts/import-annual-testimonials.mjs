import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {validateTestimonials} from '../js/annual-testimonials.mjs';
const arg=process.argv.indexOf('--source');if(arg<0||!process.argv[arg+1])throw Error('Use --source <approved-testimonials.json> [--apply]. Approval and consent must be verified by the private annual-feedback exporter first.');
const items=validateTestimonials(JSON.parse(fs.readFileSync(process.argv[arg+1],'utf8')));
const target=fileURLToPath(new URL('../data/annual-2027-testimonials.json',import.meta.url));
if(process.argv.includes('--apply')){const temp=target+'.tmp';fs.writeFileSync(temp,JSON.stringify(items,null,2)+'\n');validateTestimonials(JSON.parse(fs.readFileSync(temp,'utf8')));fs.renameSync(temp,target);}
console.log(JSON.stringify({status:process.argv.includes('--apply')?'imported':'preflight',count:items.length,target:path.resolve(target),publicationRequiresReviewedDeployment:true}));
