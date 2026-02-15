import React from 'react';
import {
  View,
  Text,
  Pressable,
  useColorScheme,
  StyleSheet,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  ChartLineUpIcon,
  BarcodeIcon,
  UserIcon,
  StorefrontIcon,
} from 'phosphor-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '@/lib/theme';
import AnimatedAvatar from '@/components/AnimatedAvatar';

// ─── Tab configuration ───────────────────────────────────────────────
const TAB_CONFIG: Record<
  string,
  { icon: React.ComponentType<any>; label: string }
> = {
  Dashboard: { icon: ChartLineUpIcon, label: 'Dashboard' },
  Stock: { icon: BarcodeIcon, label: 'Add' },
  Products: { icon: StorefrontIcon, label: 'Products' },
  Profile: { icon: UserIcon, label: 'Profile' },
};

// ─── Layout constants ────────────────────────────────────────────────
const BAR_HEIGHT = 64;
const OUTER_RING_SIZE = 72;
const INNER_CIRCLE_SIZE = 58;
const ELEVATION = OUTER_RING_SIZE / 2;

interface CustomTabBarProps extends BottomTabBarProps {
  onAIPress: () => void;
}

// ─── Component ───────────────────────────────────────────────────────
export default function CustomTabBar({
  state,
  navigation,
  onAIPress,
}: CustomTabBarProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = THEME[colorScheme];
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';

  const activeColor = theme.foreground;
  const inactiveColor = theme.mutedForeground;
  const barBg = isDark ? '#0f0f0f' : '#f7f7f7';
  const cutoutBg = theme.background;
  const borderClr = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
  const totalHeight = BAR_HEIGHT + ELEVATION + insets.bottom;

  const handleTabPress = (
    routeKey: string,
    routeName: string,
    isFocused: boolean,
  ) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: routeKey,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  // Build the visual order: [route0, route1, AI_SPACER, route2, route3]
  // Routes: Dashboard(0), Stock(1), Products(2), Profile(3)
  // Visual: Dashboard, Add, AI(virtual), Products, Profile
  const visualSlots: (
    | { type: 'route'; routeIndex: number }
    | { type: 'ai' }
  )[] = [
    { type: 'route', routeIndex: 0 }, // Dashboard
    { type: 'route', routeIndex: 1 }, // Stock / Add
    { type: 'ai' },                   // AI avatar (virtual)
    { type: 'route', routeIndex: 2 }, // Products
    { type: 'route', routeIndex: 3 }, // Profile
  ];

  return (
    <View
      style={[styles.wrapper, { height: totalHeight }]}
      pointerEvents="box-none"
    >
      {/* ── 1. Tab-bar background panel ── */}
      <View
        style={[
          styles.barPanel,
          {
            height: BAR_HEIGHT + insets.bottom,
            backgroundColor: barBg,
            borderColor: borderClr,
          },
        ]}
        pointerEvents="none"
      />

      {/* ── 2. Tab row ── */}
      <View
        style={[
          styles.sideTabsRow,
          { bottom: insets.bottom, height: BAR_HEIGHT },
        ]}
      >
        {visualSlots.map((slot, i) => {
          if (slot.type === 'ai') {
            return <View key="ai-spacer" style={styles.spacer} />;
          }

          const route = state.routes[slot.routeIndex];
          if (!route) return null;
          const focused = state.index === slot.routeIndex;
          const cfg = TAB_CONFIG[route.name];
          if (!cfg) return null;
          const { icon: Icon, label } = cfg;

          return (
            <Pressable
              key={route.key}
              onPress={() => handleTabPress(route.key, route.name, focused)}
              style={({ pressed }) => [
                styles.sideTab,
                pressed && styles.pressed,
              ]}
            >
              <Icon
                size={24}
                color={focused ? activeColor : inactiveColor}
                weight={focused ? 'fill' : 'regular'}
              />
              <Text
                style={[
                  styles.sideLabel,
                  {
                    color: focused ? activeColor : inactiveColor,
                    fontWeight: focused ? '600' : '400',
                  },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── 3. Elevated AI avatar button (center) ── */}
      <View
        style={[
          styles.middleContainer,
          { bottom: insets.bottom, height: BAR_HEIGHT + ELEVATION },
        ]}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={onAIPress}
          style={({ pressed }) => [
            styles.middleButton,
            pressed && styles.pressed,
          ]}
        >
          <View style={[styles.outerRing, { backgroundColor: cutoutBg }]}>
            <View style={styles.innerCircle}>
              <AnimatedAvatar size={INNER_CIRCLE_SIZE} />
            </View>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  barPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  sideTabsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sideTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  sideLabel: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  spacer: {
    flex: 1,
  },
  middleContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  middleButton: {
    alignItems: 'center',
  },
  outerRing: {
    width: OUTER_RING_SIZE,
    height: OUTER_RING_SIZE,
    borderRadius: OUTER_RING_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: INNER_CIRCLE_SIZE,
    height: INNER_CIRCLE_SIZE,
    borderRadius: INNER_CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.7,
  },
});
