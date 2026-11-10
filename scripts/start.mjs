import {spawn} from 'node:child_process';import {existsSync,readFileSync} from 'node:fs';import {resolve} from 'node:path';import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('../',import.meta.url))),pkg=JSON.parse(readFileSync(resolve(root,'package.json'),'utf8'));
if(Number(process.versions.node.split('.')[0])<22||!existsSync(resolve(root,'node_modules'))){console.error('Instale Node.js 22 e execute npm ci nesta pasta.');process.exit(1);}
const npm=process.env.npm_execpath;if(!npm){console.error('Use npm run iniciar.');process.exit(1);}
function run(args){return new Promise((done,reject)=>{const child=spawn(process.execPath,[npm,...args],{cwd:root,stdio:'inherit',env:process.env});child.on('error',reject);child.on('exit',(code,signal)=>code===0?done():reject(Error(signal?'Execução interrompida.':'Comando falhou: '+args.join(' '))));});}
try{await run(['run','build']);await run(['run',pkg.scripts.server?'server':'preview',...(pkg.scripts.server?[]:['--','--host','127.0.0.1'])]);}catch(e){console.error(e.message);process.exitCode=1;}
