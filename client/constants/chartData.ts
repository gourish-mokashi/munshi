// Sales chart data: current period vs previous period comparison
export type PeriodType = 'weekly' | 'monthly' | 'yearly';

export interface ChartDataPoint {
  value: number;
  label?: string;
  dataPointText?: string;
}

export interface SalesData {
  currentPeriod: ChartDataPoint[];
  totalRevenue: number;
  percentageChange: number;
  isPositive: boolean;
}

// Format currency in Indian Rupees
export const formatCurrency = (value: number): string => {
  if (!isFinite(value) || isNaN(value)) return '₹0';  

  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)}Cr`;
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}k`;
  }
  return `₹${value.toFixed(0)}`;
};

export const getYAxisLabels = (maxValue: number): string[] => {
  const step = maxValue / 4;
  return [
    '0',
    formatCurrency(step).replace('₹', ''),      // Changed $ to ₹
    formatCurrency(step * 2).replace('₹', ''),
    formatCurrency(step * 3).replace('₹', ''),
    formatCurrency(maxValue).replace('₹', ''),
  ];
};
