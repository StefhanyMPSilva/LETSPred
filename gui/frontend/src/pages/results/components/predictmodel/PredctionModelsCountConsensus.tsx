interface PredctionModelsCountConsensusProps{
  value?: string;
  bestModels: Set<string>;
}

/**
 * Componente que renderiza tags com os nomes dos modelos que concordaram
 * na predição, ou "None" quando não há consenso
 */
export function PredctionModelsCountConsensus({value, bestModels} : PredctionModelsCountConsensusProps) {
  if (!value) return null;
  const models = value.split(",").map(m => m.trim());

  return (
    <div className="flex flex-wrap gap-1 justify-center">
      {models.map(model => {
        const isBest = bestModels.has(model);
          return (
            <span key={model} className={`p-2 rounded-md text-xs font-semibold ${
              isBest ? "bg-orange-500 text-white" : "bg-indigo-100 text-indigo-700"}`}>
                {model}
            </span>
          );
        })}
        </div>
  );
}