import Papa from "papaparse";
import { useEffect, useState } from "react";
import { usePrebuildTables } from "@hooks/usePreBuildModel";
import type { ModelMetricsProps } from "@mytypes/global";
import { ChevronDown } from "lucide-react";
import { useModelList } from "@hooks/useModelList";

interface PreBuildModelProps {
    selectedTableId: string | null;
    onSelectTable: (tableId: string) => void;
    selectedModelTypes: Set<string>;                          
    onSelectModelTypes: (models: Set<string>) => void;        
}

type TableColumn = keyof ModelMetricsProps | "Performance";

const columns: TableColumn[] = [
  "Model", "Performance", "Recall", "Precision",
  "Specificity", "Accuracy", "Error", "F_Score", "Cohen_s_kappa", "MCC", "AUC_ROC"
];

function bestmodelparseCSV(csvText: string): ModelMetricsProps[] {
  const result = Papa.parse<ModelMetricsProps>(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  return result.data;
};

/**
 * Componente principal para exibição das tabelas de modelos pré-construídos
 * Gerencia o carregamento dos CSVs e a renderização das tabelas com destaque
 * para o melhor modelo de cada conjunto de dados
 */
export function PreBuildModelTable({ onSelectTable, selectedTableId, selectedModelTypes, onSelectModelTypes }: PreBuildModelProps) {
    const { tables, loadState: listState } = useModelList("prebuild");
    const { allMetrics, loadState, error } = usePrebuildTables(tables, bestmodelparseCSV);
    const [openTables, setOpenTables] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!selectedTableId && tables.length > 0) {
            onSelectTable(tables[0].id);
        }
    }, [selectedTableId, tables, onSelectTable]);

    function handleToggle(tableId: string) {
        setOpenTables(prev => {
            const next = new Set(prev);
            next.has(tableId) ? next.delete(tableId) : next.add(tableId);
            return next;
        });
        onSelectTable(tableId);
    }

    if (listState === "loading" || loadState === "loading") {
        return (
            <div className="mt-6 space-y-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-full rounded-lg shadow-md p-8 text-center">
                        <div className="h-6 w-6 mx-auto rounded-full border-2 border-gray-300 border-t-blue-600 animate-spin mb-2"></div>
                        <p className="text-gray-500">Loading models...</p>
                    </div>
                ))}
            </div>
        );
    }

    if (loadState === "error") {
        return (
            <div className="p-8 text-center text-red-600 text-2xl">
                <p>Failed to load prebuilt model</p>
                <p className="text-sm text-gray-500">{error}</p>
            </div>
        );
    }

    return (
        <section className="mt-6 space-y-6">
            
            {tables.map(table => {
                const metrics = allMetrics[table.id] || [];
                const isSelected = selectedTableId === table.id;
                const isOpen = openTables.has(table.id);

                // Encontrar o melhor modelo pelo MCC
                const testMetrics = metrics.filter(row => row.Database === "Test");
                const bestMCC = testMetrics.length > 0
                    ? Math.max(...testMetrics.map(row => Number(row.MCC)))
                    : null;
                const bestModels = new Set (testMetrics.filter(row => Number(row.MCC) === bestMCC)?.map(row => row.Model));
                
                return (
                    
                    <div key={table.id} onClick={() => onSelectTable(table.id)} className={`w-full overflow-x-auto rounded-lg shadow-md cursor-pointer ring-2 transition ${isSelected ? "ring-blue-500 bg-blue-50/30" : "ring-transparent hover:ring-blue-400"}`} >
                        {/* Header */}
                        <button type="button" onClick={() => handleToggle(table.id)}
                            className={`w-full flex items-center justify-between p-4 rounded-lg cursor-pointer transition ${
                                isSelected ? "bg-blue-50" : "bg-gray-50/50 hover:bg-gray-100"
                            }`}>
                            <span className={`font-semibold ${isSelected ? "text-blue-600" : "text-gray-800"}`}>
                                {table.title}
                            </span>
                            <ChevronDown
                                className={`w-5 h-5 transition-transform duration-200 ${
                                    isOpen ? "rotate-180 text-blue-500" : "text-gray-400"
                                }`}/>
                        </button>
                        
                        {/*Tabela*/}
                        {isOpen && (
                            <div className="border-t border-gray-200 overflow-x-auto p-2">
                                {metrics.length > 0 ? (
                                    <TableContent metrics={metrics} />
                                ) : (
                                    <p className="text-gray-500 py-8 text-center">No data available</p>
                                )}
                            </div>
                        )}

                        {/* Seleção de modelo */}
                        {isSelected && (
                            <div className="border-t border-gray-200 p-4">
                                <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">
                                    Select models
                                </p>
                                <div className="flex flex-wrap gap-2">

                                    {/* Botão ALL */}
                                    <button
                                        type="button"
                                        onClick={e => {
                                            e.stopPropagation();
                                            onSelectModelTypes(new Set(["ALL"]));
                                        }}
                                        className={`
                                            px-5 py-2 rounded-lg border-2 font-semibold text-sm transition-all
                                            ${selectedModelTypes.has("ALL")
                                                ? "bg-blue-500 border-blue-500 text-white shadow-md"
                                                : "bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-500"
                                            }
                                        `}
                                    >
                                        ALL
                                    </button>

                                    {/* Botões individuais */}
                                    {testMetrics.map(row => {
                                        const isBest   = bestModels.has(row.Model);
                                        const isChosen = !selectedModelTypes.has("ALL") && selectedModelTypes.has(row.Model);

                                        function handleClick(e: React.MouseEvent) {
                                            e.stopPropagation();
                                            const next = new Set(selectedModelTypes);
                                            next.delete("ALL"); // desativa ALL ao selecionar individual

                                            if (next.has(row.Model)) {
                                                next.delete(row.Model);
                                                // Se ficou vazio, volta para ALL
                                                if (next.size === 0) next.add("ALL");
                                            } else {
                                                next.add(row.Model);
                                            }

                                            onSelectModelTypes(next);
                                        }

                                        return (
                                            <button
                                                key={row.Model}
                                                type="button"
                                                onClick={handleClick}
                                                className={`
                                                    relative px-5 py-2 rounded-lg border-2 font-semibold text-sm transition-all
                                                    ${isChosen
                                                        ? "bg-blue-500 border-blue-500 text-white shadow-md"
                                                        : "bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-500"
                                                    }
                                                `}
                                            >
                                                {row.Model}
                                                {isBest && (
                                                    <span className={`
                                                        absolute -top-2 -right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full
                                                        ${isChosen ? "bg-white text-blue-500" : "bg-orange-500 text-white"}
                                                    `}>
                                                        Best
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </section>
    );
}

/**
 * Componente interno que renderiza o conteúdo da tabela de métricas
 * Filtra apenas os dados de teste e destaca o melhor modelo baseado no MCC
 */
function TableContent({ metrics } : { metrics: ModelMetricsProps[] }) {
    const testMetrics = metrics.filter(row => row.Database === "Test");
    const performance = testMetrics.length > 0 
        ? Math.max(...testMetrics.map(row => Number(row.MCC)))
        : 0;

    return (
        <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-gray-100/70 text-blue-700 font-semibold text-center">
                <tr>
                    {columns.map(col => (
                        <th key={col} className="px-4 py-2 border-b border-b-gray-300">
                            {col}
                        </th>
                    ))}
                </tr>
            </thead>

            <tbody>
                {testMetrics.map((row, index) => {
                    const isBestModel = Number(row.MCC) === performance;

                    return (
                        <tr key={index} className={`border-b border-gray-300 transition ${ isBestModel ? "bg-green-50 text-emerald-700" : "hover:bg-gray-50" }`} >
                            {columns.map(col => {
                                if (col === "Performance") {
                                    return (
                                        <td key={col} className="px-4 py-2">
                                            {isBestModel && (
                                                <div className="bg-orange-600 py-1 rounded-full text-sm font-semibold text-white flex items-center justify-center">
                                                    Best
                                                </div>
                                            )}
                                        </td>
                                    );
                                }

                                if (col === "MCC" && isBestModel) {
                                    return (
                                        <td key={col} className="px-4 py-2 text-center">
                                            <span className="inline-flex items-center px-4 py-0.5 bg-indigo-600 rounded-md font-semibold text-white">
                                                {row[col]}
                                            </span>
                                        </td>
                                    );
                                }

                                return (
                                    <td key={col} className="px-4 py-2 text-center">
                                        {row[col as keyof ModelMetricsProps]}
                                    </td>
                                );
                            })}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

