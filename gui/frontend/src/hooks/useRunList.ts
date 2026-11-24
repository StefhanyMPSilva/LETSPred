import { useEffect, useState, useMemo } from "react";
import type { LoadStateProps } from "@mytypes/global";

interface RunItem {
  id: string;
  name: string;
}

type RunSource = "usermodel" | "output_predictions";

export function useRunList(source: RunSource) {
  const [runs, setRuns]       = useState<RunItem[]>([]);
  const [loadState, setLoadState] = useState<LoadStateProps>("loading");
  const [error, setError]     = useState<string | null>(null);
  const [tick, setTick]       = useState(0);  // ← precisa existir

  useEffect(() => {
    const fetch_ = async () => {
      try {
        setLoadState("loading");
        const res = await fetch(`/results/${source}`);
        if (!res.ok) throw new Error(`Failed to fetch ${source} runs`);
        const data = await res.json();
        setRuns(data.runs ?? []);
        setLoadState("success");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoadState("error");
      }
    };
    fetch_();
  }, [source, tick]);  

  const latest  = useMemo(() => runs[0] ?? null, [runs]);
  const refetch = () => setTick(t => t + 1);  // ← adicionar

  return { runs, latest, loadState, error, refetch };  // ← incluir no return
}