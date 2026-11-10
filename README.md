# AI Data Predictor Pro

Laboratório educacional de classificação com árvore de decisão, métricas multiclasse e exploração de correlações. Autor: Waly Robert. Derivado do projeto do autor no Google AI Studio; esta edição mantém o classificador e corrige avaliação, entrada de dados e execução fora do Studio.

## Executar

Requer Node.js 22.16 ou superior e npm.

```bash
npm ci
npm run dev
```

Abra o endereço indicado. Use “Usar exemplo sintético”, selecione `classe` e execute “Treinar e avaliar”. Para produção estática: `npm run build` e `npm run preview`. Código compilado em `dist/`.

## O que funciona

- Importação local CSV (vírgula, ponto e vírgula ou tabulação) e XLSX, primeira aba.
- Limites: 1 MB, 1000 registros, 30 colunas; 2 a 20 classes, pelo menos 2 registros por classe, 10 no total.
- Divisão estratificada de aproximadamente 80/20 com semente 42. Em classes pequenas a proporção muda para manter treino e teste.
- Pré-processamento ajustado **somente no treino**: imputação numérica pela média; categorias em one-hot, até 20 por coluna e 100 atributos codificados. Coluna totalmente vazia no treino vira zero. Categoria ausente/inédita vira vetor zero. Valores inválidos em atributo numérico de teste recebem a média do treino. O alvo nunca é imputado.
- Árvore de decisão em TypeScript, impureza Gini, profundidade máxima 5; até 32 limiares candidatos por atributo/nó para limitar custo.
- Acurácia, precisão/recall/F1 macro e matriz de confusão com os rótulos originais. Denominador zero nas métricas por classe produz 0.
- Importância pela redução de Gini e correlação de Pearson exploratória apenas para colunas numéricas; pares ausentes são excluídos e correlação indefinida aparece como “—”.

Os dados são processados no navegador. Não há chamada de IA externa, tradução automática, conta, chave de API ou servidor de inferência. Cabeçalhos e rótulos são preservados. XLS antigo não é suportado; fórmulas/estilos de Excel não são executados nem preservados. CSV exige ponto decimal; um valor com vírgula decimal será texto/categoria, não um número convertido automaticamente.

## Limitações

Projeto experimental, não AutoML de produção. Uma única divisão não estima robustez fora do domínio; há validação cruzada estratificada de 2 a 5 folds, com pré-processamento ajustado em cada treino e referência da classe majoritária. Não há balanceamento, ajuste de hiperparâmetros, regressão, persistência do modelo ou previsão de um segundo arquivo. Remova identificadores e atributos que revelem o alvo: separação treino/teste não elimina vazamento presente nas próprias colunas. Importância não implica causalidade. Dados grandes ou XLSX com expansão elevada podem consumir memória mesmo com limite do arquivo compactado.

Use exemplos sintéticos ou dados que você possa processar. O exemplo embutido é artificial e não constitui benchmark externo.

## Verificação

```bash
npm test
npm run build
```

Testes cobrem métricas para três classes, separação reprodutível sem sobreposição, média/categorias aprendidas no treino, classes inválidas, correlação indefinida, CSV com aspas, XLSX real e o fluxo da interface. O build verifica TypeScript. O workflow do GitHub Actions repete instalação, testes e build em Node.js 22.

## Organização e licença

`services/machineLearning.ts`: árvore e avaliação. `services/dataProcessor.ts`: transformações e correlação. `services/files.ts`: importação. `tests/`: regressões. A interface foi adaptada para a versão local; a versão do Studio não é sobrescrita.

Uma licença de redistribuição para o código do projeto ainda não foi definida pelo autor. As dependências mantêm suas próprias licenças.


## Início e diagnóstico simplificados

Após `npm ci`, execute `npm run diagnostico` para verificar Node, dependências, build e presença de configuração sem revelar chaves ou consumir cota. Execute `npm run iniciar` para compilar a versão atual e abrir o servidor local em um único terminal. A faixa de estado da interface distingue configuração ausente e integração ainda não comprovada. Encontrar uma chave não confirma que ela é válida nem que existe cota gratuita. Nenhum teste de geração é iniciado automaticamente.


## Benchmark de referência

O código desta edição foi avaliado com os 150 registros do dataset público Iris (UCI Machine Learning Repository, https://archive.ics.uci.edu/dataset/53/iris), semente 42: acurácia de 90% no holdout de 30 registros e média de 93,33% em cinco folds estratificados (desvio de 3,65 pontos percentuais). Referência da classe majoritária: 33,33%. São resultados neste dataset e nessas divisões, sem garantia para outro domínio. O dataset não acompanha o código.

