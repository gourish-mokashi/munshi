import { View, Text, useColorScheme } from 'react-native';
import React from 'react';
import { Package, TrendUp, TrendDown, Warning } from 'phosphor-react-native';
import { THEME } from '@/lib/theme';

export interface ProductCardData {
  id: string;
  name: string;
  purchasePrice: number;
  sellingPrice: number;
  expiryDate: string;
  currentStock: number;
}

interface ProductCardProps {
  product: ProductCardData;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = THEME[colorScheme];

  const margin = product.sellingPrice - product.purchasePrice;
  const marginPercent =
    product.purchasePrice > 0
      ? ((margin / product.purchasePrice) * 100).toFixed(1)
      : '0.0';
  const isProfit = margin >= 0;

  const expiryDate = new Date(product.expiryDate);
  const now = new Date();
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  const isExpired = daysUntilExpiry <= 0;
  const isExpiringSoon = daysUntilExpiry > 0 && daysUntilExpiry <= 30;

  const isLowStock = product.currentStock > 0 && product.currentStock <= 10;
  const isOutOfStock = product.currentStock === 0;

  const formatCurrency = (value: number) =>
    `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)}`;

  const getStockColor = () => {
    if (isOutOfStock) return '#ef4444';
    if (isLowStock) return '#f97316';
    return '#22c55e';
  };

  const getStockLabel = () => {
    if (isOutOfStock) return 'Out of Stock';
    if (isLowStock) return 'Low Stock';
    return 'In Stock';
  };

  const getExpiryLabel = () => {
    if (isExpired) return 'Expired';
    if (isExpiringSoon) return `${daysUntilExpiry}d left`;
    return expiryDate.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <View className="w-full rounded-2xl bg-card border border-border p-4 mb-3">
      {/* Top row: name + stock badge */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-row items-center gap-2.5 flex-1 mr-3">
          <View
            className="w-9 h-9 rounded-xl items-center justify-center"
            style={{ backgroundColor: `${getStockColor()}15` }}
          >
            <Package size={18} color={getStockColor()} weight="fill" />
          </View>
          <View className="flex-1">
            <Text
              className="text-card-foreground font-semibold text-[15px]"
              numberOfLines={1}
            >
              {product.name}
            </Text>
            <Text className="text-muted-foreground text-xs mt-0.5">
              {product.currentStock} units
            </Text>
          </View>
        </View>

        {/* Stock badge */}
        <View
          className="rounded-full px-2.5 py-1"
          style={{ backgroundColor: `${getStockColor()}15` }}
        >
          <Text
            className="text-xs font-semibold"
            style={{ color: getStockColor() }}
          >
            {getStockLabel()}
          </Text>
        </View>
      </View>

      {/* Price row */}
      <View className="flex-row items-center justify-between mb-2.5">
        <View className="flex-row items-center gap-4">
          <View>
            <Text className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">
              Cost
            </Text>
            <Text className="text-card-foreground font-semibold text-sm">
              {formatCurrency(product.purchasePrice)}
            </Text>
          </View>
          <View>
            <Text className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">
              Sell
            </Text>
            <Text className="text-card-foreground font-semibold text-sm">
              {formatCurrency(product.sellingPrice)}
            </Text>
          </View>
        </View>

        {/* Margin */}
        <View className="flex-row items-center gap-1">
          {isProfit ? (
            <TrendUp size={14} color="#22c55e" weight="bold" />
          ) : (
            <TrendDown size={14} color="#ef4444" weight="bold" />
          )}
          <Text
            className="text-xs font-semibold"
            style={{ color: isProfit ? '#22c55e' : '#ef4444' }}
          >
            {marginPercent}%
          </Text>
        </View>
      </View>

      {/* Expiry row */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          {(isExpired || isExpiringSoon) && (
            <Warning
              size={12}
              color={isExpired ? '#ef4444' : '#f97316'}
              weight="bold"
            />
          )}
          <Text
            className="text-xs"
            style={{
              color: isExpired
                ? '#ef4444'
                : isExpiringSoon
                  ? '#f97316'
                  : theme.mutedForeground,
            }}
          >
            Exp: {getExpiryLabel()}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default ProductCard;
