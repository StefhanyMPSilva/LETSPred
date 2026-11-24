// import { TrainedModelsList } from "./TrainedModelsList";
import { AsyncState } from "@components/AsyncState";
import { useCSVModels } from "@hooks/useCSVModels";
import type { ModelMetricsProps } from "@mytypes/global";

type TableColumn = keyof ModelMetricsProps | "Perfomance";

const columns: TableColumn[] = [
  "Model",
  "Perfomance",
  "Recall",
  "Precision",
  "Specificity",
  "Accuracy",
  "Error",
  "F_Score",
  "Cohen_s_kappa",
  "MCC",
  "AUC_ROC"
];

interface TrainedModelsProps {
  metricsUrl: string;
}

export function TrainedModels({metricsUrl} : TrainedModelsProps) {
  const { data: metrics, loadState, error } = useCSVModels<ModelMetricsProps>({ url: metricsUrl, });

  const testMetrics = metrics.filter(m => m.Database === "Test");
  const perfomance = Math.max(...testMetrics.map(item => Number(item.MCC)));;

  return (
    <AsyncState
      isLoading={loadState === "loading"}
      error={loadState === "error" ? error : null}
      isEmpty={loadState === "success" && metrics.length === 0}
    >
      <section className="flex mt-6 gap-4">
            {/* <TrainedModelsList /> */}

            <div className="w-full">
                <div className="overflow-x-auto rounded-lg shadow-md">
                    <table className="min-w-full text-sm text-gray-700">
                        <thead className="bg-gray-100/70 text-blue-700 font-semibold text-center">
                            <tr>
                            {columns.map((col) => (
                                <th key={col} className="px-4 py-2 border-b border-b-gray-300">
                                {col}
                                </th>
                            ))}
                            </tr>
                        </thead>

                        <tbody>
                            {testMetrics.map((row, index) => {
                                const isBestModel = Number(row.MCC) === perfomance;

                                return(
                                    <tr
                                        key={index}
                                        className={`border-b border-gray-300 transition ${
                                            isBestModel ? "bg-green-50 text-emerald-700" : "hover:bg-gray-50"
                                        }`}
                                    >
                                        {columns.map((col) => {
                                            if (col === "Perfomance") {
                                                return (
                                                <td key={col} className="px-5 py-2 text-center">
                                                    {isBestModel && (
                                                    <div className="bg-orange-600 py-1 rounded-full text-sm font-semibold text-white flex items-center justify-center">
                                                        <span>Best</span>
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
                </div>
            </div>
        </section>
    </AsyncState>
  );
}
