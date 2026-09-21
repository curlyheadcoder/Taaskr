import React from 'react';
import { 
  StyleSheet, View, TouchableOpacity, StyleProp, ViewStyle 
} from 'react-native';
import { tokens } from '../../theme/tokens';
import { useTheme } from '../../theme/ThemeContext';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  bordered?: boolean;
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  elevation = 'none',
  bordered = true,
  padding = tokens.spacing.lg,
}) => {
  const { isDark } = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: isDark ? tokens.colors.dark.bgSurface : tokens.colors.light.bgSurface,
    borderRadius: tokens.radii.lg,
    padding,
    borderWidth: bordered ? 1 : 0,
    borderColor: isDark ? tokens.colors.dark.borderSubtle : tokens.colors.light.borderSubtle,
    ...tokens.elevation[elevation],
  };

  if (onPress) {
    return (
      <TouchableOpacity 
        style={[cardStyle, style]} 
        onPress={onPress} 
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  );
};
