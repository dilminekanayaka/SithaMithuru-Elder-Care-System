import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, spacing, radius, elevation, typography } from '../theme';

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  title: string;
  description: string;
  icon: string;
  accentColor: string;
  accentBg: string;
}

// Each slide's accent reuses the same category color the feature uses
// elsewhere in the app (medicine/tasks/emergency/guardian), so the color
// a new user sees here is the same one they'll recognize later.
const slides: Slide[] = [
  {
    id: '1',
    title: 'Medicine Reminders',
    description: "Never miss your medication. We'll remind you at the right time, every time.",
    icon: 'pill',
    accentColor: colors.category.medicine.accent,
    accentBg: colors.category.medicine.bg,
  },
  {
    id: '2',
    title: 'Daily Support',
    description: 'Keep track of your daily tasks and routines. Stay organized and independent.',
    icon: 'format-list-checks',
    accentColor: colors.category.tasks.accent,
    accentBg: colors.category.tasks.bg,
  },
  {
    id: '3',
    title: 'Emergency Protection',
    description: "Say your safety keyword and we'll instantly alert your guardians. Help is always just a word away.",
    icon: 'shield-alert-outline',
    accentColor: colors.category.sos.accent,
    accentBg: colors.category.sos.bg,
  },
  {
    id: '4',
    title: 'Guardian Monitoring',
    description: 'Your family can check in on you anytime. Stay connected and feel safe together.',
    icon: 'account-heart-outline',
    accentColor: colors.category.guardian.accent,
    accentBg: colors.category.guardian.bg,
  },
];

interface OnboardingScreenProps {
  onFinish?: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const announceSlide = (index: number) => {
    const s = slides[index];
    AccessibilityInfo.announceForAccessibility(
      `${s.title}. ${s.description} Slide ${index + 1} of ${slides.length}.`
    );
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      const idx = viewableItems[0].index ?? 0;
      setCurrentIndex(idx);
      announceSlide(idx);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollToNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      onFinish?.();
    }
  };

  const skip = () => {
    onFinish?.();
  };

  const renderItem = ({ item }: { item: Slide }) => {
    return (
      <View style={styles.slide} accessible accessibilityLabel={`${item.title}. ${item.description}`}>
        <View style={[styles.iconContainer, { backgroundColor: item.accentBg, borderColor: item.accentColor }]}>
          <MaterialCommunityIcons name={item.icon as any} size={52} color={item.accentColor} />
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    );
  };

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        {!isLastSlide && (
          <TouchableOpacity
            onPress={skip}
            style={styles.skipButton}
            accessibilityRole="button"
            accessibilityLabel="Skip introduction"
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.contentContainer}>
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewConfig}
          scrollEventThrottle={32}
        />
      </View>

      <View style={styles.footer}>
        <View
          style={styles.paginationContainer}
          accessible
          accessibilityLabel={`Slide ${currentIndex + 1} of ${slides.length}`}
        >
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={scrollToNext}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={isLastSlide ? 'Get started' : 'Next'}
        >
          <Text style={styles.buttonText}>{isLastSlide ? 'Get Started' : 'Next'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.s5,
  },
  skipButton: {
    padding: spacing.s2,
    minWidth: 48,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  skipText: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: '500',
  },
  contentContainer: {
    flex: 3,
  },
  slide: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.s9,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: radius.xxl,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.s9,
    ...elevation.e2,
  },
  title: {
    ...typography.headlineLarge,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.s4,
  },
  description: {
    ...typography.bodyLarge,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.s2,
  },
  footer: {
    flex: 1,
    paddingHorizontal: spacing.s5,
    justifyContent: 'space-between',
    paddingBottom: spacing.s10,
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    marginBottom: spacing.s5,
  },
  dot: {
    height: 8,
    borderRadius: radius.pill,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.primary,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: colors.outline,
  },
  button: {
    backgroundColor: colors.primary,
    width: '90%',
    height: 56,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...elevation.e3,
  },
  buttonText: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
  },
});

export default OnboardingScreen;
