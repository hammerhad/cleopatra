import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from './SkeletonBase';
import { Colors, BorderRadius } from '../../theme';

export function HabitListSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header stats */}
      <View style={styles.statsRow}>
        {[1, 2].map((i) => (
          <View key={i} style={styles.statCard}>
            <SkeletonBox width={50} height={32} borderRadius={4} style={{ alignSelf: 'center' }} />
            <SkeletonBox width={70} height={11} style={{ marginTop: 6, alignSelf: 'center' }} />
          </View>
        ))}
      </View>

      {/* Week grid */}
      <View style={styles.weekRow}>
        {Array.from({ length: 7 }).map((_, i) => (
          <View key={i} style={styles.dayCell}>
            <SkeletonBox width={24} height={10} />
            <SkeletonBox width={32} height={32} borderRadius={16} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>

      {/* Habit cards */}
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={i} style={styles.habitCard}>
          <View style={styles.habitLeft}>
            <SkeletonBox width={44} height={44} borderRadius={22} />
          </View>
          <View style={styles.habitInfo}>
            <SkeletonBox width="70%" height={15} />
            <SkeletonBox width="50%" height={11} style={{ marginTop: 6 }} />
            {/* Streak dots */}
            <View style={styles.dots}>
              {Array.from({ length: 7 }).map((_, j) => (
                <SkeletonBox key={j} width={8} height={8} borderRadius={4} />
              ))}
            </View>
          </View>
          <SkeletonBox width={36} height={36} borderRadius={18} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.ONYX,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.ANTHRACITE,
    borderRadius: BorderRadius.LG,
    padding: 16,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.ANTHRACITE,
    borderRadius: BorderRadius.LG,
    padding: 16,
    marginBottom: 20,
  },
  dayCell: {
    alignItems: 'center',
    gap: 4,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.ANTHRACITE,
    borderRadius: BorderRadius.LG,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  habitLeft: {},
  habitInfo: {
    flex: 1,
    gap: 4,
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
});
