import React, { useCallback, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import TopTabBar from '@/components/products/TopTabBar';
import ProductsList from '@/components/products/ProductsList';
import type { ProductCardData } from '@/components/products/ProductCard';
import { makeAuthenticatedRequest } from '@/lib/authenticatedRequest';

const TOP_TABS = [
  { key: 'products', label: 'Products' },
  { key: 'bills', label: 'Bills' },
];

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

const Products = () => {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);

      // Step 1: Fetch stock data (returns productId, quantity, product.name)

      const stockData = await makeAuthenticatedRequest("/stock/"); // Use authenticated request helper

      if (!stockData.success || !stockData.data) {
        setProducts([]);
        return;
      }

      // Step 2: For each product in stock, fetch full product details in parallel
      const productPromises = stockData.data.map(
        async (stockItem: { productId: string; quantity: number; product: { name: string } }) => {
          try {
            const detailData = await makeAuthenticatedRequest(`/products/${stockItem.productId}`);

            if (detailData.success && detailData.data) {
              const p = detailData.data;
              return {
                id: p.id,
                name: p.name,
                purchasePrice: p.purchasePrice,
                sellingPrice: p.sellingPrice,
                expiryDate: p.expiryDate,
                currentStock: stockItem.quantity,
              } as ProductCardData;
            }
          } catch {
            // If individual fetch fails, construct from stock data with defaults
          }
          // Fallback: use stock data name with zero prices
          return {
            id: stockItem.productId,
            name: stockItem.product.name,
            purchasePrice: 0,
            sellingPrice: 0,
            expiryDate: new Date().toISOString(),
            currentStock: stockItem.quantity,
          } as ProductCardData;
        }
      );

      const resolved = await Promise.all(productPromises);
      setProducts(resolved);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <View className="flex-1 bg-background">
      {/* Top Tab Bar */}
      <View className="px-[4%] pt-4 pb-3">
        <TopTabBar tabs={TOP_TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      </View>

      {/* Tab Content */}
      {activeTab === 'products' ? (
        <ProductsList products={products} loading={loading} onRefresh={fetchProducts} />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground text-lg font-medium">Bills</Text>
          <Text className="text-muted-foreground text-sm mt-1">Coming soon</Text>
        </View>
      )}
    </View>
  );
};

export default Products;
