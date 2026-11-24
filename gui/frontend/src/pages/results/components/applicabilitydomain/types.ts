export interface ApplicabilityPointProps {
   id: number;
   name?: string; 
   euclidean: number;
   mahalanobis: number;
   outOfDomain?: boolean;
}

export interface ApplicabilityLimitsProps {
   euclidean: number;
   mahalanobis: number;
}

export interface MetricMapProps {
  euclidean?: number;
  mahalanobis?: number;
}

export interface DistanceCSVRowProps {
  Distance: "euclidean" | "mahalanobis";
  limite: number;
}