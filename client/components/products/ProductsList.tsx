import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl, useColorScheme } from 'react-native';
import ProductCard, { type ProductCardData } from '@/components/products/ProductCard';
import FilterPills, { type FilterOption } from '@/components/products/FilterPills';
import SearchBar from '@/components/products/SearchBar';
import { THEME } from '@/lib/theme';

const FILTERS: FilterOption[] = [
  { key: 'all', label: 'All' },
  { key: 'in-stock', label: 'In Stock' },
  { key: 'low-stock', label: 'Low Stock' },
  { key: 'out-of-stock', label: 'Out of Stock' },
  { key: 'expired', label: 'Expired' },
];

interface ProductsListProps {
  products: ProductCardData[];
  loading: boolean;
  onRefresh: () => void;
}

const ProductsList = ({ products, loading, onRefresh }: ProductsListProps) => {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = THEME[colorScheme];
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const filteredProducts = useMemo(() => {
    const now = new Date();
    let result = products;

    // Apply search filter
    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(query));
    }

    // Apply category filter
    switch (activeFilter) {
      case 'in-stock':
        result = result.filter((p) => p.currentStock > 10);
        break;
      case 'low-stock':
        result = result.filter((p) => p.currentStock > 0 && p.currentStock <= 10);
        break;
      case 'out-of-stock':
        result = result.filter((p) => p.currentStock === 0);
        break;
      case 'expired':
        result = result.filter((p) => new Date(p.expiryDate) <= now);
        break;
    }

    return result;
  }, [products, search, activeFilter]);

  if (loading && products.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator size="large" color={theme.foreground} />
        <Text className="text-muted-foreground text-sm mt-3">Loading products…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Search */}
      <View className="px-[4%] mb-3">
        <SearchBar value={search} onChangeText={setSearch} />
      </View>

      {/* Filters */}
      <View className="px-[4%] mb-4">
        <FilterPills
          filters={FILTERS}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </View>

      {/* Count */}
      <View className="px-[4%] mb-2 flex-row items-center justify-between">
        <Text className="text-muted-foreground text-xs font-medium">
          {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Product list */}
      <ScrollView
        className="flex-1 px-[4%]"
        contentContainerStyle={{ paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredProducts.length === 0 ? (
          <View className="items-center justify-center py-16">
            <Text className="text-muted-foreground text-sm">No products found</Text>
          </View>
        ) : (
          filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default ProductsList;
