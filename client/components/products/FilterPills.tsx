import React from 'react';
import { View, Text, Pressable, useColorScheme, ScrollView } from 'react-native';
import { THEME } from '@/lib/theme';

export interface FilterOption {
  key: string;
  label: string;
}

interface FilterPillsProps {
  filters: FilterOption[];
  activeFilter: string;
  onFilterChange: (key: string) => void;
}

const FilterPills = ({ filters, activeFilter, onFilterChange }: FilterPillsProps) => {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = THEME[colorScheme];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 0, gap: 8 }}
    >
      {filters.map((filter) => {
        const isActive = activeFilter === filter.key;
        return (
          <Pressable
            key={filter.key}
            onPress={() => onFilterChange(filter.key)}
            className={`rounded-xl px-4 py-2 border ${
              isActive
                ? 'bg-foreground border-foreground'
                : 'bg-card border-border'
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                isActive ? 'text-background' : 'text-muted-foreground'
              }`}
            >
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

export default FilterPills;
