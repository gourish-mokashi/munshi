import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, Pressable, Dimensions, ScaledSize } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { ActivityIndicator } from 'react-native';
import { SalesData, PeriodType, formatCurrency, getYAxisLabels } from '@/constants/chartData';
import { TrendUpIcon, TrendDownIcon } from 'phosphor-react-native';
import { makeAuthenticatedRequest } from '@/lib/authenticatedRequest';

const periods: { key: PeriodType; label: string }[] = [
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

const useScreenDimensions = () => {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));

  useEffect(() => {
    const handler = ({ window }: { window: ScaledSize }) => {
      setDimensions(window);
    };
    const subscription = Dimensions.addEventListener('change', handler);
    return () => subscription.remove();
  }, []);

  return dimensions;
};

const SalesChart = () => {
  const { width: screenWidth } = useScreenDimensions();
  const [activePeriod, setActivePeriod] = useState<PeriodType>('monthly');
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<SalesData | null>(null);
  const cache = React.useRef<Partial<Record<PeriodType, SalesData>>>({});

  // Responsive calculations
  const chartWidth = useMemo(() => screenWidth * 0.88- 40, [screenWidth]);
  const chartHeight = useMemo(() => Math.max(120, Math.min(200, screenWidth * 0.4)), [screenWidth]);
  const isSmallScreen = screenWidth < 380;

  useEffect(() => {
    if (cache.current[activePeriod]) {
      setData(cache.current[activePeriod]);
      return;
    }
    fetchChartData(activePeriod);
  }, [activePeriod]);

  const fetchChartData = async (period: PeriodType) => {
    try {
      setLoading(true);
      const result = await makeAuthenticatedRequest("/analytics/sales?filter=" + period);

      if (result.success && result.data) {
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
    const allValues = [...data.currentPeriod.map((d) => d.value)];
    const max = Math.max(...allValues);
    const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
    return Math.ceil(max / magnitude) * magnitude;
  }, [data]);

  const yAxisLabels = useMemo(() => getYAxisLabels(maxValue), [maxValue]);

  const spacing = useMemo(() => {
    if (!data || data.currentPeriod.length <= 1) return 40;
    return chartWidth / (data.currentPeriod.length - 1);
  }, [data, chartWidth]);

  if (loading || !data) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View className="bg-card dark:bg-foreground flex-1 rounded-2xl p-4">
      {/* Header Row: Revenue + Period Selector side by side */}
      <View className="mb-1 flex-row items-center justify-between">
        <View>
          <Text className="text-sm font-medium text-gray-500">Total Revenue</Text>
          <View className="mt-1 flex-row items-center gap-2">
            <Text className={`font-bold text-gray-900 ${isSmallScreen ? 'text-xl' : 'text-2xl'}`}>
              {formatCurrency(data.totalRevenue)}
            </Text>
            <View
              className={`flex-row items-center rounded-full px-2 py-0.5 ${
                data.isPositive ? 'bg-emerald-100' : 'bg-red-100'
              }`}>
              {data.isPositive ? (
                <TrendUpIcon size={14} color="#10b981" weight="bold" />
              ) : (
                <TrendDownIcon size={14} color="#ef4444" weight="bold" />
              )}
              <Text
                className={`ml-1 text-xs font-semibold ${
                  data.isPositive ? 'text-emerald-600' : 'text-red-600'
                }`}>
                {data.percentageChange}%
              </Text>
            </View>
          </View>
        </View>

        {/* Period Selector */}
        <View className="flex-row rounded-lg bg-gray-100 p-1">
          {periods.map((period) => (
            <Pressable
              key={period.key}
              onPress={() => setActivePeriod(period.key)}
              className={`rounded-md px-3 py-1.5 ${
                activePeriod === period.key ? 'bg-white shadow-sm' : ''
              }`}>
              <Text
                className={`text-xs font-medium ${
                  activePeriod === period.key ? 'text-gray-900' : 'text-gray-500'
                }`}>
                {isSmallScreen ? period.label.charAt(0) : period.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Subtitle */}
      <Text className="mb-2 text-xs text-gray-400">
        {data.isPositive ? 'more' : 'less'} than previous period
      </Text>

      {/* Legend */}
      <View className="mb-2 flex-row justify-end gap-8">
        <View className="flex-row items-center gap-1.5">
          <View className="h-3 w-3 rounded-sm bg-blue-500" />
          <Text className="text-xs text-gray-600">Revenue Trend</Text>
        </View>
      </View>

      {/* Chart - shifted left */}
      <View className="flex-1 justify-center" style={{ paddingBottom: 1, marginLeft: -19 }}>
        <LineChart
          key={`chart-${screenWidth}`}
          data={data.currentPeriod}
          width={chartWidth}
          height={chartHeight}
          areaChart
          curved
          curveType={1}
          hideDataPoints
          spacing={spacing}
          initialSpacing={8}
          endSpacing={10}
          color1="#3b82f6"
          startFillColor1="rgba(59, 130, 246, 0.4)"
          endFillColor1="rgba(59, 130, 246, 0.05)"
          startOpacity1={0.6}
          endOpacity1={0.1}
          thickness={2.5}
          yAxisColor="transparent"
          yAxisOffset={0}
          xAxisColor="#e5e7eb"
          yAxisTextStyle={{ color: '#9ca3af', fontSize: isSmallScreen ? 8 : 10 }}
          xAxisLabelTextStyle={{ color: '#9ca3af', fontSize: isSmallScreen ? 7 : 9 }}
          noOfSections={4}
          maxValue={maxValue}
          yAxisLabelTexts={yAxisLabels}
          rulesType="dashed"
          rulesColor="#e5e7eb"
          dashWidth={4}
          dashGap={4}
          xAxisLabelsVerticalShift={2}
          xAxisThickness={1}
          adjustToWidth={true}
          pointerConfig={{
            pointerStripHeight: chartHeight - 20,
            pointerStripColor: '#e5e7eb',
            pointerStripWidth: 1,
            pointerColor: '#3b82f6',
            radius: 5,
            activatePointersOnLongPress: false,
            autoAdjustPointerLabelPosition: true,
            pointerLabelWidth: 100,
            pointerLabelHeight: 40,
            pointerLabelComponent: (items: { value: number }[]) => {
              return (
                <View className="rounded-lg bg-gray-900 px-3 py-2 shadow-lg">
                  <View className="flex-row items-center gap-1">
                    <View className="h-2 w-2 rounded-full bg-blue-500" />
                    <Text className="text-xs font-semibold text-white">
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
