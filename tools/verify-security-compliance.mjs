import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
const dist=new URL('../boudieeats/dist/',import.meta.url).pathname;
const issues=[];
const requireCheck=(x,msg)=>{if(!x)issues.push(msg)};
const read=(p)=>{const f=join(dist,p);return existsSync(f)?readFileSync(f,'utf8'):''};
for(const prefix of ['','ar/']){
 for(const route of ['privacy/','cookies/','terms/']){
  const page=prefix+route+'index.html',html=read(page);
  requireCheck(!!html,'Missing legal notice: '+page);
  requireCheck(html.includes('boudieeats.com'),'Notice missing canonical site: '+page);
 }
 const account=read(prefix+'account/index.html');
 const desk=read(prefix+'editorial-desk/index.html');
 requireCheck(account.includes('noindex,nofollow'),'Reader auth page indexable: '+prefix);
 requireCheck(desk.includes('noindex,nofollow'),'Staff desk page indexable: '+prefix);
 requireCheck(!!account&&!!desk,'Missing account or desk: '+prefix);
 requireCheck(!account.includes('href="/'+prefix+'editorial-desk/"'),'Reader account advertises staff desk: '+prefix);
}
const script=read('be-account.js');
requireCheck(script.includes("client.rpc('be_staff')"),'No server-authoritative staff check');
requireCheck(script.includes("if(deskMode &&"),'No staff-only action guard'); // source branch has exact string
requireCheck(script.includes('be-request-password-reset'),'Reset handler not using protected edge endpoint');
requireCheck(!script.includes('client.auth.resetPasswordForEmail('),'Direct auth reset bypass remains in browser code');
const headers=read('_headers');
for(const required of ['X-Content-Type-Options: nosniff','Referrer-Policy: strict-origin-when-cross-origin','Content-Security-Policy:','Strict-Transport-Security:','X-Frame-Options: DENY']){
 requireCheck(headers.includes(required),'Missing Cloudflare header: '+required);
}
for(const entry of readdirSync(dist,{recursive:true})){
 if(!entry.endsWith('.html') || /^(?:ar\/)?editorial-desk\/index\.html$/.test(entry))continue;
 const html=read(entry);
 if(/<a\b[^>]*href=["'][^"']*editorial-desk\/?[^"']*["']/i.test(html))issues.push('Public desk anchor leaked: '+entry);
 if(/sb_secret_|service_role\b/i.test(html))issues.push('Secret/role marker emitted in '+entry);
}
if(issues.length){console.error(issues.join('\n'));process.exit(1)}
console.log('PASS: privacy/cookies/terms EN+AR, server role gate, anti-abuse reset endpoint, restricted navigation and Cloudflare security headers.');
