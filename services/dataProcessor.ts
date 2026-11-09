import type {DataRow} from '../types';
export const missing=(v:unknown)=>v===null||v===undefined||String(v).trim()==='';
export function numeric(v:unknown):number|null {
 if(missing(v))return null;
 const text=String(v).trim();
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text))return null;
 const value=Number(text);return Number.isFinite(value)?value:null;
}
export type ColumnRule={column:string;mean?:number;categories?:string[]};
export function fitPreprocessor(train:DataRow[],features:string[]){
 if(!train.length||!features.length)throw Error('Treino sem dados ou atributos.');
 const rules:ColumnRule[]=features.map(column=>{
  const values=train.map(r=>r[column]).filter(v=>!missing(v));
  if(!values.length)return {column,mean:0};
  if(values.every(v=>numeric(v)!==null))return {column,mean:values.reduce<number>((s,v)=>s+numeric(v)!/values.length,0)};
  const categories=[...new Set(values.map(v=>String(v).trim()))].sort();
  if(categories.length>20)throw Error(`A coluna ${column} tem mais de 20 categorias. Remova identificadores/textos livres.`);
  return {column,categories};
 });
 const names=rules.flatMap(r=>r.categories?r.categories.map(c=>`${r.column} = ${c}`):[r.column]);
 if(names.length>100)throw Error('Limite de 100 atributos após codificação.');
 const transform=(rows:DataRow[])=>rows.map(row=>rules.flatMap(r=>r.categories?r.categories.map(c=>!missing(row[r.column])&&String(row[r.column]).trim()===c?1:0):[numeric(row[r.column])??r.mean!]));
 return {rules,names,transform};
}
export function calculateCorrelationMatrix(data:DataRow[]){
 if(!data.length)return {columns:[],matrix:[]};
 const columns=Object.keys(data[0]).filter(c=>{
  const values=data.map(r=>r[c]).filter(v=>!missing(v));return values.length>1&&values.every(v=>numeric(v)!==null);
 });
 const matrix=columns.map(a=>columns.map(b=>{
  const pairs=data.map(r=>[numeric(r[a]),numeric(r[b])]).filter((p):p is [number,number]=>p[0]!==null&&p[1]!==null);
  if(pairs.length<2)return null;
  const mx=pairs.reduce((s,p)=>s+p[0]/pairs.length,0),my=pairs.reduce((s,p)=>s+p[1]/pairs.length,0);
  const cov=pairs.reduce((s,p)=>s+(p[0]-mx)*(p[1]-my),0);
  const denom=Math.sqrt(pairs.reduce((s,p)=>s+(p[0]-mx)**2,0)*pairs.reduce((s,p)=>s+(p[1]-my)**2,0));
  return denom>0?Math.max(-1,Math.min(1,cov/denom)):null;
 }));
 return {columns,matrix};
}
