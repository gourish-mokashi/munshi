import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { ActivityIndicator } from 'react-native';
import {
  SalesData,
  PeriodType,
  formatCurrency,
  getYAxisLabels,
} from '@/constants/chartData';
import { TrendUpIcon, TrendDownIcon } from 'phosphor-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH * 0.92 - 60;

const periods: { key: PeriodType; label: string }[] = [
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

const SalesChart = () => {
  const [activePeriod, setActivePeriod] = useState<PeriodType>('monthly');
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<SalesData | null>(null);
  const cache = React.useRef<Partial<Record<PeriodType, SalesData>>>({});

  useEffect(() => {
    // Use cached data if available for instant tab switching
    if (cache.current[activePeriod]) {
      setData(cache.current[activePeriod]);
      return;
    }
    fetchChartData(activePeriod);
  }, [activePeriod]);

  const fetchChartData = async (period: PeriodType) => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/analytics/sales?filter=${period}`);
      const result = await response.json();
      
      if (result.success && result.data) {
        // DEFENSIVE MAPPING: Ensure no NaN values reach the UI
        const sanitizedData: SalesData = {
          currentPeriod: result.data.currentPeriod || [],
          totalRevenue: Number(result.data.totalRevenue) || 0,
          percentageChange: Number(result.data.percentageChange) || 0,
          isPositive: !!result.data.isPositive,
        };
        cache.current[period] = sanitizedData;
        setData(sanitizedData);
      }
    } catch (error) {
      console.error('Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxValue = useMemo(() => {
    if (!data || data.currentPeriod.length === 0) return 100;
    const allValues = [
      ...data.currentPeriod.map((d) => d.value),
    ];
    const max = Math.max(...allValues);
    // Round up to nice number
    const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
    return Math.ceil(max / magnitude) * magnitude;
  }, [data]);

  const yAxisLabels = useMemo(() => getYAxisLabels(maxValue), [maxValue]);

  if (loading || !data) return <ActivityIndicator style={{ flex: 1 }} />;

return (
  <View className="flex-1 bg-card dark:bg-foreground rounded-2xl p-4">
    {/* Header */}
    <View className="flex-row justify-between items-start mb-2">
      <View>
        <Text className="text-gray-500 text-sm font-medium">Total Revenue</Text>
        <View className="flex-row items-center gap-2 mt-1">
          <Text className="text-2xl font-bold text-gray-900">
            {formatCurrency(data.totalRevenue)}
          </Text>
          <View
            className={`flex-row items-center px-2 py-0.5 rounded-full ${
              data.isPositive ? 'bg-emerald-100' : 'bg-red-100'
            }`}
          >
            {data.isPositive ? (
              <TrendUpIcon size={14} color="#10b981" weight="bold" />
            ) : (
              <TrendDownIcon size={14} color="#ef4444" weight="bold" />
            )}
            <Text
              className={`text-xs font-semibold ml-1 ${
                data.isPositive ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {data.percentageChange}%
            </Text>
          </View>
        </View>
        <Text className="text-gray-400 text-xs mt-0.5">
          {data.isPositive ? 'more' : 'less'} than previous period
        </Text>
      </View>

      {/* Period Selector */}
      <View className="flex-row bg-gray-100 rounded-lg p-1">
        {periods.map((period) => (
          <Pressable
            key={period.key}
            onPress={() => setActivePeriod(period.key)}
            className={`px-3 py-1.5 rounded-md ${
              activePeriod === period.key ? 'bg-white shadow-sm' : ''
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                activePeriod === period.key ? 'text-gray-900' : 'text-gray-500'
              }`}
            >
              {period.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>

    {/* Legend */}
    <View className="flex-row justify-end gap-4 mb-2">
      <View className="flex-row items-center gap-1.5">
        <View className="w-3 h-3 rounded-sm bg-blue-500" />
        <Text className="text-xs text-gray-600">Revenue Trend</Text>
      </View>
    </View>

    {/* Chart */}
    <View className="flex-1 justify-center" style={{ paddingBottom: 8 }}>
      <LineChart
        data={data.currentPeriod}
        width={CHART_WIDTH}
        height={160}
        areaChart
        curved
        curveType={1}  // Less aggressive curve to prevent dipping below axis
        hideDataPoints
        spacing={CHART_WIDTH / (data.currentPeriod.length - 1)}
        initialSpacing={15}  
        endSpacing={15}      
        color1="#3b82f6"
        startFillColor1="rgba(59, 130, 246, 0.4)"
        endFillColor1="rgba(59, 130, 246, 0.05)"
        startOpacity1={0.6}
        endOpacity1={0.1}
        thickness={2.5}
        yAxisColor="transparent"
        yAxisOffset={0}
        xAxisColor="#e5e7eb"
        yAxisTextStyle={{ color: '#9ca3af', fontSize: 10 }}
        xAxisLabelTextStyle={{ color: '#9ca3af', fontSize: 9 }}
        noOfSections={4}
        maxValue={maxValue}
        yAxisLabelTexts={yAxisLabels}
        rulesType="dashed"
        rulesColor="#e5e7eb"
        dashWidth={4}
        dashGap={4}
        xAxisLabelsVerticalShift={2}
        xAxisThickness={1}
        adjustToWidth={true}  // Better width handling
        pointerConfig={{
          pointerStripHeight: 140,
          pointerStripColor: '#e5e7eb',
          pointerStripWidth: 1,
          pointerColor: '#3b82f6',
          radius: 5,
          activatePointersOnLongPress: false,
          autoAdjustPointerLabelPosition: true,
          pointerLabelWidth: 100,
          pointerLabelHeight: 40,
          pointerLabelComponent: (
            items: { value: number }[]
          ) => {
            return (
              <View className="bg-gray-900 px-3 py-2 rounded-lg shadow-lg">
                <View className="flex-row items-center gap-1">
                  <View className="w-2 h-2 rounded-full bg-blue-500" />
                  <Text className="text-white text-xs font-semibold">
                    {formatCurrency(items[0]?.value || 0)}
                  </Text>
                </View>
              </View>
            );
          },
        }}
      />
    </View>
  </View>
);
};

export default SalesChart;
