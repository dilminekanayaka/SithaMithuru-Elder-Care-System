import React, { useState, useEffect, useCallback } from "react";
import { AuthProvider } from "./src/context/AuthContext";
import { SafeAreaView, StatusBar, Alert, BackHandler, Text, TextInput, Linking } from "react-native";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
import SplashScreen from "./src/screens/SplashScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import ElderDashboardScreen from "./src/screens/Elder/ElderDashboardScreen";
import EmergencySOSScreen from "./src/screens/Elder/EmergencySOSScreen";
import MedicinesScreen from "./src/screens/Elder/MedicinesScreen";
import TasksScreen from "./src/screens/Elder/TasksScreen";
import MoodScreen from "./src/screens/Elder/MoodScreen";
import ProfileScreen from "./src/screens/Elder/ProfileScreen";
import SettingsScreen from "./src/screens/Elder/SettingsScreen";
import JournalScreen from "./src/screens/Elder/JournalScreen";
import EditProfileScreen from "./src/screens/Elder/EditProfileScreen";
import AddTaskScreen from "./src/screens/Elder/AddTaskScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import LanguageSelectionScreen from "./src/screens/LanguageSelectionScreen";
import SessionExpiredScreen from "./src/screens/system/SessionExpiredScreen";
import OTPVerificationScreen from "./src/screens/OTPVerificationScreen";
import CreatePasswordScreen from "./src/screens/CreatePasswordScreen";
import RegistrationSuccessScreen from "./src/screens/RegistrationSuccessScreen";
import PreparingDashboardScreen from "./src/screens/guardian/PreparingDashboardScreen";
import AddMedicationScreen from "./src/screens/Elder/AddMedicationScreen";
import MedicationDetailsScreen from "./src/screens/Elder/MedicationDetailsScreen";
import ReminderHistoryScreen from "./src/screens/Elder/ReminderHistoryScreen";
import EmergencyHistoryScreen from "./src/screens/Elder/EmergencyHistoryScreen";
import GuardianManagementScreen from "./src/screens/Elder/GuardianManagementScreen";
import ElderNotificationsScreen from "./src/screens/Elder/ElderNotificationsScreen";
import PendingRequestsScreen from "./src/screens/PendingRequestsScreen";
import ConnectionSuccessScreen from "./src/screens/ConnectionSuccessScreen";
import GuardianNavigator from "./src/navigation/GuardianNavigator";
import ConnectScreen from "./src/screens/ConnectScreen";
import SelectRoleScreen from "./src/screens/SelectRoleScreen";
import CreateProfileScreen from "./src/screens/CreateProfileScreen";
import EmergencyContactsScreen from "./src/screens/Elder/EmergencyContactsScreen";
import MoodHistoryScreen from "./src/screens/Elder/MoodHistoryScreen";
import EditMedicationScreen from "./src/screens/Elder/EditMedicationScreen";
import NetInfo from "@react-native-community/netinfo";
import { SessionExpiredError, API_URL } from "./src/services/api";
import { registerForPushNotificationsAsync } from "./src/services/notifications";

if ((Text as any).defaultProps == null) (Text as any).defaultProps = {};
(Text as any).defaultProps.allowFontScaling = true;
if ((TextInput as any).defaultProps == null) (TextInput as any).defaultProps = {};
(TextInput as any).defaultProps.allowFontScaling = true;

const STORE_TOKEN = "sithamithuru_auth_token";
const STORE_USER = "sithamithuru_user_data";
const STORE_REFRESH_TOKEN = "sithamithuru_refresh_token";

type ScreenType =
  | "splash"
  | "onboarding"
  | "login"
  | "signup"
  | "selectRole"
  | "createProfile"
  | "emergencyContacts"
  | "elderDashboard"
  | "guardianDashboard"
  | "sos"
  | "medicines"
  | "tasks"
  | "mood"
  | "moodHistory"
  | "profile"
  | "settings"
  | "journal"
  | "editProfile"
  | "addTask"
  | "connect"
  | "forgotPassword"
  | "languageSelection"
  | "sessionExpired"
  | "noInternet"
  | "otpVerification"
  | "createPassword"
  | "registrationSuccess"
  | "preparingDashboard"
  | "resetPassword"
  | "addMedicationElder"
  | "medicationDetailsElder"
  | "editMedicationElder"
  | "reminderHistoryElder"
  | "emergencyHistoryElder"
  | "guardianManagementElder"
  | "elderNotifications"
  | "pendingRequests"
  | "connectionSuccess";

type Role = "Elder" | "Guardian";

const App = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("splash");
  const [navHistory, setNavHistory] = useState<ScreenType[]>([]);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [tempRegData, setTempRegData] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string>("");
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // FIX NAV-1: Push current screen onto navHistory stack before navigating
  const navigateTo = useCallback((nextScreen: ScreenType) => {
    setNavHistory((prev) => {
      if (prev[prev.length - 1] === currentScreen) return prev;
      return [...prev, currentScreen];
    });
    setCurrentScreen(nextScreen);
  }, [currentScreen]);

  const navigateToDashboard = useCallback(() => {
    setNavHistory([]);
    if (userRole === "Elder") {
      setCurrentScreen("elderDashboard");
    } else {
      setCurrentScreen("guardianDashboard");
    }
  }, [userRole]);

  // FIX NAV-1 / Section 1 & 2.3: Universal goBack handler tied to navHistory stack
  const goBack = useCallback(() => {
    if (navHistory.length > 0) {
      const lastScreen = navHistory[navHistory.length - 1];
      setNavHistory((prev) => prev.slice(0, -1));
      setCurrentScreen(lastScreen);
    } else {
      navigateToDashboard();
    }
  }, [navHistory, navigateToDashboard]);

  // FIX NAV-1 / Section 2.3: Android hardware back button handler
  useEffect(() => {
    const handleBackPress = () => {
      if (currentScreen === "elderDashboard" || currentScreen === "guardianDashboard") {
        Alert.alert("Exit SithaMithuru", "Are you sure you want to exit the app?", [
          { text: "Stay", style: "cancel" },
          { text: "Exit", style: "destructive", onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      }
      if (navHistory.length > 0) {
        goBack();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", handleBackPress);
    return () => sub.remove();
  }, [currentScreen, navHistory, goBack]);

  // FIX NAV-4 / Section 3: Push Notification routing
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === "EMERGENCY_SOS" || data?.screen === "sos") {
        navigateTo("sos");
      } else if (data?.screen) {
        navigateTo(data.screen as ScreenType);
      }
    });
    return () => sub.remove();
  }, [navigateTo]);

  // FIX NAV-4 / Section 3: Universal Deep Link URL handler
  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return;
      if (url.includes("connect")) {
        navigateTo("connect");
      } else if (url.includes("sos")) {
        navigateTo("sos");
      }
    };

    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener("url", (e) => handleUrl(e.url));
    return () => sub.remove();
  }, [navigateTo]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!state.isConnected && !!state.isInternetReachable;

      if (!isOnline && online && authToken && userData?.id && userRole === "Elder") {
        Toast.show({
          type: "info",
          text1: "Syncing...",
          text2: "Uploading offline logs to the cloud.",
          position: "top",
        });
        import("./src/services/syncService").then(({ syncOfflineQueue }) => {
          syncOfflineQueue(userData.id, authToken).then((success) => {
            if (success) {
              Toast.show({
                type: "success",
                text1: "Sync Complete",
                text2: "All caught up!",
                position: "top",
              });
            }
          });
        });
      }
      setIsOnline(online);
    });
    return () => unsubscribe();
  }, [isOnline, authToken, userData, userRole]);

  useEffect(() => {
    import("./src/database/db").then((db) => {
      db.initDB();
    });
    import("./src/services/backgroundSyncService").then(({ registerBackgroundSync }) => {
      registerBackgroundSync();
    });
  }, []);

  const checkExistingSession = useCallback(async () => {
    try {
      const storedToken = await SecureStore.getItemAsync(STORE_TOKEN);
      const storedUser = await SecureStore.getItemAsync(STORE_USER);

      if (storedToken && storedUser) {
        const user = JSON.parse(storedUser);

        const response = await fetch(
          `${API_URL}/users/${user.id}`,
          {
            headers: { Authorization: `Bearer ${storedToken}` },
          }
        );

        if (response.ok) {
          setUserData(user);
          setAuthToken(storedToken);
          setUserRole(user.role as Role);
          setCurrentScreen(
            user.role === "Elder" ? "elderDashboard" : "guardianDashboard"
          );
          setSessionChecked(true);
          registerForPushNotificationsAsync(storedToken);
          return;
        }
        await clearSession();
      }
    } catch {
      await clearSession();
    }
    setSessionChecked(true);
    setCurrentScreen("onboarding");
  }, []);

  useEffect(() => {
    checkExistingSession();
  }, [checkExistingSession]);

  const persistSession = async (token: string, refreshToken: string, user: any) => {
    await SecureStore.setItemAsync(STORE_TOKEN, token);
    await SecureStore.setItemAsync(STORE_REFRESH_TOKEN, refreshToken);
    await SecureStore.setItemAsync(STORE_USER, JSON.stringify(user));

    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('userData', JSON.stringify(user));
    } catch {}
  };

  const clearSession = async () => {
    await SecureStore.deleteItemAsync(STORE_TOKEN);
    await SecureStore.deleteItemAsync(STORE_REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(STORE_USER);

    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('userData');
    } catch {}
  };

  const handleSessionExpired = useCallback(async () => {
    await clearSession();
    setUserRole(null);
    setUserData(null);
    setAuthToken("");
    setNavHistory([]);
    setCurrentScreen("sessionExpired");
    Toast.show({
      type: "error",
      text1: "Session Expired",
      text2: "Please log in again.",
      position: "top",
    });
  }, []);

  const handleAuthSuccess = async (role: Role, user?: any, token?: string, refreshToken?: string) => {
    setUserRole(role);
    if (user) setUserData(user);
    if (token) {
      setAuthToken(token);
      if (user && token && refreshToken) {
        await persistSession(token, refreshToken, { ...user, role });
      }
      registerForPushNotificationsAsync(token);
    }
    setNavHistory([]);
    if (role === "Elder") {
      setCurrentScreen("elderDashboard");
    } else {
      setCurrentScreen("guardianDashboard");
    }
  };

  const handleSignupSuccess = (role: Role, user?: any, token?: string, refreshToken?: string) => {
    setUserRole(role);
    if (user) setUserData(user);
    if (token) setAuthToken(token);
    navigateTo("selectRole");
  };

  const handleRoleSelected = (role: Role) => {
    setUserRole(role);
    setUserData((prev: any) => ({ ...(prev || {}), role }));
    navigateTo("createProfile");
  };

  const handleProfileCompleted = async (profileData: any) => {
    const role = profileData.role || userRole || "Elder";
    setUserRole(role);
    const updatedUser = { ...(userData || {}), ...profileData };
    setUserData(updatedUser);
    if (authToken) {
      await persistSession(authToken, "", updatedUser);
    }
    setNavHistory([]);
    if (role === "Elder") {
      setCurrentScreen("elderDashboard");
    } else {
      setCurrentScreen("guardianDashboard");
    }
  };

  const handleLogout = async () => {
    await clearSession();
    setUserRole(null);
    setUserData(null);
    setAuthToken("");
    setNavHistory([]);
    setCurrentScreen("login");
    Toast.show({
      type: "success",
      text1: "Logged Out",
      text2: "You have been successfully logged out.",
      position: "top",
    });
  };

  const renderScreen = () => {
    const getInitials = (name?: string) => {
      if (!name) return "U";
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
    };

    switch (currentScreen) {
      case "splash":
        return (
          <SplashScreen
            onFinish={sessionChecked ? () => setCurrentScreen("onboarding") : undefined}
          />
        );
      case "onboarding":
        return <OnboardingScreen onFinish={() => setCurrentScreen("signup")} />;
      case "login":
        return (
          <LoginScreen
            onLoginPress={(role, user, token, refreshToken) => handleAuthSuccess(role, user, token, refreshToken)}
            onRegisterPress={() => navigateTo("signup")}
            onForgotPassword={() => navigateTo("forgotPassword")}
          />
        );
      case "forgotPassword":
        return (
          <ForgotPasswordScreen
            onBack={goBack}
          />
        );
      case "signup":
        return (
          <SignupScreen
            onSignupPress={(role, user, token, refreshToken) => {
              handleSignupSuccess(role, user, token, refreshToken);
            }}
            onLoginPress={() => setCurrentScreen("login")}
            onContinueToOTP={(regData) => {
              setTempRegData(regData);
              setCurrentScreen("otpVerification");
            }}
          />
        );
      case "selectRole":
        return (
          <SelectRoleScreen
            onRoleSelected={handleRoleSelected}
            onBack={goBack}
          />
        );
      case "createProfile":
        return (
          <CreateProfileScreen
            role={userRole || "Elder"}
            initialName={userData?.name}
            initialEmail={userData?.email}
            token={authToken}
            onComplete={handleProfileCompleted}
            onBack={goBack}
          />
        );
      case "emergencyContacts":
        return (
          <EmergencyContactsScreen
            onBack={goBack}
            token={authToken}
            elderId={userData?.id}
          />
        );
      case "elderDashboard":
        return (
          <ElderDashboardScreen
            onLogout={handleLogout}
            userName={userData?.name}
            userEmail={userData?.email}
            userInitials={getInitials(userData?.name)}
            elderId={userData?.id}
            token={authToken}
            onNavigate={(screen: string) =>
              navigateTo(screen as ScreenType)
            }
          />
        );
      case "guardianDashboard":
        return (
          <GuardianNavigator
            onLogout={handleLogout}
            onSessionExpired={handleSessionExpired}
            userData={userData}
            authToken={authToken}
            isOnline={isOnline}
          />
        );
      case "sos":
        return (
          <EmergencySOSScreen
            onBack={goBack}
            onNavigate={(screen: string) =>
              navigateTo(screen as ScreenType)
            }
            elderId={userData?.id}
            token={authToken}
            guardianPhone={userData?.guardian_phone}
          />
        );
      case "medicines":
        return (
          <MedicinesScreen
            elderId={userData?.id}
            token={authToken}
            isOnline={isOnline}
            onBack={goBack}
            onNavigate={(screen: string) =>
              navigateTo(screen as ScreenType)
            }
          />
        );
      case "tasks":
        return (
          <TasksScreen
            elderId={userData?.id}
            token={authToken}
            isOnline={isOnline}
            onBack={goBack}
            onNavigate={(screen: string) =>
              navigateTo(screen as ScreenType)
            }
          />
        );
      case "mood":
        return (
          <MoodScreen
            elderId={userData?.id}
            token={authToken}
            isOnline={isOnline}
            onBack={goBack}
            onNavigate={(screen: string) =>
              navigateTo(screen as ScreenType)
            }
          />
        );
      case "profile":
        return (
          <ProfileScreen
            userData={userData}
            onBack={goBack}
            onNavigate={(screen: string) =>
              navigateTo(screen as ScreenType)
            }
          />
        );
      case "settings":
        return (
          <SettingsScreen
            onBack={goBack}
            onLogout={handleLogout}
            onNavigate={(screen: string) =>
              navigateTo(screen as ScreenType)
            }
          />
        );
      case "journal":
        return (
          <JournalScreen
            elderId={userData?.id}
            token={authToken}
            userName={userData?.name}
            onBack={goBack}
            onNavigate={(screen: string) =>
              navigateTo(screen as ScreenType)
            }
          />
        );
      case "editProfile":
        return (
          <EditProfileScreen
            userData={userData}
            token={authToken}
            onBack={goBack}
            onNavigate={(screen: string) =>
              navigateTo(screen as ScreenType)
            }
            onSave={async (updatedUser) => {
              const merged = { ...updatedUser, role: userRole };
              setUserData(merged);
              await SecureStore.setItemAsync(STORE_USER, JSON.stringify(merged));
              goBack();
            }}
          />
        );
      case "addTask":
        return (
          <AddTaskScreen
            elderId={userData?.id}
            token={authToken}
            onBack={goBack}
            onNavigate={(screen) => navigateTo(screen as ScreenType)}
            onSave={goBack}
          />
        );
      case "connect":
        return (
          <ConnectScreen
            onBack={goBack}
            token={authToken}
            userRole={userRole || "Elder"}
          />
        );
      case "languageSelection":
        return (
          <LanguageSelectionScreen
            onContinue={() => setCurrentScreen("login")}
          />
        );
      case "sessionExpired":
        return (
          <SessionExpiredScreen
            onLoginAgain={() => setCurrentScreen("login")}
          />
        );
      case "noInternet":
        return (
          <NoInternetScreen
            onRetry={() => setCurrentScreen("elderDashboard")}
          />
        );
      case "otpVerification":
        return (
          <OTPVerificationScreen
            phone={tempRegData?.phone || "94712345678"}
            email={tempRegData?.email}
            onVerified={() => setCurrentScreen("createPassword")}
            onBack={goBack}
          />
        );
      case "createPassword":
        return (
          <CreatePasswordScreen
            onBack={goBack}
            onContinue={(password) => {
              setCurrentScreen("registrationSuccess");
            }}
          />
        );
      case "registrationSuccess":
        return (
          <RegistrationSuccessScreen
            onContinueToPairing={(relationship) => {
              setUserData((prev: any) => ({ ...(prev || {}), relationship }));
              setUserRole("Guardian");
              setCurrentScreen("addElder");
            }}
          />
        );
      case "preparingDashboard":
        return (
          <PreparingDashboardScreen
            elderName={userData?.elder_name || "Your Elder"}
            onFinish={() => setCurrentScreen("guardianDashboard")}
          />
        );
      case "resetPassword":
        return (
          <ResetPasswordScreen
            email={userData?.email || ""}
            code="123456"
            onSuccess={() => setCurrentScreen("login")}
            onBack={goBack}
          />
        );
      case "addMedicationElder":
        return (
          <AddMedicationScreen
            token={authToken}
            elderId={userData?.id}
            onBack={goBack}
            onSave={goBack}
            onSessionExpired={handleSessionExpired}
          />
        );
      case "medicationDetailsElder":
        return (
          <MedicationDetailsScreen
            medication={{ id: 1, name: "Sample Med", time: "08:00 AM", taken: false }}
            token={authToken}
            elderId={userData?.id}
            onBack={goBack}
            onUpdated={goBack}
            onEdit={() => navigateTo("editMedicationElder")}
            onSessionExpired={handleSessionExpired}
          />
        );
      case "editMedicationElder":
        return (
          <EditMedicationScreen
            onBack={goBack}
            onSaveSuccess={goBack}
            onDeleteSuccess={goBack}
          />
        );
      case "moodHistory":
        return (
          <MoodHistoryScreen
            onBack={goBack}
            elderId={userData?.id}
            token={authToken}
          />
        );
      case "reminderHistoryElder":
        return (
          <ReminderHistoryScreen
            onBack={goBack}
          />
        );
      case "emergencyHistoryElder":
        return (
          <EmergencyHistoryScreen
            token={authToken}
            elderId={userData?.id}
            onBack={goBack}
          />
        );
      case "guardianManagementElder":
        return (
          <GuardianManagementScreen
            token={authToken}
            elderId={userData?.id}
            onBack={goBack}
            onSessionExpired={handleSessionExpired}
          />
        );
      case "elderNotifications":
        return (
          <ElderNotificationsScreen
            onBack={goBack}
          />
        );
      case "pendingRequests":
        return (
          <PendingRequestsScreen
            token={authToken}
            onBack={goBack}
            onAccepted={() => setCurrentScreen("connectionSuccess")}
            onSessionExpired={handleSessionExpired}
          />
        );
      case "connectionSuccess":
        return (
          <ConnectionSuccessScreen
            connectedName="Guardian / Elder"
            role="Guardian"
            onContinue={navigateToDashboard}
          />
        );
      default:
        return <SplashScreen />;
    }
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {renderScreen()}
      <Toast />
    </>
  );
};

const AppContainer = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default AppContainer;
