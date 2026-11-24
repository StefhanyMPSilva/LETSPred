export interface PredictionModelProps {
  name: string;
  ativd_pred_NB: number;
  ativd_pred_LR: number;
  ativd_pred_XGB: number;
  ativd_pred_SVM: number;
  ativd_pred_DT: number;
  ativd_pred_RF: number;
  consensus: number;
  consensus_Model: string;
}