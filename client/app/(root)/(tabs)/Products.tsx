import React, { useCallback, useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import ProductsList from '@/components/products/ProductsList';
import type { ProductCardData } from '@/components/products/ProductCard';
import { makeAuthenticatedRequest } from '@/lib/authenticatedRequest';

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL;

const Products = () => {
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);

      const stockData = await makeAuthenticatedRequest('/stock/');

      if (!stockData.success || !stockData.data) {
        setProducts([]);
        return;
      }

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
    <View className="bg-background flex-1">
      <ProductsList products={products} loading={loading} onRefresh={fetchProducts} />
    </View>
  );
};

export default Products;
