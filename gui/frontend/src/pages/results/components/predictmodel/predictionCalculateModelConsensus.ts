import type { PredictionModelProps } from "./types";

const MODEL_KEYS = [
  "ativd_pred_LR",
  "ativd_pred_NB",
  "ativd_pred_DT",
  "ativd_pred_RF",
  "ativd_pred_SVM",
  "ativd_pred_XGB",
] as const;

/**
 * Calcula o número de vezes que cada modelo previu ativo em um conjunto de métricas
 * @param metrics - Array de dados de predição
 * @returns Um objeto com chave = modelo e valor = contagem de ativos
 */
export function PredictionCalculateModelConsensus(metrics: PredictionModelProps[]) {
  const consensusCount: Record<string, number> = {};

  // Inicializa contagem zerada
  MODEL_KEYS.forEach((key) => {
    consensusCount[key] = 0;
  });

  metrics.forEach((row) => {
    MODEL_KEYS.forEach((key) => {
      // Supondo que valores >= 0.5 indicam predição de ativo
      if (row[key] !== null && row[key] !== undefined && row[key] >= 0.5) {
        consensusCount[key] += 1;
      }
    });
  });

  return consensusCount;
}