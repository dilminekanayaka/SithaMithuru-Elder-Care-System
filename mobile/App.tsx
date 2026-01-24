import React, { useState } from 'react';
import { SafeAreaView, StatusBar, useColorScheme } from 'react-native';
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';

type ScreenType = 'splash' | 'onboarding' | 'login' | 'signup';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('splash');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen onFinish={() => setCurrentScreen('onboarding')} />;
      case 'onboarding':
        return <OnboardingScreen onFinish={() => setCurrentScreen('login')} />;
      case 'login':
        return (
          <LoginScreen
            onLoginPress={() => console.log('Login Pressed')}
            onRegisterPress={() => setCurrentScreen('signup')}
          />
        );
      case 'signup':
        return (
          <SignupScreen
            onSignupPress={() => console.log('Signup Pressed')}
            onLoginPress={() => setCurrentScreen('login')}
          />
        );
      default:
        return <SplashScreen onFinish={() => setCurrentScreen('onboarding')} />;
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {renderScreen()}
    </>
  );
};

export default App;
