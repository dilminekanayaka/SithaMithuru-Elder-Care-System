import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 80;
const BAR_MAX_HEIGHT = 80;

interface MoodEntry {
  date: string;       // 'Mon', 'Tue', etc.
  mood_type: string;  // 'Happy', 'Sad', etc.
}

interface MoodTrendChartProps {
  data: MoodEntry[];
}

const MOOD_COLOR: Record<string, string> = {
  Happy: '#27AE60',
  Neutral: '#F1C40F',
  Sad: '#3498DB',
  Anxious: '#E67E22',
  Angry: '#E74C3C',
};

const MOOD_SCORE: Record<string, number> = {
  Happy: 5,
  Neutral: 3,
  Sad: 2,
  Anxious: 1,
  Angry: 1,
};

const MOOD_EMOJI: Record<string, string> = {
  Happy: '😊',
  Neutral: '😐',
  Sad: '😢',
  Anxious: '😰',
  Angry: '😠',
};

const MoodTrendChart: React.FC<MoodTrendChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No mood data available for this period</Text>
      </View>
    );
  }

  const maxScore = 5;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>7-Day Mood Trend</Text>
      <View style={styles.chartArea}>
        {data.map((entry, i) => {
          const score = MOOD_SCORE[entry.mood_type] ?? 3;
          const barHeight = (score / maxScore) * BAR_MAX_HEIGHT;
          const color = MOOD_COLOR[entry.mood_type] ?? '#BDC3C7';
          const emoji = MOOD_EMOJI[entry.mood_type] ?? '😐';

          return (
            <View key={i} style={styles.barWrapper}>
              <Text style={styles.emoji}>{emoji}</Text>
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.dayLabel}>{entry.date}</Text>
            </View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {Object.entries(MOOD_COLOR).map(([mood, color]) => (
          <View key={mood} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendLabel}>{mood}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2C3E50',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: BAR_MAX_HEIGHT + 50,
    marginBottom: 16,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  emoji: {
    fontSize: 16,
    marginBottom: 4,
  },
  barContainer: {
    width: 24,
    height: BAR_MAX_HEIGHT,
    justifyContent: 'flex-end',
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 8,
  },
  dayLabel: {
    fontSize: 10,
    color: '#4A5568',
    fontWeight: '700',
    marginTop: 6,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    color: '#4A5568',
    fontWeight: '600',
  },
  empty: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 13,
    color: '#95A5A6',
    fontWeight: '600',
  },
});

export default MoodTrendChart;
