import assert from 'node:assert/strict';
import {bePublicConfig} from './be-public-config.mjs';
const root=bePublicConfig.url.replace(/\/$/,'');
const apiKey=bePublicConfig.publishableKey;
assert(/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(root));
assert(apiKey.startsWith('sb_publishable_'));
const tables=['be_wte_settings','be_wte_terms','be_wte_sections','be_wte_places','be_wte_photos'];
for(const table of tables){
 const url=root+'/rest/v1/'+table+'?select=*&limit=1';
 const response=await fetch(url,{headers:{apikey:apiKey,accept:'application/json'},signal:AbortSignal.timeout(10000)});
 const body=await response.text();
 if(!response.ok)throw Error(table+' public API inaccessible: HTTP '+response.status+' '+body.slice(0,200));
 const parsed=JSON.parse(body);
 assert(Array.isArray(parsed),table+' must return JSON array');
 assert.equal(parsed.length,0,table+' leaked prelaunch content');
 console.log('PASS: anonymous request to '+table+' returns zero rows');
}
console.log('PASS: private collaboration tables are reachable by the API but RLS hides all unreleased data from anonymous visitors.');
