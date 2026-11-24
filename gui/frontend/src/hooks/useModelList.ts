// hooks/useModelList.ts
import { useEffect, useMemo, useState } from "react";
import type { LoadStateProps } from "@mytypes/global";

interface ModelItem {
  id: string;
  name: string;
  created_at: string | null;
  models: string[];
  ready: boolean;
}

interface UseModelListReturn {
  models: ModelItem[];
  tables: { id: string; title: string; csvPath: string }[];
  loadState: LoadStateProps;
  error: string | null;
  refetch: () => void;
}

type ModelSource = "prebuild" | "usermodel";

export function useModelList(source: ModelSource): UseModelListReturn {
  const [models, setModels] = useState<ModelItem[]>([]);
  const [loadState, setLoadState] = useState<LoadStateProps>("loading");
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoadState("loading");

        const response = await fetch(`/models/${source}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${source} models`);
        }

        const data = await response.json();
        setModels(data.models ?? []);
        setLoadState("success");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoadState("error");
      }
    };

    fetchModels();
  }, [source, tick]);

  const tables = useMemo(() =>
        models
            .filter(m => m.ready)
            .map(m => ({
                id:      m.id,
                title:   m.name,
                csvPath: `/models/${source}/${m.id}/metrics`,
            })),
        [models, source]
    );

  const refetch = () => setTick(t => t + 1);

  return { models, tables, loadState, error, refetch };
}