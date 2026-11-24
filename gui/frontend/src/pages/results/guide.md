# TrainingFilesUploads Component

## Descrição
`index.tsx` é o componente pai, responsável por organizar os componentes referentes para cada resultado.

Na pasta `trainedmodels` teremos dois componentes: 
*`TrainedModels`, componente ativo que carrega e processa arquivos CSV contendo métricas de modelos treinados. 
*`TrainedModelsList`, foi descontinuado, era um componente responsável por listar os arquivos disponíveis de modelos treinados.

Pasta `predictmodls`, tera os componentes: 
*`PredctionModels` é um componente que visualiza os resultados de predições de modelos para compostos químicos, apresentando uma tabela interativa com métricas de consenso e classificação.
*`PredctionModelsConsensus` é o componente visual que representa o nível de concordância entre modelos
*`PredctionModelsCountConsensus` detalha quais modelos específicos entraram em consenso
*`PredcitonModelsScore` é um componente especializado que exibe os scores individuais de predição para cada modelo em um formato compacto e visualmente informativo.

Pasta `applicabilitydomain`:
*`ApplicabilityDomain` é o componente mais complexo do sistema, responsável por visualizar o domínio de aplicabilidade de modelos QSAR (Quantitative Structure-Activity Relationship).
*`ApplicabilityDomainMetric` é um componente simples e reutilizável para exibir cards de métricas. Oferece flexibilidade com formatação personalizada e cores dinâmicas, mantendo um design consistente para todas as 4 métricas exibidas.
*`ApplicabilityDomainTable` é uma tabela detalhada que complementa a visualização gráfica
*`ApplicabilityDomainService` é a camada de serviço que abstrai a lógica de carregamento e processamento dos dados