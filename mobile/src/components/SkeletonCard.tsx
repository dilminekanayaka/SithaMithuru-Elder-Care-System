import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors } from '../theme';

interface SkeletonCardProps {
  height?: number;
  borderRadius?: number;
  marginBottom?: number;
  width?: string | number;
}

// A simple shimmer-less skeleton placeholder using a muted background.
// Can be upgraded with a shimmer library later if desired.
const SkeletonCard: React.FC<SkeletonCardProps> = ({
  height = 80,
  borderRadius = 20,
  marginBottom = 12,
  width = '100%',
}) => (
  <View
    style={[styles.skeleton, { height, borderRadius, marginBottom, width: width as any }]}
    accessibilityLabel="Loading..."
  />
);

// A row of skeleton cards for list loading states
export const SkeletonList: React.FC<{ count?: number; height?: number }> = ({
  count = 3,
  height = 80,
}) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} height={height} marginBottom={12} />
    ))}
  </>
);

// A full stat-grid skeleton for dashboard
export const SkeletonStatsGrid: React.FC = () => (
  <View style={styles.grid}>
    {Array.from({ length: 4 }).map((_, i) => (
      <SkeletonCard key={i} height={120} borderRadius={24} width="48%" marginBottom={16} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.skeleton,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
});

export default SkeletonCard;
