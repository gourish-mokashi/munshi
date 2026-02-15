import { ScrollView, View, Text, ActivityIndicator } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import SalesChart from '@/components/chart';
import { bentoData, getIconComponent } from '@/constants/bentoData';
import { TrendUpIcon, TrendDownIcon } from 'phosphor-react-native';
import { PeriodType } from '@/constants/chartData';
import { makeAuthenticatedRequest } from '@/lib/authenticatedRequest';

const BentoCard = ({ data }: { data: typeof bentoData[0] }) => {
  const IconComponent = getIconComponent(data.icon);
  const [activePeriod, setActivePeriod] = useState<PeriodType>('monthly');
  const [loading, setLoading] = useState<boolean>(false);
  const [genData, setGenData] = useState<typeof bentoData | null>(null)
  const cache = useRef<Partial<Record<PeriodType, typeof bentoData>>>({});


  useEffect(() => {
    // Use cached data if available for instant tab switching
    if (cache.current[activePeriod]) {
      setGenData(cache.current[activePeriod]);
      return;
    }
    fetchBentoData(activePeriod);
  },[activePeriod])


  const fetchBentoData = async (period: PeriodType) => {
    try {
      setLoading(true);
      const resultGen  = await makeAuthenticatedRequest(`/analytics/general?filter=${period}`);
      const resultSales  = await makeAuthenticatedRequest(`/analytics/sales?filter=${period}`);
      if (resultGen.success && resultGen.data && resultSales.success && resultSales.data) {
        const sanitizedData : typeof bentoData = [
  {
    id: 'most-selling',
    title: 'Most Selling',
    value: resultGen.data?.topProduct?.name || 'N/A',
    subtitle: `${resultGen.data?.topProduct?.unitsSold || 0} units this ${period}`,
    trend: {
      value: 18.5,
      isPositive: true,
    },
    icon: 'package',
    accentColor: '#22c55e', // green
  },
  {
    id: 'worst-selling',
    title: 'Worst Selling',
    value: resultGen.data?.lowProduct?.name || 'N/A',
    subtitle: `${resultGen.data?.lowProduct?.unitsSold || 0} units this ${period}`,
    trend: {
      value: -24.3,
      isPositive: false,
    },
    icon: 'warning',
    accentColor: '#f97316', // orange
  },
  {
    id: 'total-sales',
    title: 'Total Sales',
    value: formatINR(resultSales.data?.totalRevenue),
    subtitle: `This ${period}`,
    trend: {
      value: 12.4,
      isPositive: true,
    },
    icon: 'currency',
    accentColor: '#3b82f6', // blue
  },
  {
    id: 'total-udhar',
    title: 'Total Credit',
    value: '₹87,250',
    subtitle: `23 customers this ${period}`,
    trend: {
      value: 5.2,
      isPositive: false,
    },
    icon: 'cart',
    accentColor: '#a855f7', // purple
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
      <View className='w-[48%] h-52 rounded-2xl bg-card border border-border p-4 items-center justify-center'>
        <ActivityIndicator size="small" color={data.accentColor} />
        <Text className='text-muted-foreground text-xs mt-2'>Loading</Text>
      </View>
    );
  }

  return (
    <View className='w-[48%] h-52 rounded-2xl bg-card border border-border p-4 justify-between'>
      {/* Icon */}
      <View 
        className='w-10 h-10 rounded-xl items-center justify-center'
        style={{ backgroundColor: `${data.accentColor}20` }}
      >
        <IconComponent size={22} color={data.accentColor} weight="fill" />
      </View>
      
      {/* Content */}
      <View className='flex-1 justify-end'>
        <Text className='text-muted-foreground text-xs font-medium mb-1'>{data.title}</Text>
        <Text 
          className='text-card-foreground font-bold mb-1'
          style={{ fontSize: data.value.length > 12 ? 14 : 18 }}
          numberOfLines={1}
        >
          {genData?.find(item => item.id === data.id)?.value ?? data.value}
        </Text>
        
        {/* Subtitle + Trend */}
        <View className='flex-row items-center justify-between'>
          <Text className='text-muted-foreground text-xs' numberOfLines={1}>
            {genData?.find(item => item.id === data.id)?.subtitle ?? data.subtitle}
          </Text>
          {data.trend && (
            <View className='flex-row items-center gap-0.5'>
              {data.trend.isPositive ? (
                <TrendUpIcon size={12} color="#22c55e" weight="bold" />
              ) : (
                <TrendDownIcon size={12} color="#ef4444" weight="bold" />
              )}
              <Text 
                className={`text-xs font-semibold ${
                  data.trend.isPositive ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {data.trend.value}%
              </Text>
            </View>
          )}
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
      className='bg-background flex-1'
      contentContainerStyle={{ alignItems: 'center', paddingTop: 16, paddingBottom: 116 }}
    >
      <View className='w-[92%] h-80 rounded-2xl overflow-hidden shadow-md'>
        <SalesChart />
      </View>

      <View className='flex-row w-[92%] justify-between mt-4'>
        <BentoCard data={bentoData[0]} />
        <BentoCard data={bentoData[1]} />
      </View>

      <View className='flex-row w-[92%] justify-between mt-4'>
        <BentoCard data={bentoData[2]} />
        <BentoCard data={bentoData[3]} />
      </View>
    </ScrollView>
  );
};

export default Dashboard;
