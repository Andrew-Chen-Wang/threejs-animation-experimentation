import {cpSync,copyFileSync,existsSync,mkdirSync,rmSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const site=resolve('_site');
rmSync(site,{recursive:true,force:true});
mkdirSync(site,{recursive:true});
cpSync('dist',site,{recursive:true});
cpSync('renders',resolve(site,'renders'),{recursive:true});
const codex=resolve(site,'codex-6-astra-low');
cpSync('codex-6-astra-low/dist-film',codex,{recursive:true});
copyFileSync(resolve(codex,'film.html'),resolve(codex,'index.html'));
copyFileSync('codex-6-astra-low/watch.html',resolve(codex,'watch.html'));
cpSync('codex-6-astra-low/renders',resolve(codex,'renders'),{recursive:true});
mkdirSync(resolve(site,'audio'),{recursive:true});
copyFileSync('codex-6-astra-low/public/film/audio.m4a',resolve(site,'audio/narration.m4a'));
// needs `npm run build:points` first; skipped (with a note) when that build step hasn't run
if(existsSync('drone-points/dist')){
  cpSync('drone-points/dist',resolve(site,'drone-points'),{recursive:true});
  cpSync('drone-points/renders',resolve(site,'drone-points/renders'),{recursive:true});
}else console.warn('drone-points/dist missing: run npm run build:points to include it');
writeFileSync(resolve(site,'.nojekyll'),'');
