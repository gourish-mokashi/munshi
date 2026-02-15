import React from 'react';
import { View, useColorScheme } from 'react-native';
import { MagnifyingGlass } from 'phosphor-react-native';
import { Input } from '@/components/ui/input';
import { THEME } from '@/lib/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

const SearchBar = ({ value, onChangeText, placeholder = 'Search products…' }: SearchBarProps) => {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = THEME[colorScheme];

  return (
    <View className="flex-row items-center bg-card border border-border rounded-xl px-3 gap-2">
      <MagnifyingGlass size={18} color={theme.mutedForeground} weight="bold" />
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.mutedForeground}
        className="flex-1 bg-transparent border-0 text-foreground h-11 p-0 shadow-none"
      />
    </View>
  );
};

export default SearchBar;
