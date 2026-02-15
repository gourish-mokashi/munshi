import { TrendUp, TrendDown, CurrencyInr, Package, Warning, ShoppingCart } from 'phosphor-react-native';

export interface BentoCardData {
  id: string;
  title: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon: 'package' | 'warning' | 'currency' | 'cart';
  accentColor: string;
}

export const bentoData: BentoCardData[] = [
  {
    id: 'most-selling',
    title: 'Most Selling',
    value: 'Amul Butter 500g',
    subtitle: '342 units this month',
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
    value: 'Organic Honey 1kg',
    subtitle: '12 units this month',
    trend: {
      value: 24.3,
      isPositive: false,
    },
    icon: 'warning',
    accentColor: '#f97316', // orange
  },
  {
    id: 'total-sales',
    title: 'Total Sales',
    value: '₹4,05,500',
    subtitle: 'This month',
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
    subtitle: '23 customers',
    trend: {
      value: 5.2,
      isPositive: false,
    },
    icon: 'cart',
    accentColor: '#a855f7', // purple
  },
];

export const getIconComponent = (iconName: BentoCardData['icon']) => {
  switch (iconName) {
    case 'package':
      return Package;
    case 'warning':
      return Warning;
    case 'currency':
      return CurrencyInr;
    case 'cart':
      return ShoppingCart;
    default:
      return Package;
  }
};
