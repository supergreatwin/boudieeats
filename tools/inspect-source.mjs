import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
const root=process.cwd(), dest=mkdtempSync(join(tmpdir(),'boudie-src-'));
execFileSync('tar',['-xzf',join(root,'boudieeats-source.tar.gz'),'-C',dest]);
const base=join(dest,'boudieeats');
const files=(dir)=>readdirSync(dir,{recursive:true,withFileTypes:true}).filter(x=>x.isFile()).map(x=>join(x.parentPath || x.path,x.name));
const src=join(base,'src');
console.log('===== SOURCE FILE MAP =====');
for(const f of files(src).filter(f=>/\.(astro|md|mdx|ts|js|json|css)$/i.test(f))){
 const t=readFileSync(f,'utf8');
 console.log(relative(base,f)+'\t'+statSync(f).size+' bytes\t'+t.split('\n').length+' lines');
}
console.log('===== SITE CONTENT SAMPLES =====');
for(const f of files(src).filter(f=>/\.(astro|md|mdx)$/i.test(f)&&!f.includes('node_modules')).sort()){
 const name=relative(base,f);
 const t=readFileSync(f,'utf8');
 if(name.includes('src/content/') || name.includes('src/pages/')){
   console.log('\n---- '+name+' ----\n'+t.slice(0,1800));
 }
}
