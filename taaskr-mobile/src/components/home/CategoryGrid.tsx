import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { 
  Wrench, Zap, Sparkles, Paintbrush, Settings, 
  Truck, ShieldCheck, Hammer, Grid, Briefcase 
} from 'lucide-react-native';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';
import { Category } from '../../types';

export interface CategoryGridProps {
  categories: Category[];
  selectedCatId: number | null;
  onSelectCategory: (catId: number | null) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  selectedCatId,
  onSelectCategory,
}) => {
  const { isDark } = useTheme();

  const getCategoryIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('plumb')) return Wrench;
    if (lower.includes('electr')) return Zap;
    if (lower.includes('clean')) return Sparkles;
    if (lower.includes('paint')) return Paintbrush;
    if (lower.includes('appliance') || lower.includes('repair')) return Settings;
    if (lower.includes('transport') || lower.includes('cargo') || lower.includes('vehicle')) return Truck;
    if (lower.includes('security') || lower.includes('lock')) return ShieldCheck;
    if (lower.includes('carpen') || lower.includes('wood')) return Hammer;
    return Briefcase;
  };

  const textColor = isDark ? tokens.colors.dark.textPrimary : tokens.colors.light.textPrimary;
  const subColor = isDark ? tokens.colors.dark.textSecondary : tokens.colors.light.textSecondary;

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>Service Categories</Text>

      <View style={styles.grid}>
        {/* All Services Item */}
        <TouchableOpacity
          style={styles.gridItem}
          onPress={() => onSelectCategory(null)}
          activeOpacity={0.7}
        >
          <View style={[
            styles.iconTile,
            selectedCatId === null 
              ? styles.iconTileActive 
              : { backgroundColor: isDark ? tokens.colors.dark.bgSurface : tokens.colors.light.bgSurface }
          ]}>
            <Grid 
              size={22} 
              color={selectedCatId === null ? tokens.colors.brand.primary : subColor} 
            />
          </View>
          <Text 
            style={[
              styles.itemText, 
              { color: selectedCatId === null ? tokens.colors.brand.primary : subColor }
            ]} 
            numberOfLines={1}
          >
            All
          </Text>
        </TouchableOpacity>

        {/* Dynamic Backend Categories */}
        {categories.map((cat) => {
          const IconComp = getCategoryIcon(cat.name);
          const isSelected = selectedCatId === cat.id;

          return (
            <TouchableOpacity
              key={cat.id}
              style={styles.gridItem}
              onPress={() => onSelectCategory(isSelected ? null : cat.id)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.iconTile,
                isSelected 
                  ? styles.iconTileActive 
                  : { backgroundColor: isDark ? tokens.colors.dark.bgSurface : tokens.colors.light.bgSurface }
              ]}>
                <IconComp 
                  size={22} 
                  color={isSelected ? tokens.colors.brand.primary : subColor} 
                />
              </View>
              <Text 
                style={[
                  styles.itemText, 
                  { color: isSelected ? tokens.colors.brand.primary : subColor }
                ]} 
                numberOfLines={1}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: tokens.spacing.md,
  },
  sectionTitle: {
    fontSize: tokens.typography.h3.fontSize,
    lineHeight: tokens.typography.h3.lineHeight,
    fontWeight: tokens.typography.h3.fontWeight,
    marginBottom: tokens.spacing.md,
    paddingHorizontal: tokens.spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: tokens.spacing.md,
  },
  gridItem: {
    width: '25%',
    alignItems: 'center',
    marginBottom: tokens.spacing.lg,
    paddingHorizontal: 4,
  },
  iconTile: {
    width: 52,
    height: 52,
    borderRadius: tokens.radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  iconTileActive: {
    backgroundColor: tokens.colors.brand.primaryMuted,
    borderColor: tokens.colors.brand.primary,
  },
  itemText: {
    fontSize: tokens.typography.bodySm.fontSize,
    fontWeight: '600',
    textAlign: 'center',
  },
});
