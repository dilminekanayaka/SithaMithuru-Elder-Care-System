import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Image,
  Animated,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish?: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  // Animation Values
  const fadeAnim = useRef(new Animated.Value(0)).current; // Opacity 0 -> 1
  const scaleAnim = useRef(new Animated.Value(0.95)).current; // Scale 0.95 -> 1 (Subtle zoom)
  const slideAnim = useRef(new Animated.Value(30)).current; // TranslateY 30 -> 0

  useEffect(() => {
    // Parallel Animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to main app after 3.5 seconds
    const timer = setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, [onFinish, fadeAnim, scaleAnim, slideAnim]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#F5D5A8" barStyle="dark-content" />
      
      {/* Animated Illustration */}
      <Animated.View
        style={[
          styles.illustrationContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require('../../assets/images/splash-screen.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Animated Text Content */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.appName}>SithaMithuru</Text>
        <Text style={styles.tagline}>Your Safety Companion</Text>
      </Animated.View>

      {/* Loading Indicator */}
      <Animated.View style={[styles.loaderContainer, { opacity: fadeAnim }]}>
        <ActivityIndicator size="large" color="#2C3E50" />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5D5A8',
    alignItems: 'center',
    justifyContent: 'space-between', // Distribute space vertically
    paddingVertical: 60,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: width * 0.85,
    marginTop: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 40, // Larger, more prominent
    fontWeight: '800',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 1,
    // Soft shadow for depth
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 20,
    fontWeight: '500',
    color: '#5D4E37', // Darker earthy tone
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  loaderContainer: {
    // Keep loader at bottom
    justifyContent: 'flex-end',
    height: 50,
  },
});

export default SplashScreen;
