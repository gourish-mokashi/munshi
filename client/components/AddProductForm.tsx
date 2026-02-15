import { View, Text, Alert, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Package, CurrencyInr, CalendarBlank, Tag, Check } from 'phosphor-react-native';
import { makeAuthenticatedRequest } from '@/lib/authenticatedRequest';

interface AddProductFormProps {
  onSuccess?: () => void;
}

const AddProductForm = ({ onSuccess }: AddProductFormProps) => {
  const [name, setName] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [stock, setStock] = useState<number | null>(null);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const handleDateChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`;
    }
    if (digits.length > 6) {
      formatted = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
    }
    setExpiryDate(formatted);
  };

  const isFormValid =
    name.trim().length > 0 &&
    Number(purchasePrice) > 0 &&
    Number(sellingPrice) > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(expiryDate);

  const resetForm = () => {
    setName('');
    setPurchasePrice('');
    setSellingPrice('');
    setStock(null);
    setExpiryDate('');
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;

    try {
      setSubmitting(true);
      const result = await makeAuthenticatedRequest('/products/add/', {
        name,
        purchasePrice: Number(purchasePrice),
        sellingPrice: Number(sellingPrice),
        expiryDate,
      });

      if (result.success) {
        
        try{
          const stockRes = await makeAuthenticatedRequest('/stock/update/', {
            productId: result.data.productId,
            quantity: stock || 0,
          });
          if(!stockRes.ok){
            console.error('Stock Update Failed:', await stockRes.text());
          }
        } catch (error) {
          console.error('Stock Update Error:', error
          )
        }
        setSuccess(true);
        resetForm();
        onSuccess?.();
        setTimeout(() => setSuccess(false), 2000);
      } else {
        Alert.alert('Error', result.error || 'Failed to add product');
      }
    } catch (error) {
      console.error('Submit Error:', error);
      Alert.alert('Error', 'Could not connect to the server');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="w-full rounded-2xl bg-card border border-border p-5">
      {/* Product Name */}
      <View className="mb-5">
        <View className="flex-row items-center gap-2 mb-2">
          <Package size={16} color="#9ca3af" weight="bold" />
          <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            Product Name
          </Text>
        </View>
        <Input
          value={name}
          onChangeText={setName}
          placeholder="e.g. Nestle Maggie"
          placeholderTextColor="#4b5563"
          className="bg-secondary border-border text-foreground"
        />
      </View>

      {/* Stock Quantity */}
      <View className="mb-5">
        <View className="flex-row items-center gap-2 mb-2">
          <Tag size={16} color="#9ca3af" weight="bold" />
          <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            Stock Quantity
          </Text>
        </View>
        <Input
          value={stock?.toString() || ''}
          onChangeText={(text) => setStock(Number(text.replace(/\D/g, '')))}
          placeholder="e.g. 100"
          keyboardType="number-pad"
          placeholderTextColor="#4b5563"
          className="bg-secondary border-border text-foreground"
        />
      </View>

      {/* Price Row */}
      <View className="flex-row gap-3 mb-5">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-2">
            <Tag size={16} color="#9ca3af" weight="bold" />
            <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Cost Price
            </Text>
          </View>
          <Input
            value={purchasePrice}
            onChangeText={setPurchasePrice}
            placeholder="₹ 0.00"
            keyboardType="decimal-pad"
            placeholderTextColor="#4b5563"
            className="bg-secondary border-border text-foreground"
          />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-2">
            <CurrencyInr size={16} color="#9ca3af" weight="bold" />
            <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Sell Price
            </Text>
          </View>
          <Input
            value={sellingPrice}
            onChangeText={setSellingPrice}
            placeholder="₹ 0.00"
            keyboardType="decimal-pad"
            placeholderTextColor="#4b5563"
            className="bg-secondary border-border text-foreground"
          />
        </View>
      </View>

      {/* Expiry Date */}
      <View className="mb-6">
        <View className="flex-row items-center gap-2 mb-2">
          <CalendarBlank size={16} color="#9ca3af" weight="bold" />
          <Text className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            Expiry Date
          </Text>
        </View>
        <Input
          value={expiryDate}
          onChangeText={handleDateChange}
          placeholder="YYYY-MM-DD"
          keyboardType="number-pad"
          maxLength={10}
          placeholderTextColor="#4b5563"
          className="bg-secondary border-border text-foreground"
        />
        <Text className="text-muted-foreground text-xs mt-1.5 ml-0.5">
          Type numbers only — dashes are added automatically
        </Text>
      </View>

      {/* Margin Preview */}
      {Number(purchasePrice) > 0 && Number(sellingPrice) > 0 && (
        <View className="bg-secondary rounded-xl p-3 mb-5 flex-row justify-between">
          <Text className="text-muted-foreground text-xs">Profit Margin</Text>
          <Text
            className={`text-xs font-semibold ${
              Number(sellingPrice) > Number(purchasePrice)
                ? 'text-emerald-400'
                : 'text-red-400'
            }`}
          >
            ₹{(Number(sellingPrice) - Number(purchasePrice)).toFixed(2)} per unit (
            {(
              ((Number(sellingPrice) - Number(purchasePrice)) / Number(purchasePrice)) *
              100
            ).toFixed(1)}
            %)
          </Text>
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
            <Text className="text-green-600 font-semibold text-sm">Product Added!</Text>
          </View>
        ) : (
          <Text
            className={`font-semibold text-sm ${isFormValid ? 'text-background' : 'text-muted-foreground'}`}
          >
            Add Product
          </Text>
        )}
      </Button>
    </View>
  );
};

export default AddProductForm;
