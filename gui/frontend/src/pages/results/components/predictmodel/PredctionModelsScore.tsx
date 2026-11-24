import type { PredictionModelProps } from "./types";

const MODEL_SCORES = [
  { key: "ativd_pred_LR", label: "LR" },
  { key: "ativd_pred_NB", label: "NB" },
  { key: "ativd_pred_DT", label: "DT" },
  { key: "ativd_pred_RF", label: "RF" },
  { key: "ativd_pred_SVM", label: "SVM" },
  { key: "ativd_pred_XGB", label: "XGB" },
] as const;

function getPercentageColor(value?: number) {
  if (value === null || value === undefined) return "text-gray-400";
  if (value >= 0.5) return "text-green-600";
  return "text-rose-400";
}

function formatPercentage(value: number | null | undefined, decimals = 2) {
  if (value === null || value === undefined) return "-";
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Configuração dos modelos e suas respectivas chaves no objeto de dados
 * Mapeia as chaves do CSV para rótulos amigáveis de exibição
 * Componente responsável por renderizar os scores individuais de cada modelo em um grid compacto de 6 colunas
*/

export function PredcitonModelsScore({row}: {row : PredictionModelProps}) {
  return (
    <div className="grid grid-cols-6 max-s1024:grid-cols-3 gap-2 min-w-0">
      {MODEL_SCORES.map(({ key, label }) => {
        const value = row[key];

        return (
          <div key={key} className="flex flex-col items-center">
            <span className="text-sm uppercase font-bold text-slate-400 mb-0.5">
              {label}
            </span>
            <span className={`text-sm ${getPercentageColor(value)}`}>
              {formatPercentage(value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}