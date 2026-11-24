import { useEffect, useRef, useState } from "react";
import KatuCharts from "katucharts.js";

import { AsyncState } from "@components/AsyncState";
import type { LoadStateProps } from "@mytypes/global";
import type { ApplicabilityLimitsProps, ApplicabilityPointProps, MetricMapProps } from "./types";

import { ApplicabilityDomainMetric } from "./ApplicabilityDomainMetric";
import { ApplicabilityDomainTable } from "./ApplicabilityDomainTable";
import { ApplicabilityDomainService } from "./applicabilityDomainService";

interface ApplicabilityDomainProps {
  domainUrl: string;
}

/**
 * Componente principal de domínio de aplicabilidade
 *
 * Visualização interativa que combina:
 * - Gráfico de dispersão 2D (Euclidean × Mahalanobis) via KatuCharts
 * - Métricas resumidas (limites e contagens)
 * - Tabela detalhada dos compostos
 *
 * O domínio de aplicabilidade define a região do espaço químico onde
 * as predições do modelo são consideradas confiáveis.
 */
export function ApplicabilityDomain({ domainUrl }: ApplicabilityDomainProps) {
    const [data, setData]       = useState<ApplicabilityPointProps[]>([]);
    const [limits, setLimits]   = useState<ApplicabilityLimitsProps | null>(null);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [metrics, setMetrics] = useState<MetricMapProps>({});
    const [pointsUrl, setPointsUrl] = useState<string>("");
    const [loadState, setLoadState] = useState<LoadStateProps>("loading");
    const [error, setError]     = useState<string | null>(null);

    const chartRef = useRef<HTMLDivElement>(null);

    // Contagens
    const inDomainCount  = data.filter(p => !p.outOfDomain).length;
    const outDomainCount = data.filter(p =>  p.outOfDomain).length;

    const chartInstanceRef = useRef<ReturnType<typeof KatuCharts.chart> | null>(null);

    // ── Carregar dados ────────────────────────────────────────────────────────
    useEffect(() => {
        const loadAll = async () => {
            try {
                setLoadState("loading");

                const pointsUrl_  = domainUrl.replace("/domain", "/domain/points");
                const distanceUrl = domainUrl.replace("/domain", "/domain/distance");

                setPointsUrl(pointsUrl_);

                const { points, limits, metrics } = await ApplicabilityDomainService({
                    pointsUrl: pointsUrl_,
                    distanceUrl,
                });

                setData(points);
                setLimits(limits);
                setMetrics(metrics);
                setLoadState("success");
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load applicability domain");
                setLoadState("error");
            }
        };

        loadAll();
    }, [domainUrl]);

    // ── Renderizar gráfico KatuCharts ─────────────────────────────────────────
    // ── Efeito 1 — criar o gráfico (só quando data ou limits mudam) ──────────
      useEffect(() => {
         if (!chartRef.current || data.length === 0) return;

         if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
            chartInstanceRef.current = null;
         }

         const chart = KatuCharts.chart(chartRef.current, {
            chart: { type: "scatter" },
            title: { text: "" },
            tooltip: {
                formatter: function(this: any) {
                    const name = this.point?.custom?.name
                        ?? this.point?.name
                        ?? "—";
                    return `
                        <b>${name}</b><br/>
                        Euclidean: ${this.x.toFixed(2)}<br/>
                        Mahalanobis: ${this.y.toFixed(2)}
                    `;
                }
            },
            xAxis: {
                  title: { text: "Domain (Euclidean Distance)" },
                  min: 0,
                  plotLines: limits ? [{
                     value: limits.euclidean,
                     color: "red", width: 2, dashStyle: "Dash",
                     label: { text: "Euclidean limit" },
                  }] : [],
            },
            yAxis: {
                  title: { text: "Leverage (Mahalanobis Distance)" },
                  min: 0,
                  plotLines: limits ? [{
                     value: limits.mahalanobis,
                     color: "red", width: 2, dashStyle: "Dash",
                     label: { text: "Mahalanobis limit" },
                  }] : [],
            },
            series: [
                  {
                     name: "Inside domain",
                     marker: { symbol: "circle", radius: 5 },
                     color: "#2563eb",
                     data: data
                        .filter(p => !p.outOfDomain && p.id !== selectedId)
                        .map(p => ({
                              x: p.euclidean,
                              y: p.mahalanobis,
                              id: String(p.id),
                              custom: { numId: p.id, name: p.name }
                        })),
                  },
                  {
                     name: "Outside domain",
                     marker: { symbol: "circle", radius: 5 },
                     color: "#dc2626",
                     data: data
                        .filter(p => p.outOfDomain && p.id !== selectedId)
                        .map(p => ({
                              x: p.euclidean,
                              y: p.mahalanobis,
                              id: String(p.id),
                              custom: { numId: p.id, name: p.name }
                        })),
                  },
                  ...(selectedId !== null ? [{
                     name: "Selected",
                     marker: { symbol: "circle", radius: 10 },
                     color: "#50c878",
                     data: data
                        .filter(p => p.id === selectedId)
                        .map(p => ({
                              x: p.euclidean,
                              y: p.mahalanobis,
                              id: String(p.id),
                              custom: { numId: p.id, name: p.name }
                        })),
                  }] : []),
            ],
            plotOptions: {
                  scatter: {
                     point: {
                        events: {
                              click: function(this: any) {
                                 const numId = this.options?.custom?.numId
                                    ?? this.custom?.numId
                                    ?? this.options?.id;
                                 if (numId !== undefined && numId !== null) {
                                    setSelectedId(Number(numId));
                                 }
                              },
                        },
                     },
                  },
            },
         });

         chartInstanceRef.current = chart;

         return () => {
            chart.destroy();
            chartInstanceRef.current = null;
         };

      }, [data, limits, selectedId]);

   

    return (
        <AsyncState
            isLoading={loadState === "loading"}
            error={loadState === "error" ? error : null}
            isEmpty={loadState === "success" && data.length === 0}
        >
            <>
                <section className="flex max-s1280:flex-col gap-6 mt-4 items-start">

                    {/* Métricas */}
                    <section className="flex flex-col gap-2 max-s1280:flex-row max-s1280:flex-wrap max-s1024:grid max-s1024:grid-cols-2 shrink-0">
                        <ApplicabilityDomainMetric
                            title="Euclidean Limit"
                            value={metrics.euclidean}
                        />
                        <ApplicabilityDomainMetric
                            title="Mahalanobis Limit"
                            value={metrics.mahalanobis}
                        />
                        <ApplicabilityDomainMetric
                            title="Inside Applicability Domain"
                            value={inDomainCount}
                            colorClass="text-emerald-700"
                            formatter={(v) => v.toString()}
                        />
                        <ApplicabilityDomainMetric
                            title="Outside Applicability Domain"
                            value={outDomainCount}
                            colorClass="text-red-700"
                            formatter={(v) => v.toString()}
                        />
                    </section>

                    {/* Gráfico KatuCharts */}
                    <div
                        ref={chartRef}
                        className="w-full h-[560px] max-s1440:h-[480px] max-s1280:h-[400px] bg-white rounded-xl shadow p-2"
                    />

                </section>

                <ApplicabilityDomainTable
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    limits={limits}
                    pointsUrl={pointsUrl}
                />
            </>
        </AsyncState>
    );
}