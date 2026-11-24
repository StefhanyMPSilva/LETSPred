import { useEffect, useState } from "react";
import type { LoadStateProps, ModelMetricsProps } from "@mytypes/global";

export function usePrebuildTables(
  tables: { id: string; title: string; csvPath: string }[],
  parseCSV: (csv: string) => ModelMetricsProps[]
) {
  const [allMetrics, setAllMetrics] = useState<Record<string, ModelMetricsProps[]>>({});
  const [loadState, setLoadState] = useState<LoadStateProps>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAllTables = async () => {
      try {
        setLoadState("loading");

        const metricsData: Record<string, ModelMetricsProps[]> = {};

        await Promise.all(
          tables.map(async table => {
            const response = await fetch(table.csvPath);
            const contentType = response.headers.get("content-type");

            if (!response.ok) {
              throw new Error(`CSV not found for ${table.title}`);
            }

            if (!contentType?.includes("text/csv")) {
              throw new Error(`Invalid content type for ${table.title}`);
            }

            const text = await response.text();
            metricsData[table.id] = parseCSV(text);
          })
        );

        setAllMetrics(metricsData);
        setLoadState("success");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoadState("error");
      }
    };

    loadAllTables();
  }, [tables, parseCSV]);

  return { allMetrics, loadState, error };
}
