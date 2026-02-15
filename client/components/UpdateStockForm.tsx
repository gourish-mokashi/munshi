import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Modal,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Package,
  CaretDown,
  Plus,
  Check,
  MagnifyingGlass,
} from 'phosphor-react-native';

interface Product {
  id: string;
  name: string;
  currentQuantity: number;
}

interface UpdateStockFormProps {
  refreshKey?: number;
}

const UpdateStockForm = ({ refreshKey }: UpdateStockFormProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addQuantity, setAddQuantity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [refreshKey]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/stock/`);
      const result = await res.json();

      if (result.success && result.data) {
        const mapped: Product[] = result.data.map(
          (item: { productId: string; product: { name: string }; quantity: number }) => ({
            id: item.productId,
            name: item.product.name,
            currentQuantity: item.quantity,
          })
        );
        setProducts(mapped);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const isFormValid = selectedProduct !== null && Number(addQuantity) > 0;

  const handleSubmit = async () => {
    if (!isFormValid || !selectedProduct) return;

    const newTotal = selectedProduct.currentQuantity + Number(addQuantity);

    try {
      setSubmitting(true);
      const res = await fetch(`${process.env.EXPO_PUBLIC_BASE_URL}/stock/update/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantity: newTotal,
        }),
      });

      const result = await res.json();

      if (result.success) {
        setSuccess(true);
        // Update local state to reflect new quantity
        setProducts((prev) =>
          prev.map((p) =>
            p.id === selectedProduct.id ? { ...p, currentQuantity: newTotal } : p
          )
        );
        setSelectedProduct((prev) =>
          prev ? { ...prev, currentQuantity: newTotal } : null
        );
        setAddQuantity('');
        setTimeout(() => setSuccess(false), 2000);
      } else {
        Alert.alert('Error', result.error || 'Failed to update stock');
      }
    } catch (error) {
      console.error('Submit Error:', error);
      Alert.alert('Error', 'Could not connect to the server');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="w-full rounded-2xl bg-card border border-border p-5 items-center justify-center h-48">
        <ActivityIndicator size="small" color="#3b82f6" />
        <Text className="text-muted-foreground text-xs mt-2">Loading products…</Text>
      </View>
    );
  }

  return (
    <View className="w-full rounded-2xl bg-card border border-border p-5">
      {/* Product Selector */}
      <View className="mb-5">
        <View className="flex-row items-center gap-2 mb-2">
          <Package size={16} color="#9ca3af" weight="bold" />
          <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            Select Product
          </Text>
        </View>

        <Pressable
          onPress={() => setDropdownOpen(true)}
          className="bg-secondary border border-border rounded-md h-10 px-3 flex-row items-center justify-between"
        >
          <Text
            className={`text-sm ${selectedProduct ? 'text-foreground' : 'text-muted-foreground'}`}
            numberOfLines={1}
          >
            {selectedProduct ? selectedProduct.name : 'Tap to select a product'}
          </Text>
          <CaretDown size={16} color="#6b7280" weight="bold" />
        </Pressable>
      </View>

      {/* Dropdown Modal */}
      <Modal visible={dropdownOpen} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-black/60 justify-center items-center px-6"
          onPress={() => {
            setDropdownOpen(false);
            setSearch('');
          }}
        >
          <Pressable
            className="w-full bg-card border border-border rounded-2xl overflow-hidden max-h-80"
            onPress={() => {}} // prevent closing when tapping inside
          >
            {/* Search */}
            <View className="flex-row items-center gap-2 px-4 py-3 border-b border-border">
              <MagnifyingGlass size={16} color="#6b7280" weight="bold" />
              <Input
                value={search}
                onChangeText={setSearch}
                placeholder="Search products…"
                placeholderTextColor="#4b5563"
                className="flex-1 bg-transparent border-0 text-foreground h-8 p-0 shadow-none"
                autoFocus
              />
            </View>

            {/* Product List */}
            <ScrollView className="max-h-60">
              {filteredProducts.length === 0 ? (
                <View className="p-4 items-center">
                  <Text className="text-muted-foreground text-sm">No products found</Text>
                </View>
              ) : (
                filteredProducts.map((product) => (
                  <Pressable
                    key={product.id}
                    onPress={() => {
                      setSelectedProduct(product);
                      setDropdownOpen(false);
                      setSearch('');
                    }}
                    className={`px-4 py-3 flex-row items-center justify-between border-b border-border ${
                      selectedProduct?.id === product.id ? 'bg-secondary' : ''
                    }`}
                  >
                    <View className="flex-1 mr-3">
                      <Text className="text-foreground text-sm" numberOfLines={1}>
                        {product.name}
                      </Text>
                      <Text className="text-muted-foreground text-xs mt-0.5">
                        Current stock: {product.currentQuantity} units
                      </Text>
                    </View>
                    {selectedProduct?.id === product.id && (
                      <Check size={16} color="#3b82f6" weight="bold" />
                    )}
                  </Pressable>
                ))
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Current Stock Display */}
      {selectedProduct && (
        <View className="bg-secondary rounded-xl p-3 mb-5 flex-row justify-between items-center">
          <Text className="text-muted-foreground text-xs">Current Stock</Text>
          <Text className="text-foreground text-sm font-semibold">
            {selectedProduct.currentQuantity} units
          </Text>
        </View>
      )}

      {/* Add Quantity */}
      <View className="mb-5">
        <View className="flex-row items-center gap-2 mb-2">
          <Plus size={16} color="#9ca3af" weight="bold" />
          <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            Add Quantity
          </Text>
        </View>
        <Input
          value={addQuantity}
          onChangeText={setAddQuantity}
          placeholder="e.g. 24"
          keyboardType="number-pad"
          placeholderTextColor="#4b5563"
          className="bg-secondary border-border text-foreground"
        />
      </View>

      {/* New Total Preview */}
      {selectedProduct && Number(addQuantity) > 0 && (
        <View className="bg-secondary rounded-xl p-3 mb-5 flex-row justify-between items-center">
          <Text className="text-muted-foreground text-xs">New Total Stock</Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-muted-foreground text-xs">
              {selectedProduct.currentQuantity} + {addQuantity} =
            </Text>
            <Text className="text-emerald-400 text-sm font-semibold">
              {selectedProduct.currentQuantity + Number(addQuantity)} units
            </Text>
          </View>
        </View>
      )}

      {/* Submit Button */}
      <Button
        onPress={handleSubmit}
        disabled={!isFormValid || submitting}
        className={`h-12 rounded-xl ${isFormValid ? 'bg-foreground' : 'bg-muted'}`}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#888" />
        ) : success ? (
          <View className="flex-row items-center gap-2">
            <Check size={18} color="#16a34a" weight="bold" />
            <Text className="text-green-600 font-semibold text-sm">Stock Updated!</Text>
          </View>
        ) : (
          <Text
            className={`font-semibold text-sm ${isFormValid ? 'text-background' : 'text-muted-foreground'}`}
          >
            Update Stock
          </Text>
        )}
      </Button>
    </View>
  );
};

export default UpdateStockForm;
