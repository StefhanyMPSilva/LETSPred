import type { ApplicabilityLimitsProps, ApplicabilityPointProps, DistanceCSVRowProps, MetricMapProps } from "./types";
import Papa from "papaparse";

interface ApplicabilityDomainDataProps {
  points: ApplicabilityPointProps[];
  limits: ApplicabilityLimitsProps;
  metrics: MetricMapProps;
}

interface ApplicabilityDomainUrlsProps {
  pointsUrl: string;
  distanceUrl: string;
}

/**
 * Serviço principal para carregamento dos dados de domínio de aplicabilidade
 */
export async function ApplicabilityDomainService({ pointsUrl, distanceUrl }: ApplicabilityDomainUrlsProps): Promise<ApplicabilityDomainDataProps> {
   const [pointsResponse, distanceResponse] = await Promise.all([
      fetch(pointsUrl),
      fetch(distanceUrl),
   ]);

   if (!pointsResponse.ok || !distanceResponse.ok) {
      throw new Error("No data avaliable");
   }
  
   // Extrai texto dos CSVs
   const [pointsText, distanceText] = await Promise.all([
      pointsResponse.text(),
      distanceResponse.text(),
   ]);

   const limits = parseLimitsCSV(distanceText);
   const metrics = parseDistanceCSV(distanceText);

   // Processa pontos e adiciona flag outOfDomain
   const points = parsePointsCSV(pointsText).map(point => ({
   ...point,
   outOfDomain:
      point.euclidean > limits.euclidean ||
      point.mahalanobis > limits.mahalanobis,
   }));

   return { points, limits, metrics};
}


/* ================== Parsers ================== */
//Parseia o CSV de pontos para extrair coordenadas
function parsePointsCSV(csv: string): ApplicabilityPointProps[]{
   const lines = csv.trim().split("\n");
   const header = lines[0].split(",");

   const euclideanIndex = header.indexOf("dist_euclidiana");
   const mahalanobisIndex = header.indexOf("dist_mahalanobis");
   const nameIndex        = header.indexOf("name");

   if (euclideanIndex === -1 || mahalanobisIndex === -1) {
      throw new Error("Colunas de distância não encontradas");
   }

   return lines.slice(1).map((line, index) => {
      const values = line.split(",");

      return {
         id: index,
         name: nameIndex !== -1 ? values[nameIndex] : undefined,
         euclidean: Number(values[euclideanIndex]),
         mahalanobis: Number(values[mahalanobisIndex]),
      };
   });
}

//Parseia o CSV de limites para extrair os valores threshold
function parseLimitsCSV(csv: string): ApplicabilityLimitsProps {
   const lines = csv.trim().split("\n");

   const limits: Partial<ApplicabilityLimitsProps> = {};

   lines.slice(1).forEach(line => {
      const [distance, value] = line.split(",");

      if (distance === "euclidean") {
         limits.euclidean = Number(value);
      }

      if (distance === "mahalanobis") {
         limits.mahalanobis = Number(value);
         }
      });

      if ( limits.euclidean === undefined || limits.mahalanobis === undefined) {
         throw new Error("Limites incompletos no CSV");
      }
   return limits as ApplicabilityLimitsProps;
}

//Parseia o CSV de distâncias para extrair métricas
function parseDistanceCSV(csvText: string): MetricMapProps {
  const result = Papa.parse<DistanceCSVRowProps>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  const metrics: MetricMapProps = {};

  result.data.forEach(row => {
    metrics[row.Distance] = row.limite;
  });

  return metrics;
}