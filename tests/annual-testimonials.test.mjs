import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateTestimonials} from '../js/annual-testimonials.mjs';
const item={id:'12345678-1234-4234-8234-123456789abc',year:2027,name:'Reader A',quote:'A practical report.',rating:4};
test('public schema rejects private fields, invalid stars and duplicate rows',()=>{assert.equal(validateTestimonials([item]).length,1);assert.equal(validateTestimonials([]).length,0);for(const bad of [{...item,rating:6},{...item,route:'private-client'},{...item,publishConsent:true},{...item,quote:''}])assert.throws(()=>validateTestimonials([bad]));assert.throws(()=>validateTestimonials([item,item]));assert.equal(validateTestimonials([{...item,rating:null}]).length,1);});
test('testimonials are only on the annual landing page and public data conforms to the schema',()=>{const page=fs.readFileSync(new URL('../2027.html',import.meta.url),'utf8'),home=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.ok(page.includes('data-annual-testimonials'));assert.ok(page.indexOf('data-annual-testimonials')<page.indexOf('<section id="order"'));assert.ok(!home.includes('data-annual-testimonials'));validateTestimonials(JSON.parse(fs.readFileSync(new URL('../data/annual-2027-testimonials.json',import.meta.url),'utf8')));});
