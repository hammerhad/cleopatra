import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from './SkeletonBase';
import { Colors, BorderRadius } from '../../theme';

export function TaskListSkeleton() {
  return (
    <View style={styles.container}>
      {/* Tab bar */}
      <View style={styles.tabs}>
        {['Now', 'Next', 'Later', 'Done'].map((_, i) => (
          <SkeletonBox
            key={i}
            width={60}
            height={32}
            borderRadius={BorderRadius.PILL}
          />
        ))}
      </View>

      {/* Task cards */}
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={i} style={styles.taskCard}>
          <View style={styles.taskLeft}>
            <SkeletonBox width={20} height={20} borderRadius={10} />
          </View>
          <View style={styles.taskContent}>
            <View style={styles.taskHeader}>
              <SkeletonBox width="65%" height={15} />
              <SkeletonBox width={50} height={20} borderRadius={BorderRadius.PILL} />
            </View>
            <SkeletonBox width="40%" height={11} style={{ marginTop: 6 }} />
            <View style={styles.taskMeta}>
              <SkeletonBox width={60} height={11} />
              <SkeletonBox width={40} height={11} />
            </View>
          </View>
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
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: Colors.ANTHRACITE,
    borderRadius: BorderRadius.LG,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  taskLeft: {
    paddingTop: 2,
  },
  taskContent: {
    flex: 1,
    gap: 4,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
});
