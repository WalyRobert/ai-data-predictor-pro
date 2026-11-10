import {existsSync,readFileSync} from 'node:fs';import {resolve} from 'node:path';import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('../',import.meta.url))),pkg=JSON.parse(readFileSync(resolve(root,'package.json'),'utf8'));
const major=Number(process.versions.node.split('.')[0]);let env={...process.env};const path=resolve(root,'.env');
if(existsSync(path))for(const line of readFileSync(path,'utf8').split(/\r?\n/)){const m=/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);if(m&&env[m[1]]===undefined){let value=m[2];if((value.startsWith('"')&&value.endsWith('"'))||(value.startsWith("'")&&value.endsWith("'")))value=value.slice(1,-1);else value=value.replace(/\s+#.*$/,'');env[m[1]]=value;}}
const api=existsSync(resolve(root,'server/index.mjs')),fruit=pkg.name==='fruitvision-ai';const key=env.GEMINI_API_KEY||'';
const checks={node22:major>=22,dependencies:existsSync(resolve(root,'node_modules')),build:existsSync(resolve(root,'dist/index.html'))};
console.log('Diagnóstico: '+pkg.name);for(const [name,ok] of Object.entries(checks))console.log(`${ok?'OK':'PENDENTE'}: ${name}`);
console.log(api?(fruit?'Backend FruitVision necessário. Use o botão Verificar backend na interface.':key&&!/^(?:your|sua|cole|replace|example)/i.test(key)?'Chave presente; validade, modelo e cota NÃO verificados.':'Gemini não configurado. Recursos locais continuam disponíveis quando existentes.'):'Processamento local. Câmera, codecs e modelos dependem do navegador.');
console.log('Este diagnóstico não faz chamadas ao provedor e não consome cota.');if(!checks.node22||!checks.dependencies)process.exitCode=1;
