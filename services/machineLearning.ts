import type {DataRow} from '../types';
import {fitPreprocessor,missing} from './dataProcessor';
type TreeNode={label:number}|{featureIndex:number;threshold:number;left:TreeNode;right:TreeNode};
export class DecisionTreeClassifier {
  private tree: TreeNode | undefined;
  private maxDepth: number = 5;
  public featureImportances: number[] = [];

  train(data: Record<string,number>[], features: string[], target: string) {
    if(!data.length || !features.length) throw Error("Treino vazio.");
    const X = data.map(d => features.map(f => d[f]));
    const y = data.map(d => d[target]);
    this.featureImportances = new Array(features.length).fill(0);
    this.tree = this.buildTree(X, y, 0);
    
    // Normalize importances
    const sum = this.featureImportances.reduce((a, b) => a + b, 0);
    if (sum > 0) {
      this.featureImportances = this.featureImportances.map(v => v / sum);
    }
  }

  private buildTree(X: number[][], y: number[], depth: number): TreeNode {
    const uniqueLabels = Array.from(new Set(y));
    if (uniqueLabels.length === 1) return { label: uniqueLabels[0] };
    if (depth >= this.maxDepth || X.length === 0) {
      return { label: this.mostCommon(y) };
    }

    const parentGini = this.giniImpurity(y);
    const { featureIndex, threshold } = this.bestSplit(X, y);
    if (featureIndex === -1) return { label: this.mostCommon(y) };

    const leftIndices = X.map((f, i) => f[featureIndex] <= threshold ? i : -1).filter(i => i !== -1);
    const rightIndices = X.map((f, i) => f[featureIndex] > threshold ? i : -1).filter(i => i !== -1);

    if (leftIndices.length === 0 || rightIndices.length === 0) {
      return { label: this.mostCommon(y) };
    }

    // Calculate importance: Reduction in Gini
    const leftLabels = leftIndices.map(i => y[i]);
    const rightLabels = rightIndices.map(i => y[i]);
    const weightedGini = (leftLabels.length / y.length) * this.giniImpurity(leftLabels) +
                        (rightLabels.length / y.length) * this.giniImpurity(rightLabels);
    
    this.featureImportances[featureIndex] += (parentGini - weightedGini) * y.length;

    return {
      featureIndex,
      threshold,
      left: this.buildTree(leftIndices.map(i => X[i]), leftLabels, depth + 1),
      right: this.buildTree(rightIndices.map(i => X[i]), rightLabels, depth + 1)
    };
  }

  private bestSplit(X: number[][], y: number[]) {
    let bestGini = this.giniImpurity(y);
    let split = { featureIndex: -1, threshold: 0 };

    for (let fIdx = 0; fIdx < (X[0]?.length || 0); fIdx++) {
      const values = Array.from(new Set(X.map(f => f[fIdx]))).sort((a,b)=>a-b);
      const thresholds = values.filter((_,i)=>i < values.length-1 && (values.length<=32 || i % Math.ceil(values.length/32)===0));
      for (const t of thresholds) {
        const leftLabels = y.filter((_, i) => X[i][fIdx] <= t);
        const rightLabels = y.filter((_, i) => X[i][fIdx] > t);
        
        const gini = (leftLabels.length / y.length) * this.giniImpurity(leftLabels) +
                     (rightLabels.length / y.length) * this.giniImpurity(rightLabels);
        
        if (gini < bestGini) {
          bestGini = gini;
          split = { featureIndex: fIdx, threshold: t };
        }
      }
    }
    return split;
  }

  private giniImpurity(y: number[]) {
    if (y.length === 0) return 0;
    const counts: Record<number, number> = {};
    y.forEach(l => counts[l] = (counts[l] || 0) + 1);
    let impurity = 1;
    for (const count of Object.values(counts)) {
      const p = count / y.length;
      impurity -= p * p;
    }
    return impurity;
  }

  private mostCommon(y: number[]) {
    const counts: Record<number, number> = {};
    y.forEach(l => counts[l] = (counts[l] || 0) + 1);
    return Number(Object.entries(counts).reduce((a, b) => a[1] > b[1] ? a : b)[0]);
  }

  predict(features: number[]): number {
    let node = this.tree;
    while (node && !('label' in node)) {
      if (features[node.featureIndex] <= node.threshold) {
        node = node.left;
      } else {
        node = node.right;
      }
    }
    if(!node)throw Error("Modelo sem treino.");
    return node.label;
  }
}


export function seededShuffle<T>(data:T[],seed=42):T[]{
 const result=[...data];let state=seed>>>0;
 for(let i=result.length-1;i>0;i--){state=(Math.imul(1664525,state)+1013904223)>>>0;const j=Math.floor(state/4294967296*(i+1));[result[i],result[j]]=[result[j],result[i]];}
 return result;
}
export function stratifiedSplit(data:DataRow[],target:string,seed=42){
 if(data.length<10||data.length>1000)throw Error('Use entre 10 e 1000 registros.');
 const groups=new Map<string,DataRow[]>();
 for(const row of data){if(missing(row[target]))throw Error('A coluna alvo contém valores ausentes.');const label=String(row[target]).trim();groups.set(label,[...(groups.get(label)??[]),row]);}
 if(groups.size<2||groups.size>20)throw Error('Escolha um alvo de classificação com 2 a 20 classes. Regressão não está disponível.');
 const train:DataRow[]=[],test:DataRow[]=[];
 for(const [label,rows] of [...groups].sort(([a],[b])=>a.localeCompare(b))){
  if(rows.length<2)throw Error(`A classe ${label} precisa de pelo menos 2 registros.`);
  const shuffled=seededShuffle(rows,seed);const n=Math.max(1,Math.min(rows.length-1,Math.round(rows.length*.2)));
  test.push(...shuffled.slice(0,n));train.push(...shuffled.slice(n));
 }
 return {train:seededShuffle(train,seed),test:seededShuffle(test,seed)};
}
export function classificationMetrics(actual:string[],predicted:string[],labels:string[]){
 if(!actual.length||actual.length!==predicted.length||new Set(labels).size!==labels.length)throw Error('Métricas sem pares válidos.');
 const index=new Map(labels.map((s,i)=>[s,i]));const confusionMatrix=labels.map(()=>labels.map(()=>0));
 actual.forEach((value,i)=>{const a=index.get(value),p=index.get(predicted[i]);if(a===undefined||p===undefined)throw Error('Classe desconhecida nas métricas.');confusionMatrix[a][p]++;});
 const perClass=labels.map((label,i)=>{
  const tp=confusionMatrix[i][i],support=confusionMatrix[i].reduce((a,b)=>a+b,0),count=confusionMatrix.reduce((s,row)=>s+row[i],0);
  const precision=count?tp/count:0,recall=support?tp/support:0;
  return {label,support,precision,recall,f1:precision+recall?2*precision*recall/(precision+recall):0};
 });
 const mean=(key:'precision'|'recall'|'f1')=>perClass.reduce((s,p)=>s+p[key]/labels.length,0);
 return {accuracy:actual.filter((v,i)=>v===predicted[i]).length/actual.length,precision:mean('precision'),recall:mean('recall'),f1:mean('f1'),confusionMatrix,perClass};
}
export function runMLPipeline(data:DataRow[],target:string,seed=42){
 if(!data.length||!target||!Object.hasOwn(data[0],target))throw Error('Selecione uma coluna alvo válida.');
 const features=Object.keys(data[0]).filter(c=>c!==target);
 if(!features.length||features.length>29)throw Error('Use de 1 a 29 colunas de atributos.');
 const {train,test}=stratifiedSplit(data,target,seed);
 return evaluateSplit(train,test,target,features,seed);
}
function evaluateSplit(train:DataRow[],test:DataRow[],target:string,features:string[],seed:number){
 // Fit only on training rows; never infer categories or imputation from held-out rows.
 const prep=fitPreprocessor(train,features),X=prep.transform(train),testX=prep.transform(test);
 const labels=[...new Set(train.map(r=>String(r[target]).trim()))].sort();
 const coded=labels.map((_,i)=>i);const featureNames=prep.names.map((_,i)=>`x${i}`);
 const training=X.map((values,i)=>Object.fromEntries([...values.map((v,j)=>[featureNames[j],v]),['__target',coded[labels.indexOf(String(train[i][target]).trim())]]]));
 const model=new DecisionTreeClassifier();model.train(training,featureNames,'__target');
 const predictions=testX.map(row=>labels[model.predict(row)]);
 const majority=labels.reduce((best,label)=>train.filter(r=>String(r[target]).trim()===label).length>train.filter(r=>String(r[target]).trim()===best).length?label:best,labels[0]);
 const baselineAccuracy=test.filter(r=>String(r[target]).trim()===majority).length/test.length;
 return {targetColumn:target,labels,seed,trainCount:train.length,testData:test,predictions,baselineAccuracy,metrics:classificationMetrics(test.map(r=>String(r[target]).trim()),predictions,labels),featureImportances:prep.names.map((name,i)=>({name,score:model.featureImportances[i]})).sort((a,b)=>b.score-a.score),preprocessing:prep.rules};
}
export function crossValidate(data:DataRow[],target:string,seed=42){
 stratifiedSplit(data,target,seed); // Validate the same data limits before creating folds.
 const features=Object.keys(data[0]).filter(c=>c!==target);if(!features.length||features.length>29)throw Error('Use de 1 a 29 atributos.');
 const groups=new Map<string,number[]>();data.forEach((r,i)=>{const label=String(r[target]).trim();groups.set(label,[...(groups.get(label)||[]),i]);});
 const k=Math.min(5,...[...groups.values()].map(g=>g.length)),folds:number[][]=Array.from({length:k},()=>[]);
 for(const indexes of groups.values())seededShuffle(indexes,seed).forEach((index,i)=>folds[i%k].push(index));
 const results=folds.map((testIndexes,i)=>{const ids=new Set(testIndexes);const train=data.filter((_,index)=>!ids.has(index)),test=testIndexes.map(index=>data[index]);return evaluateSplit(train,test,target,features,seed+i);});
 const mean=(key:'accuracy'|'f1')=>results.reduce((sum,r)=>sum+r.metrics[key]/k,0),accuracy=mean('accuracy'),f1=mean('f1');
 return {folds:k,accuracy,f1,accuracyStd:Math.sqrt(results.reduce((sum,r)=>sum+(r.metrics.accuracy-accuracy)**2/k,0)),baselineAccuracy:results.reduce((sum,r)=>sum+r.baselineAccuracy/k,0),testIndexes:folds};
}
export type ExtendedMLResult=ReturnType<typeof runMLPipeline>;
