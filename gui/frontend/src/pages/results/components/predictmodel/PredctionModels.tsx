import { useMemo, useState } from "react";
import { AsyncState } from "@components/AsyncState";
import { useCSVModels } from "@hooks/useCSVModels";
import { PredcitonModelsScore } from "./PredctionModelsScore";
import { PredctionModelsConsensus } from "./PredctionModelsConsensus";
import { PredctionModelsCountConsensus } from "./PredctionModelsCountConsensus";
import { PredictionCalculateModelConsensus } from "./predictionCalculateModelConsensus";

import type { PredictionModelProps } from "./types";
import type { ModelMetricsProps } from "@mytypes/global";

interface PredictionSummaryCardProps {
  active: number;
  inactive: number;
  modelConsensus: Record<string, number>;
  bestModels: Set<string>;
  sortBy: "active" | "inactive" | null;
  onSort: (sort: "active" | "inactive") => void;
  filterModel: string | null;
  onFilterModel: (model: string) => void;
}

type VisibleColumnProps =
  | "name" | "model_score" | "prediction" | "consensus" | "consensus_Model";

const columns: VisibleColumnProps[] = [
  "name", "model_score", "prediction", "consensus", "consensus_Model",
];

const COLUMN_LABELS: Record<VisibleColumnProps, string> = {
  name: "NAME",
  model_score: "MODELS SCORE",
  prediction: "PREDICTION",
  consensus: "CONSENSUS",
  consensus_Model: "CONSENSUS MODEL",
};

interface PredctionModelsProps {
  predictUrl: string;
  metricsUrl?: string;
}

/**
 * Card de resumo estatístico das predições
 * Exibe contagem de compostos ativos e inativos
 */
function PredictionSummaryCard({ active, inactive, modelConsensus, bestModels, sortBy, onSort, filterModel, onFilterModel}: PredictionSummaryCardProps) {
  return (
    <div className="flex max-s1280:flex-col gap-4 my-4">
      <div className="flex gap-4 max-s1024:flex-col flex-1 min-w-0">
        {/* Active */}
        <div
          onClick={() => onSort("active")}
          className={`flex-1 px-4 py-6 rounded-xl border cursor-pointer transition ${
            sortBy === "active"
              ? "border-emerald-500 bg-emerald-100 shadow-md ring-2 ring-emerald-400"
              : "border-emerald-200 bg-emerald-50 hover:shadow-md hover:border-emerald-400"
          }`}
        >
          <p className="text-sm text-emerald-700 font-semibold">Active</p>
          <p className="text-4xl font-bold text-emerald-800">{active}</p>
          {sortBy === "active" && (
            <p className="text-xs text-emerald-600 mt-1">↑ Sorted to top</p>
          )}
        </div>

        {/* Inactive */}
        <div
          onClick={() => onSort("inactive")}
          className={`flex-1 px-4 py-6 rounded-xl border cursor-pointer transition ${
            sortBy === "inactive"
              ? "border-rose-500 bg-rose-100 shadow-md ring-2 ring-rose-400"
              : "border-rose-200 bg-rose-50 hover:shadow-md hover:border-rose-400"
          }`}
        >
          <p className="text-sm text-rose-700 font-semibold">Inactive</p>
          <p className="text-4xl font-bold text-rose-800">{inactive}</p>
          {sortBy === "inactive" && (
            <p className="text-xs text-rose-600 mt-1">↑ Sorted to top</p>
          )}
        </div>
      </div>

      <section className="border border-indigo-700 rounded-lg shadow-md p-4">
        <h3 className="font-semibold mb-2 text-indigo-700 text-sm">
          Model Consensus Summary
        </h3>

        <div className="flex gap-4 flex-wrap">
          {Object.entries(modelConsensus).map(([key, count]) => {
            const modelName = key.replace("ativd_pred_", "");
            const isBest = bestModels.has(modelName);
            const isFiltered = filterModel === modelName;

            return(
              <div
                key={key}
                onClick={() => onFilterModel(modelName)}
                className={`w-28 max-s780:w-20 px-3 py-2 rounded-md border font-semibold text-sm flex flex-col cursor-pointer transition ${
                    isFiltered
                        ? "ring-2 ring-offset-1 ring-indigo-500 scale-105 shadow-md"
                        : ""
                } ${
                    isBest
                        ? "bg-orange-500 border-orange-600 text-white"
                        : "bg-indigo-200 border-indigo-300 text-indigo-700 hover:bg-indigo-300"
                }`}
              >
                <div>{modelName}</div>
                <div className="text-xl">{count}</div>
                {isFiltered && (
                    <div className="text-[10px] mt-1 opacity-80">Filtered ✓</div>
                )}
            </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}

/**
 * Componente principal de visualização de predições
 * Carrega dados de um arquivo CSV e exibe uma tabela interativa
 * com os resultados da predição para cada composto
 */
export function PredctionModels({ predictUrl, metricsUrl }: PredctionModelsProps) {
  const { data: metrics, loadState, error } = useCSVModels<PredictionModelProps>({ url: predictUrl});
  const { data: modelMetrics } = useCSVModels<ModelMetricsProps>({ url: metricsUrl ?? ""});

  const activeCount = metrics.filter(row => row.consensus >= 1).length;
  const inactiveCount = metrics.length - activeCount;
  const modelConsensus = PredictionCalculateModelConsensus(metrics);

  const bestModels = useMemo(() => {
    const testMetrics = modelMetrics.filter(m => m.Database === "Test");
    if (testMetrics.length === 0) return new Set<string>();
    const bestMCC = Math.max(...testMetrics.map(m => Number(m.MCC)));
    return new Set(testMetrics.filter(m => Number(m.MCC) === bestMCC).map(m => m.Model));
  }, [modelMetrics]);


  const [sortBy, setSortBy] = useState<"active" | "inactive" | null>(null);
  function handleSort(sort: "active" | "inactive") {
    setSortBy(prev => prev === sort ? null : sort);
  }
  
  const [filterModel, setFilterModel] = useState<string | null>(null);
  function handleFilterModel(model: string) {
    setFilterModel(prev => prev === model ? null : model);
  }

  const sortedMetrics = useMemo(() => {
    let result = [...metrics];

    // Filtrar por modelo selecionado
    if (filterModel) {
        result = result.filter(row =>
            row.consensus_Model
                ?.split(",")
                .map(m => m.trim())
                .includes(filterModel)
        );
    }

    // Ordenar por active/inactive
    if (sortBy) {
        result.sort((a, b) => {
            const aActive = a.consensus >= 1;
            const bActive = b.consensus >= 1;
            if (sortBy === "active")   return aActive === bActive ? 0 : aActive ? -1 : 1;
            if (sortBy === "inactive") return aActive === bActive ? 0 : aActive ? 1 : -1;
            return 0;
        });
    }

    return result;
  }, [metrics, sortBy, filterModel]);

  const filteredCount = sortedMetrics.length;

  return (
    <AsyncState
      isLoading={loadState === "loading"}
      error={loadState === "error" ? error : null}
      isEmpty={loadState === "success" && metrics.length === 0}
    >

      <p className="text-gray-500 mb-3 text-left">
          Click on <span className="text-emerald-600 font-semibold">Active</span> or <span className="text-rose-600 font-semibold">Inactive</span> cards, or on a <span className="text-indigo-600 font-semibold">Model</span> card to filter compounds
      </p>
      
      {/* Cards de resumo estatístico */}
      <PredictionSummaryCard
        active={activeCount}
        inactive={inactiveCount}
        modelConsensus={modelConsensus}
        bestModels={bestModels}
        sortBy={sortBy}
        onSort={handleSort}
        filterModel={filterModel}
        onFilterModel={handleFilterModel}
      />

      <section className="flex mt-6 gap-4">
        <div className="w-full">
          {filterModel && (
              <div className="flex items-center justify-center gap-2 mb-2 text-indigo-600">
                  <span>Filtering by model: <strong>{filterModel}</strong></span>
                  <span className="text-gray-400">({filteredCount} compounds)</span>
                  <button
                      type="button"
                      onClick={() => setFilterModel(null)}
                      className="text-red-600 font-bold hover:text-red-400 underline cursor-pointer"
                  >
                      Clear
                  </button>
              </div>
          )}

          <div className="overflow-x-auto overflow-y-auto max-h-[480px] rounded-lg shadow-md">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-slate-50 text-emerald-700 font-semibold sticky top-0">
                <tr>
                  {columns.map((col) => (
                    <th key={col} className="px-2 py-2 border-b border-b-gray-300 text-center">
                      {COLUMN_LABELS[col]}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {sortedMetrics.map((row, index) => {
                  const isActive = row.consensus >= 1;

                  return (
                    <tr key={index} className={`border-b border-b-gray-300 transition ${isActive ? "hover:bg-green-50" : "hover:bg-red-50"}`}>
                      {columns.map((col) => {
                        // COLUNA MODEL SCORE 
                        if (col === "model_score") {
                          return (
                            <td key={col} className="px-2 py-2">
                              <PredcitonModelsScore row={row} />
                            </td>
                          );
                        }

                        // Coluna PREDICTION - Renderiza badge de status Ativo/Inativ
                        if (col === "prediction") {
                          return (
                            <td key={col} className="px-2 py-2 text-center font-semibold" >
                              <div className={`inline-flex items-center py-1 rounded-full text-[14px] font-semibold ring-1 ring-inset
                                ${ isActive
                                  ? "bg-emerald-100 text-emerald-700 ring-emerald-600/20 px-4"
                                  : "bg-rose-100 text-rose-700 ring-rose-600/20 px-2.5"
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full mr-2 ${ isActive ? "bg-emerald-500" : "bg-rose-500" }`}/>
                                    {isActive ? "Active" : "Inactive"}
                              </div>
                            </td>
                          );
                        }

                        // Coluna CONSENSUS - Renderiza barra de progresso do consenso
                        if (col === "consensus") {
                          return (
                            <td key={col} className="px-2 py-2 text-center">
                              <PredctionModelsConsensus value={row.consensus} />
                            </td>
                          );
                        }

                        // Coluna CONSENSUS MODEL - Renderiza contagem de modelos em consenso
                        if (col === "consensus_Model") {
                          return (
                            <td key={col} className="px-2 py-2 text-center">
                              <PredctionModelsCountConsensus value={row.consensus_Model} bestModels={bestModels} />
                            </td>
                          );
                        }

                        // Coluna NAME (padrão) - Exibe o nome do composto
                        return (
                          <td key={col} className="px-2 py-2 text-center">
                            {row[col]}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AsyncState>
  );
}
