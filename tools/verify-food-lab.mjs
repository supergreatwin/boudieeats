import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {rankFoods} from './what-to-eat-experiences.mjs';
const make=(slug,mode,weirdness,overrides={})=>({
 id:slug,slug,name_en:slug,status:'preview',mode,weirdness,adventurous:weirdness,
 comfort:weirdness<3?5:1,sweet:3,spice:1,ingredients:[],allergens:[],
 ingredients_verified:false,prep_minutes:null,price_band:null,dietary_tags:[],
 ...overrides
});
const foods=[make('classic','classics',1),make('fusion','fusion',4),
 make('chaos','chaos',5),make('allergy','weird',3,{ingredients:['peanuts'],allergens:['peanuts'],ingredients_verified:true}),
 make('vegan','fusion',3,{ingredients:['tomato'],allergens:[],ingredients_verified:true,dietary_tags:['vegan'],prep_minutes:15,price_band:'budget'}),
 make('hidden','classics',1,{status:'hidden'})];
const standard={mode:'all',weirdness:1,adventure:1,comfort:5,sweet:3,spice:2,budget:'any',time:0};
assert.deepEqual(rankFoods(foods,standard).map(f=>f.slug),['classic'],'Meter 1 must exclude all weirdness >1');
const chaos=rankFoods(foods,{...standard,mode:'chaos',weirdness:5,adventure:5,comfort:1});
assert.equal(chaos[0].slug,'chaos','Meter 5 + chaos mode must choose chaos content');
assert.equal(rankFoods(foods,{...standard,mode:'fusion',weirdness:5}).every(f=>f.mode==='fusion'),true,'Mode must be a hard filter');
assert.equal(rankFoods(foods,{...standard,mode:'all',weirdness:5,allergies:'peanuts'}).some(f=>f.slug==='allergy'),false,'Known allergen must exclude candidate');
assert.equal(rankFoods(foods,{...standard,mode:'all',weirdness:5,allergies:'sesame'}).some(f=>f.slug==='classic'),false,'Unknown ingredient lists must exclude if allergies stated');
assert.equal(rankFoods(foods,{...standard,mode:'all',weirdness:5,restrictions:'vegan'}).map(f=>f.slug).join(','),'vegan','Dietary match must require verified ingredient list and tag');
assert.equal(rankFoods(foods,{...standard,mode:'all',weirdness:5,disliked:'tomato'}).some(f=>f.slug==='vegan'),false,'Disliked ingredient must exclude');
assert.equal(rankFoods(foods,{...standard,mode:'all',weirdness:5,time:20,budget:'budget'}).map(f=>f.slug).join(','),'vegan','Time and budget must filter unknown data');
assert.equal(rankFoods(foods,{...standard,mode:'all',weirdness:5}).some(f=>f.slug==='hidden'),false,'Hidden food must not be recommended');
const source=readFileSync(new URL('./what-to-eat-client.mjs',import.meta.url),'utf8');
for(const token of ['be_wte_reviewers','mountExperienceGuide','mountExperienceStudio','be_wte_foods','be_wte_features','be_wte_passports']){
 assert(source.includes(token),'Missing integrated client marker '+token);
}
const script=readFileSync(new URL('./what-to-eat-experiences.mjs',import.meta.url),'utf8');
for(const token of ['Would You Try It?','wte-x-quiz','be_wte_ideas','be_wte_votes','be_wte_passports','be_wte_badges','be_wte_recognitions','Weirdness Meter']){
 assert(script.includes(token),'Missing experience module marker '+token);
}
const built=new URL('../boudieeats/dist/',import.meta.url);
if(existsSync(built)){
 const html=readFileSync(new URL('../boudieeats/dist/editorial-desk/what-to-eat/index.html',import.meta.url),'utf8');
 assert(html.includes('be-what-to-eat-experiences.css'),'Private page must link branded experience CSS');
 assert(existsSync(new URL('../boudieeats/dist/be-what-to-eat-experiences.js',import.meta.url)),'Experience JS missing from dist');
 assert(existsSync(new URL('../boudieeats/dist/be-what-to-eat-experiences.css',import.meta.url)),'Experience CSS missing from dist');
}
console.log('PASS: weighted quiz, weirdness mode, dietary safety, content privacy, and seven-experience build integration');
