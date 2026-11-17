import {execFileSync} from 'node:child_process';
import {mkdtempSync,readdirSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,relative} from 'node:path';
const root=process.cwd(),tmp=mkdtempSync(join(tmpdir(),'boudie-'));
execFileSync('tar',['-xzf',join(root,'boudieeats-source.tar.gz'),'-C',tmp]);
const base=join(tmp,'boudieeats'),src=join(base,'src');
function walk(d){return readdirSync(d,{withFileTypes:true}).flatMap(x=>x.name.startsWith('._')?[]:x.isDirectory()?walk(join(d,x.name)):[join(d,x.name)])}
for(const f of walk(src).sort()){
 const name=relative(base,f);
 if(!/\.(astro|md|ts|js)$/i.test(name) || /src\/styles\//.test(name))continue;
 const t=readFileSync(f,'utf8');
 console.log('BEGINFILE::'+name);
 console.log(t);
 console.log('ENDFILE::'+name);
}
