import {describe,it,expect} from 'vitest';
import {runMLPipeline,classificationMetrics,stratifiedSplit,seededShuffle} from '../services/machineLearning';
import {fitPreprocessor,calculateCorrelationMatrix} from '../services/dataProcessor';
describe('avaliação honesta',()=>{
 it('calcula matriz e macro F1 para três rótulos não binários',()=>{
  const m=classificationMetrics(['2','gato','azul','azul'],['2','azul','azul','gato'],['2','gato','azul']);
  expect(m.confusionMatrix).toEqual([[1,0,0],[0,0,1],[0,1,1]]);expect(m.accuracy).toBe(.5);expect(m.f1).toBeCloseTo(.5);
 });
 it('ajusta média e categorias somente nos dados de treino',()=>{
  const prep=fitPreprocessor([{n:2,c:'A'},{n:4,c:'B'}],['n','c']);
  expect(prep.transform([{n:null,c:'inédita'},{n:1000,c:'A'}])).toEqual([[3,0,0],[1000,1,0]]);
  expect(prep.rules[0].mean).toBe(3);expect(prep.rules[1].categories).toEqual(['A','B']);
 });
 it('separa por classe sem sobreposição e com semente reproduzível',()=>{
  const rows=Array.from({length:40},(_,i)=>({id:i,y:i%2?'A':'B'}));const a=stratifiedSplit(rows,'y');
  expect(a).toEqual(stratifiedSplit(rows,'y'));expect(a.test).toHaveLength(8);expect(a.train.some(r=>a.test.includes(r))).toBe(false);
  expect(new Set(a.test.map(r=>r.y)).size).toBe(2);expect(seededShuffle(rows,1)).not.toEqual(seededShuffle(rows,2));
 });
 it('treina e avalia as classes originais em um problema separável',()=>{
  const rows=Array.from({length:60},(_,i)=>({x:i%20,y:i%20<10?'baixo':'alto'}));const r=runMLPipeline(rows,'y');
  expect(r.metrics.accuracy).toBeGreaterThan(.8);expect(r.labels).toEqual(['alto','baixo']);expect(r.testData.length+r.trainCount).toBe(60);
  expect(r).toEqual(runMLPipeline(rows,'y'));expect(r.featureImportances.reduce((s,f)=>s+f.score,0)).toBeCloseTo(1);
 });
 it('rejeita vazio, classe única, alvo ausente e classe rara',()=>{
  expect(()=>runMLPipeline([],'y')).toThrow();
  expect(()=>runMLPipeline(Array.from({length:10},(_,i)=>({x:i,y:'2'})),'y')).toThrow(/2 a 20/);
  expect(()=>runMLPipeline(Array.from({length:10},(_,i)=>({x:i,y:i===0?'':'A'})),'y')).toThrow(/ausentes/);
  expect(()=>runMLPipeline(Array.from({length:10},(_,i)=>({x:i,y:i===0?'B':'A'})),'y')).toThrow(/2 registros/);
 });
 it('correlação omite textos, não inventa zero para constantes ou ausentes',()=>{
  const r=calculateCorrelationMatrix([{x:1,y:2,c:7,s:'A'},{x:2,y:null,c:7,s:'B'},{x:3,y:6,c:7,s:'C'}]);
  expect(r.columns).toEqual(['x','y','c']);expect(r.matrix[0][1]).toBeCloseTo(1);expect(r.matrix[2][2]).toBeNull();
 });
});
