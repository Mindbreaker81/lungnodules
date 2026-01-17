export type PredictiveModelId = "mayo" | "brock" | "herder";
export type PredictiveStatus = "pending" | "insufficient_data" | "not_applicable";

export interface PredictiveModelSummary {
  id: PredictiveModelId;
  label: string;
  status: PredictiveStatus;
  reason?: string;
  missingFields?: string[];
  notes?: string[];
}
