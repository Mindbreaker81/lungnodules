export type PredictiveModelId = "mayo" | "brock" | "herder";
export type PredictiveStatus = "available" | "insufficient_data" | "not_applicable";
export type PredictiveRiskBand = "low" | "intermediate" | "high";

export interface PredictiveModelSummary {
  id: PredictiveModelId;
  label: string;
  status: PredictiveStatus;
  reason?: string;
  missingFields?: string[];
  probability?: number;
  riskBand?: PredictiveRiskBand;
  preTestModelId?: PredictiveModelId;
  preTestProbability?: number;
  notes?: string[];
}
