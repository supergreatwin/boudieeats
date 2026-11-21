import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
const styles=readFileSync(new URL('./responsive-finish.css',import.meta.url),'utf8');
export function finishResponsiveLayout({directory}){
 let updated=0;
 for(const entry of readdirSync(directory,{recursive:true})){
  if(!entry.endsWith('.html') || /^google[a-z0-9]+\.html$/i.test(entry)) continue;
  const path=join(directory,entry);
  let html=readFileSync(path,'utf8');
  if(!html.includes('</head>')||html.includes('id="be-responsive-release"'))continue;
  html=html.replace('</head>','<style id="be-responsive-release">'+styles+'</style></head>');
  writeFileSync(path,html);updated++;
 }
 console.log('Applied responsive Boudie Eats layout to '+updated+' bilingual routes.');
}