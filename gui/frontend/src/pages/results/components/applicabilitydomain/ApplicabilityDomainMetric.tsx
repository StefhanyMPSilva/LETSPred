interface MetricCardProps {
  title: string;
  value?: number;
  colorClass?: string;
  formatter?: (value: number) => string;
}

/**
 * Card estilizado para exibição de métricas
 */ 
export function ApplicabilityDomainMetric({ title, value, colorClass, formatter }: MetricCardProps) {
    return (
        <div className="w-72 max-s1280:w-48 max-s1024:w-full rounded-2xl border border-gray-200 bg-white p-6 max-s1280:p-4 shadow-sm">
            <h3 className="text-sm font-medium text-indigo-700">{title}</h3>
            <p className={`mt-2 text-3xl max-s1280:text-2xl font-semibold ${colorClass ?? "text-gray-700"}`}>
                {value === undefined
                    ? "--"
                    : formatter
                    ? formatter(value)
                    : value.toFixed(2)}
            </p>
        </div>
    );
}
