/* Used by the files: 
    /hooks/usePreBuildModel.ts
    /hooks/useCSVModels.ts
    /pages/results/components/applicabilitydomain/ApplicabilityDomain.tsx
    */
export type LoadStateProps = "loading" | "success" | "error";


/* Used by the files:
    /hooks/usePreBuildModel.ts 
    /pages/home/components/PreBuildModelTable.tsx
    /pages/results/components/traindedmodels/TrainedModels.tsx
    */
export interface ModelMetricsProps {
  Model: string;
  Database: string;
  Recall: number;
  Precision: number;
//   Sensitivity: number;
  Specificity: number;
  Accuracy: number;
  Error: number;
  F_Score: number;
  Cohen_s_kappa: number;
  MCC: number;
  AUC_ROC: number;
}