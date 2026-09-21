import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { Clock, CheckCircle2, XCircle } from 'lucide-react-native';

export type BookingTab = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

interface BookingFilterTabsProps {
  selectedTab: BookingTab;
  onSelectTab: (tab: BookingTab) => void;
  activeCount: number;
  completedCount: number;
  cancelledCount: number;
}

export const BookingFilterTabs: React.FC<BookingFilterTabsProps> = ({
  selectedTab,
  onSelectTab,
  activeCount,
  completedCount,
  cancelledCount,
}) => {
  const { isDark } = useTheme();

  const tabs: { id: BookingTab; label: string; count: number; icon: any }[] = [
    { id: 'ACTIVE', label: 'Active', count: activeCount, icon: Clock },
    { id: 'COMPLETED', label: 'Completed', count: completedCount, icon: CheckCircle2 },
    { id: 'CANCELLED', label: 'Cancelled', count: cancelledCount, icon: XCircle },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isSelected = selectedTab === tab.id;
          const Icon = tab.icon;

          const activeBg = tokens.colors.brand.primary;
          const inactiveBg = isDark ? tokens.colors.dark.bgSurface : tokens.colors.light.bgSurface;
          const activeBorder = tokens.colors.brand.primary;
          const inactiveBorder = isDark ? tokens.colors.dark.borderSubtle : tokens.colors.light.borderSubtle;
          const activeTextColor = '#000000';
          const inactiveTextColor = isDark ? tokens.colors.dark.textSecondary : tokens.colors.light.textSecondary;
          const activeIconColor = '#000000';
          const inactiveIconColor = isDark ? tokens.colors.dark.textMuted : tokens.colors.light.textMuted;

          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabChip,
                {
                  backgroundColor: isSelected ? activeBg : inactiveBg,
                  borderColor: isSelected ? activeBorder : inactiveBorder,
                },
              ]}
              onPress={() => onSelectTab(tab.id)}
              activeOpacity={0.8}
            >
              <Icon
                size={16}
                color={isSelected ? activeIconColor : inactiveIconColor}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isSelected ? activeTextColor : inactiveTextColor },
                ]}
              >
                {tab.label}
              </Text>

              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: isSelected
                      ? 'rgba(0,0,0,0.15)'
                      : isDark
                      ? tokens.colors.dark.bgSubtle
                      : tokens.colors.light.bgSubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    { color: isSelected ? activeTextColor : inactiveTextColor },
                  ]}
                >
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: tokens.spacing.md,
  },
  scrollContent: {
    paddingHorizontal: tokens.spacing.lg,
    gap: tokens.spacing.sm,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radii.pill,
    borderWidth: 1,
  },
  icon: {
    marginRight: tokens.spacing.xs,
  },
  tabLabel: {
    fontSize: tokens.typography.bodySm.fontSize,
    fontWeight: '700',
    marginRight: tokens.spacing.xs,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: tokens.radii.pill,
    marginLeft: 2,
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
