import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from './SkeletonBase';
import { Colors, Spacing, BorderRadius } from '../../theme';

export function DashboardSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <SkeletonBox width={120} height={14} />
          <SkeletonBox width={200} height={28} style={{ marginTop: 8 }} borderRadius={4} />
        </View>
        <SkeletonBox width={48} height={48} borderRadius={24} />
      </View>

      {/* Phase card */}
      <SkeletonBox
        width="100%"
        height={100}
        borderRadius={BorderRadius.XL}
        style={{ marginBottom: 16 }}
      />

      {/* Stats row */}
      <View style={styles.statsRow}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.statCard}>
            <SkeletonBox width={48} height={48} borderRadius={24} style={{ alignSelf: 'center' }} />
            <SkeletonBox width={60} height={12} style={{ marginTop: 8, alignSelf: 'center' }} />
          </View>
        ))}
      </View>

      {/* Habits section */}
      <View style={styles.sectionHeader}>
        <SkeletonBox width={100} height={16} />
        <SkeletonBox width={60} height={12} />
      </View>
      {[1, 2, 3].map((i) => (
        <HabitRowSkeleton key={i} />
      ))}

      {/* Motivation card */}
      <SkeletonBox
        width="100%"
        height={140}
        borderRadius={BorderRadius.XL}
        style={{ marginTop: 16 }}
      />
    </View>
  );
}

function HabitRowSkeleton() {
  return (
    <View style={styles.habitRow}>
      <SkeletonBox width={40} height={40} borderRadius={20} />
      <View style={styles.habitContent}>
        <SkeletonBox width="60%" height={14} />
        <SkeletonBox width="40%" height={11} style={{ marginTop: 6 }} />
      </View>
      <SkeletonBox width={32} height={32} borderRadius={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.ONYX,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingTop: 60,
  },
  headerLeft: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.ANTHRACITE,
    borderRadius: BorderRadius.LG,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ANTHRACITE,
    borderRadius: BorderRadius.MD,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  habitContent: {
    flex: 1,
  },
});
