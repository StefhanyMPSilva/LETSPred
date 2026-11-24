import { useEffect, useState } from "react";
import Papa from "papaparse";
import type { LoadStateProps } from "@mytypes/global";

interface UseCSVDataOptionsProps<T>{
    url: string;
    parser?: (csvText : string) => T[];
}

export function useCSVModels<T>({url, parser}: UseCSVDataOptionsProps<T>){
    const [data, setData] = useState<T[]>([]);
    const [loadState, setLoadState] = useState<LoadStateProps>("loading");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            try{
                setLoadState("loading");

                const response = await fetch(url);
                const contentType = response.headers.get("content-type");

                if (!response.ok) {
                    throw new Error("Invalid CSV file");
                }

                if (!contentType?.includes("text/csv")) {
                    throw new Error("No data available");
                }

                const text = await response.text();
                const parsed = parser
                    ? parser(text)
                    : Papa.parse<T>(text, {
                        header: true,
                        dynamicTyping: true,
                        skipEmptyLines: true,
                        }).data;

                if(isMounted){
                    setData(parsed);
                    setLoadState("success")
                }
            } catch (err) {
                if (isMounted) {
                    setError(err instanceof Error ? err.message : "Unknown error");
                    setLoadState("error");
                }
            }
        };

        load();

        return () => {
            isMounted = false;
        };
    }, [url, parser]);

    return {data, loadState, error};
}