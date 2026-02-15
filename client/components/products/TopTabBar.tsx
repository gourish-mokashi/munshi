import React from 'react';
import { View, Text, Pressable, useColorScheme } from 'react-native';
import { THEME } from '@/lib/theme';

interface TopTabBarProps {
  tabs: { key: string; label: string }[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

const TopTabBar = ({ tabs, activeTab, onTabChange }: TopTabBarProps) => {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = THEME[colorScheme];

  return (
    <View className="flex-row bg-card border border-border rounded-2xl p-1 gap-1">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            className={`flex-1 items-center py-2.5 rounded-xl ${
              isActive ? 'bg-foreground' : ''
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                isActive ? 'text-background' : 'text-muted-foreground'
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default TopTabBar;
