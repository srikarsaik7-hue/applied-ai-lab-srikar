export interface SalesOrder {
  order_id?: string;
  order_date?: string;
  quarter: string;
  region: string;
  channel: string;
  product: string;
  customer_type?: string;
  sales_rep?: string;
  units: number;
  unit_price?: number;
  discount_pct: number;
  revenue: number;
  wasCleaned?: boolean;
  cleaningNotes?: string[];
}

export interface CleaningRecord {
  rowNumber: number;
  orderId: string;
  column: 'region' | 'quarter' | 'channel' | 'product' | 'customer_type' | 'sales_rep' | 'units' | 'discount_pct' | 'revenue' | 'unit_price';
  originalValue: string;
  cleanedValue: string;
  reason: string;
}

export interface DataCleaningAudit {
  totalCorrectionsCount: number;
  correctionsByColumn: Record<string, number>;
  records: CleaningRecord[];
  rulesApplied: string[];
}

export interface MetricDriver {
  name: string;
  q2Revenue: number;
  q3Revenue: number;
  diff: number;
  pctChange: number;
}

export interface RegionSummary {
  region: string;
  q1Revenue: number;
  q2Revenue: number;
  q3Revenue: number;
  totalRevenue: number;
  q2ToQ3Diff: number;
  q2ToQ3PctChange: number;
  q1Units: number;
  q2Units: number;
  q3Units: number;
  totalUnits: number;
}

export interface QuarterTotal {
  quarter: string;
  totalRevenue: number;
  totalUnits: number;
  orderCount: number;
}

export interface VarianceAnalysis {
  mostChangedRegion: string;
  changeType: 'increase' | 'decrease';
  q2Revenue: number;
  q3Revenue: number;
  diff: number;
  absDiff: number;
  pctChange: number;
  q2Units: number;
  q3Units: number;
  unitsDiff: number;
  unitsPctChange: number;
  q2AvgDiscountPct: number;
  q3AvgDiscountPct: number;
  discountDiffPctPoints: number;
  productDrivers: MetricDriver[];
  channelDrivers: MetricDriver[];
  allRegions: Array<{
    region: string;
    q1Revenue: number;
    q2Revenue: number;
    q3Revenue: number;
    totalRevenue: number;
    diff: number;
    pctChange: number;
  }>;
}

export interface AISummaryResponse {
  summary: string;
  source: 'gemini-3.8-flash' | 'calculated_engine';
  warning?: string;
}
