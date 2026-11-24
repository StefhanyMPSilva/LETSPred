interface PredctionModelsConsensusProps {
  value?: number;
  total?: number;
}

/**
 * Componente de barra de progresso para visualização do consenso
 * Exibe o valor numérico e uma barra colorida representando a porcentagem
 */
export function PredctionModelsConsensus({value, total = 6}:PredctionModelsConsensusProps) {
  // Retorna um traço se o valor for nulo ou indefinido
  if (value === null || value === undefined) return "-";

  // Calcula a porcentagem para a barra de progresso
  const percentage = (value / total) * 100;

  // Define a cor da barra baseada no nível de consenso
  const barColor =
    value >= 4
      ? "bg-indigo-500"
      : value >= 1
      ? "bg-indigo-300"
      : "bg-slate-300";

  return (
    <div className="flex flex-col items-center">
      {/* Exibição numérica: valor / total */}
      <span className="font-semibold">
        {value}
        <span className="text-gray-600"> / {total}</span>
      </span>

      {/* Barra de progresso */}
      <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}