import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import SalesChart from '@/components/chart';
import { bentoData, getIconComponent } from '@/constants/bentoData';
import { PeriodType } from '@/constants/chartData';
import { makeAuthenticatedRequest } from '@/lib/authenticatedRequest';

const BentoCard = ({
  data,
  fullWidth = false,
}: {
  data: (typeof bentoData)[0];
  fullWidth?: boolean;
}) => {
  const IconComponent = getIconComponent(data.icon);
  const [activePeriod, setActivePeriod] = useState<PeriodType>('monthly');
  const [loading, setLoading] = useState<boolean>(false);
  const [genData, setGenData] = useState<typeof bentoData | null>(null);
  const cache = useRef<Partial<Record<PeriodType, typeof bentoData>>>({});

  useEffect(() => {
    // Use cached data if available for instant tab switching
    if (cache.current[activePeriod]) {
      setGenData(cache.current[activePeriod]);
      return;
    }
    fetchBentoData(activePeriod);
  }, [activePeriod]);

  const fetchBentoData = async (period: PeriodType) => {
    try {
      setLoading(true);
      const resultGen = await makeAuthenticatedRequest(`/analytics/general?filter=${period}`);
      const resultSales = await makeAuthenticatedRequest(`/analytics/sales?filter=${period}`);
      if (resultGen.success && resultGen.data && resultSales.success && resultSales.data) {
        const sanitizedData: typeof bentoData = [
          {
            id: 'most-selling',
            title: 'Most Selling',
            value: resultGen.data?.topProduct?.name || 'N/A',
            subtitle: `${resultGen.data?.topProduct?.unitsSold || 0} units this ${period}`,
            icon: 'package',
            accentColor: '#22c55e', // green
          },
          {
            id: 'worst-selling',
            title: 'Worst Selling',
            value: resultGen.data?.lowProduct?.name || 'N/A',
            subtitle: `${resultGen.data?.lowProduct?.unitsSold || 0} units this ${period}`,
            icon: 'warning',
            accentColor: '#f97316', // orange
          },
          {
            id: 'total-sales',
            title: 'Total Sales',
            value: formatINR(resultSales.data?.totalRevenue),
            subtitle: `This ${period}`,
            icon: 'currency',
            accentColor: '#3b82f6', // blue
          },
        ];
        cache.current[period] = sanitizedData;
        setGenData(sanitizedData);
      }
    } catch (error) {
      console.error('Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !cache.current[activePeriod] && !genData) {
    return (
      <View
        className={`bg-card border-border h-52 ${fullWidth ? 'w-full' : 'w-[48%]'} items-center justify-center rounded-2xl border p-4`}>
        <ActivityIndicator size="small" color={data.accentColor} />
        <Text className="text-muted-foreground mt-2 text-xs">Loading</Text>
      </View>
    );
  }

  return (
    <View
      className={`bg-card border-border h-42 ${fullWidth ? 'w-full' : 'w-[48%]'} justify-between rounded-2xl border p-4`}>
      {/* Icon */}
      <View
        className="h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${data.accentColor}20` }}>
        <IconComponent size={22} color={data.accentColor} weight="fill" />
      </View>

      {/* Content */}
      <View className="flex-1 justify-end">
        <Text className="text-muted-foreground mb-1 text-xs font-medium">{data.title}</Text>
        <Text
          className="text-card-foreground mb-1 font-bold"
          style={{ fontSize: data.value.length > 12 ? 14 : 18 }}
          numberOfLines={1}>
          {genData?.find((item) => item.id === data.id)?.value ?? data.value}
        </Text>

        {/* Subtitle */}
        <View className="flex-row items-center justify-between">
          <Text className="text-muted-foreground text-xs" numberOfLines={1}>
            {genData?.find((item) => item.id === data.id)?.subtitle ?? data.subtitle}
          </Text>
        </View>
      </View>
    </View>
  );
};

const formatINR = (value: unknown) => {
  const n = Number(value);
  if (!isFinite(n)) return 'N/A';
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)}`;
};

const Dashboard = () => {
  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerStyle={{ alignItems: 'center', paddingTop: 16, paddingBottom: 116 }}>
      <View className="h-80 w-[92%] overflow-hidden rounded-2xl shadow-md">
        <SalesChart />
      </View>

      <View className="mt-4 w-[92%] flex-row justify-between">
        <BentoCard data={bentoData[0]} />
        <BentoCard data={bentoData[1]} />
      </View>
    </ScrollView>
  );
};

export default Dashboard;
