# TrainingFilesUploads Component

## Descrição
`index.tsx` é o componente pai, responsável por organizar os demias componetes, assim como verificar os componentes que serão submetidos para análise através da função `handleSubmit`.

O componente `TrainingFilesUploads` é responsável por gerenciar o upload e a validação dos arquivos de treinamento necessários para a geração de modelos, bem como coletar um prefixo para arquivos de saída.

O `SelectingModel` é um componente de interface que permite ao usuário selecionar qual tipo de modelo deseja utilizar ou criar.

O `PreBuildModelTable` é um componente que exibe tabelas comparativas de modelos de machine learning pré-construídos, permitindo ao usuário visualizar e selecionar diferentes conjuntos de dados para análise.

O `ModelConfiguration` é um componente que gerencia a segunda etapa do fluxo de seleção de modelos, exibindo a interface apropriada com base no tipo de modelo escolhido anteriormente.

O componente `FlowSidebar` alternar entre os componetes selecionados, além de apresentar breve instruções
---

