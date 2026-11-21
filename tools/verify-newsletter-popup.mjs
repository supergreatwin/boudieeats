import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const root=new URL('../boudieeats/dist/',import.meta.url).pathname;
const errors=[];
for(const [locale,id] of [['','vXDORl'],['ar/','7XK9Dz']]){
 const file=join(root,locale,'index.html');
 if(!existsSync(file)){errors.push('Homepage missing: '+locale);continue;}
 const html=readFileSync(file,'utf8');
 const checks=['id="be-letter-dialog"','data-be-letter-open','data-be-letter-close',
  'be-letter-dismissed-v2','be-letter-shown-session-v2','3500','visibilitychange',
  'tally.so/embed/'+id,'tally.so/r/'+id,'showModal()'];
 for(const key of checks)if(!html.includes(key))errors.push('Newsletter popup '+locale+' missing '+key);
 if(html.includes('be-letter-dismissed-v1')||html.includes('21*86400000'))errors.push('Old 21-day popup suppression still present: '+locale);
 if(html.includes('.be-letter-body iframe{background:#ebc57b!important'))errors.push('Yellow form background still overrides cream: '+locale);
 if(!html.includes('.be-letter-body iframe{background:#fffaf2!important'))errors.push('Cream iframe background not present: '+locale);
}
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log('PASS: automatic bilingual Tally newsletter popup (3.5s, 24h dismissal, visibility recovery, cream theme).');