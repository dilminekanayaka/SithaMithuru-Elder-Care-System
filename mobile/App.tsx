import React, { useState, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { StatusBar, Alert, BackHandler, Text, TextInput, Linking } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
import SplashScreen from "./src/screens/SplashScreen";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import PermissionsIntroScreen from "./src/screens/Elder/PermissionsIntroScreen";
import NotificationPermissionScreen from "./src/screens/Elder/NotificationPermissionScreen";
import OnboardingCompleteScreen from "./src/screens/Elder/OnboardingCompleteScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import ElderDashboardScreen from "./src/screens/Elder/ElderDashboardScreen";
import EmergencySOSScreen from "./src/screens/Elder/EmergencySOSScreen";
import MedicinesScreen from "./src/screens/Elder/MedicinesScreen";
import MedicationHistoryScreen from "./src/screens/Elder/MedicationHistoryScreen";
import TasksScreen from "./src/screens/Elder/TasksScreen";
import MoodScreen from "./src/screens/Elder/MoodScreen";
import MoodHistoryScreen from "./src/screens/Elder/MoodHistoryScreen";
import ProfileScreen from "./src/screens/Elder/ProfileScreen";
import SettingsScreen from "./src/screens/Elder/SettingsScreen";
import JournalScreen from "./src/screens/Elder/JournalScreen";
import MyMemoriesScreen from "./src/screens/Elder/MyMemoriesScreen";
import CreateMemoryScreen from "./src/screens/Elder/CreateMemoryScreen";
import MemoryDetailsScreen from "./src/screens/Elder/MemoryDetailsScreen";
import EditMemoryScreen from "./src/screens/Elder/EditMemoryScreen";
import EmergencySafetyScreen from "./src/screens/Elder/EmergencySafetyScreen";
import EmergencySettingsScreen from "./src/screens/Elder/EmergencySettingsScreen";
import EmergencyHistoryScreen from "./src/screens/Elder/EmergencyHistoryScreen";
import EmergencyEventDetailsScreen from "./src/screens/Elder/EmergencyEventDetailsScreen";
import EditProfileScreen from "./src/screens/Elder/EditProfileScreen";
import GuardianInfoScreen from "./src/screens/Elder/GuardianInfoScreen";
import ConnectGuardianScreen from "./src/screens/Elder/ConnectGuardianScreen";
import ScanGuardianQrScreen from "./src/screens/Elder/ScanGuardianQrScreen";
import GuardianConnectionSuccessScreen from "./src/screens/Elder/GuardianConnectionSuccessScreen";
import AddTaskScreen from "./src/screens/Elder/AddTaskScreen";
import TaskDetailsScreen from "./src/screens/Elder/TaskDetailsScreen";
import TaskHistoryScreen from "./src/screens/Elder/TaskHistoryScreen";
import ElderNotificationsScreen from "./src/screens/Elder/ElderNotificationsScreen";
import NotificationDetailsScreen from "./src/screens/Elder/NotificationDetailsScreen";
import NotificationSettingsScreen from "./src/screens/Elder/NotificationSettingsScreen";
import AccessibilitySettingsScreen from "./src/screens/Elder/AccessibilitySettingsScreen";
import AppSettingsScreen from "./src/screens/Elder/AppSettingsScreen";
import AboutSithaMithuruScreen from "./src/screens/Elder/AboutSithaMithuruScreen";
import AboutAppInfoScreen from "./src/screens/Elder/AboutAppInfoScreen";
import PrivacyInformationScreen from "./src/screens/Elder/PrivacyInformationScreen";
import TermsOfUseScreen from "./src/screens/Elder/TermsOfUseScreen";
import OpenSourceLicensesScreen from "./src/screens/Elder/OpenSourceLicensesScreen";
import HelpSupportScreen from "./src/screens/Elder/HelpSupportScreen";
import AppUpdateScreen from "./src/screens/Elder/AppUpdateScreen";
import EmergencySafetyGuideScreen from "./src/screens/Elder/EmergencySafetyGuideScreen";
import TestEmergencyDetectionScreen from "./src/screens/Elder/TestEmergencyDetectionScreen";
import GuardianDetailsScreen from "./src/screens/Elder/GuardianDetailsScreen";
import GuardianConnectionConfirmationScreen from "./src/screens/Elder/GuardianConnectionConfirmationScreen";
import GuardianConnectionPendingScreen from "./src/screens/Elder/GuardianConnectionPendingScreen";
import GuardianConnectionManagementScreen from "./src/screens/Elder/GuardianConnectionManagementScreen";
import GuardianConnectionRemovedScreen from "./src/screens/Elder/GuardianConnectionRemovedScreen";
import GuardianNotificationPreferencesScreen from "./src/screens/Elder/GuardianNotificationPreferencesScreen";
import QuietHoursScreen from "./src/screens/Elder/QuietHoursScreen";
import LanguageSettingsScreen from "./src/screens/Elder/LanguageSettingsScreen";
import TextSizeScreen from "./src/screens/Elder/TextSizeScreen";
import HighContrastScreen from "./src/screens/Elder/HighContrastScreen";
import LargerTouchTargetsScreen from "./src/screens/Elder/LargerTouchTargetsScreen";
import ReduceMotionScreen from "./src/screens/Elder/ReduceMotionScreen";
import TalkBackScreen from "./src/screens/Elder/TalkBackScreen";
import PrivacyDataScreen from "./src/screens/Elder/PrivacyDataScreen";
import DataUsageScreen from "./src/screens/Elder/DataUsageScreen";
import GuardianDataSharingScreen from "./src/screens/Elder/GuardianDataSharingScreen";
import LocalDataScreen from "./src/screens/Elder/LocalDataScreen";
import DeleteLocalDataScreen from "./src/screens/Elder/DeleteLocalDataScreen";
import LocalDataDeletedScreen from "./src/screens/Elder/LocalDataDeletedScreen";
import HelpSupportMainScreen from "./src/screens/Elder/HelpSupportMainScreen";
import HowToUseSithaMithuruScreen from "./src/screens/Elder/HowToUseSithaMithuruScreen";
import MedicationHelpScreen from "./src/screens/Elder/MedicationHelpScreen";
import EmergencyHelpScreen from "./src/screens/Elder/EmergencyHelpScreen";
import GuardianHelpScreen from "./src/screens/Elder/GuardianHelpScreen";
import FaqScreen from "./src/screens/Elder/FaqScreen";
import ContactSupportScreen from "./src/screens/Elder/ContactSupportScreen";
import GuardianModeIntroductionScreen from "./src/screens/Elder/GuardianModeIntroductionScreen";
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
import GuardianManagementScreen from "./src/screens/Elder/GuardianManagementScreen";
import PendingRequestsScreen from "./src/screens/PendingRequestsScreen";
import ConnectionSuccessScreen from "./src/screens/ConnectionSuccessScreen";
import GuardianNavigator from "./src/navigation/GuardianNavigator";
import ElderNavigator from "./src/navigation/ElderNavigator";
import { SyncProvider } from "./src/context/SyncContext";
import ConnectScreen from "./src/screens/ConnectScreen";
import SelectRoleScreen from "./src/screens/SelectRoleScreen";
import CreateProfileScreen from "./src/screens/CreateProfileScreen";
import EmergencyContactsScreen from "./src/screens/Elder/EmergencyContactsScreen";
import EditMedicationScreen from "./src/screens/Elder/EditMedicationScreen";
import NoInternetScreen from "./src/screens/system/NoInternetScreen";
import ResetPasswordScreen from "./src/screens/ResetPasswordScreen";
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
  | "welcome"
  | "onboarding"
  | "permissionsIntro"
  | "notificationPermission"
  | "onboardingComplete"
  | "login"
  | "signup"
  | "selectRole"
  | "createProfile"
  | "emergencyContacts"
  | "elderDashboard"
  | "notifications"
  | "guardianDashboard"
  | "sos"
  | "medicines"
  | "medicationHistory"
  | "tasks"
  | "taskDetails"
  | "taskHistory"
  | "addTask"
  | "mood"
  | "moodHistory"
  | "profile"
  | "settings"
  | "journal"
  | "memories"
  | "createMemory"
  | "memoryDetails"
  | "editMemory"
  | "emergencySafety"
  | "emergencySettings"
  | "emergencyHistory"
  | "emergencyDetails"
  | "editProfile"
  | "guardianInfo"
  | "connectGuardian"
  | "scanGuardianQr"
  | "guardianConnectionSuccess"
  | "notificationDetails"
  | "notificationSettings"
  | "accessibilitySettings"
  | "appSettings"
  | "aboutSithaMithuru"
  | "aboutAppInfo"
  | "aboutApp"
  | "privacyInfo"
  | "termsOfUse"
  | "openSourceLicenses"
  | "helpSupport"
  | "appUpdate"
  | "emergencySafetyGuide"
  | "testEmergencyDetection"
  | "guardianDetails"
  | "guardianConnectionConfirmation"
  | "guardianConnectionPending"
  | "guardianConnectionManagement"
  | "guardianConnectionRemoved"
  | "guardianNotificationPreferences"
  | "quietHours"
  | "languageSettings"
  | "textSize"
  | "highContrast"
  | "largerTouchTargets"
  | "reduceMotion"
  | "talkback"
  | "privacyData"
  | "dataUsage"
  | "guardianDataSharing"
  | "localData"
  | "deleteLocalData"
  | "localDataDeleted"
  | "howToUse"
  | "medicationHelp"
  | "emergencyHelp"
  | "guardianHelp"
  | "faq"
  | "contactSupport"
  | "guardianModeIntro"
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
  | "connectionSuccess"
  | "emergencyDetectionSettings"
  | "emergencyEventDetails"
  | "guardianInformation"
  | "guardianManagement"
  | "guardianNotifications"
  | "language"
  | "talkbackScreenReader"
  | "privacy"
  | "helpSupportMain"
  | "howToUseSithaMithuru"
  | "addElder";

type Role = "Elder" | "Guardian";

const App = () => {
  // Single source of truth for session persistence (SecureStore/AsyncStorage
  // writes) — see persistSession()/clearSession() below. currentScreen-driving
  // local state (authToken, userData, userRole) is kept as-is for the ~140
  // screen cases below; it's set at the same call sites as the context calls
  // so the two stay in lockstep without rewriting every screen render below.
  const {
    login: ctxLogin,
    logout: ctxLogout,
    biometricEnabled,
    enableBiometrics,
    authenticateWithBiometrics,
  } = useAuth();

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

  const handleStartupComplete = useCallback(async (result: import("./src/services/startupService").StartupResult) => {
    if (result.user) setUserData(result.user);
    if (result.token) setAuthToken(result.token);
    if (result.role) setUserRole(result.role);
    setSessionChecked(true);

    const restoredToDashboard = result.destination === "elderDashboard" || result.destination === "guardianDashboard";

    if (restoredToDashboard && result.token && result.user) {
      // Hydrate AuthContext with the session startupService.ts already
      // validated/restored, so useAuth() consumers elsewhere see a
      // consistent state (harmless idempotent re-write of the same
      // SecureStore keys startupService just read).
      await ctxLogin(result.role || "Elder", result.user, result.token, "");

      // Biometric app-lock gate: if the user has opted into biometric login
      // (SettingsScreen), require it to succeed before entering the
      // dashboard on a fresh cold start, instead of silently trusting the
      // restored session.
      if (biometricEnabled) {
        const ok = await authenticateWithBiometrics();
        if (!ok) {
          setCurrentScreen("login");
          return;
        }
      }
    }

    setCurrentScreen(result.destination as ScreenType);
  }, [ctxLogin, biometricEnabled, authenticateWithBiometrics]);

  // Delegates to AuthContext.login() — the single source of truth for
  // SecureStore/AsyncStorage session persistence. Previously this function
  // independently re-wrote the exact same storage keys AuthContext already
  // manages, so a future fix to AuthContext had zero effect on the app.
  const persistSession = async (token: string, refreshToken: string, user: any) => {
    await ctxLogin(user?.role || "Elder", user, token, refreshToken);
  };

  // Delegates to AuthContext.logout().
  const clearSession = async () => {
    await ctxLogout();
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
    // The role was already chosen on SignupScreen's own Elder/Guardian
    // toggle and sent to POST /auth/register — the account is created with
    // that role server-side. Previously this routed through SelectRoleScreen
    // again afterward, letting the user silently pick a DIFFERENT role that
    // only ever changed local state, never the server record (a real
    // client/server divergence bug). Go straight to profile completion for
    // the role that was actually registered.
    setUserRole(role);
    if (user) setUserData(user);
    if (token) setAuthToken(token);
    navigateTo("createProfile");
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
      // Elders get asked for microphone (SOS keyword detection) and
      // notification permissions right after their real account/profile is
      // created, instead of skipping straight to the dashboard.
      setCurrentScreen("permissionsIntro");
    } else {
      setCurrentScreen("guardianDashboard");
    }
  };

  // Final step after the post-signup Elder permissions chain
  // (permissionsIntro -> notificationPermission -> onboardingComplete).
  const handleOnboardingFinished = async (extra: { emergencyDetectorReady: boolean; notificationEnabled: boolean }) => {
    const updatedUser = { ...(userData || {}), ...extra, profileCompleted: true };
    setUserData(updatedUser);
    if (authToken) {
      await persistSession(authToken, "", updatedUser);
    }
    setNavHistory([]);
    setCurrentScreen("elderDashboard");
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
            onStartupComplete={handleStartupComplete}
          />
        );
      case "welcome":
        return (
          <WelcomeScreen
            onGetStarted={() => setCurrentScreen("languageSelection")}
          />
        );
      case "onboarding":
        // First-time entry point (Splash -> here when no saved session exists).
        // Real intro slides, then straight to Login (which links to Register)
        // — this used to render ElderProfileSetupScreen directly, silently
        // creating a local "session" and skipping real authentication
        // entirely. ElderProfileSetupScreen is still used correctly, just
        // AFTER a real signup — see handleProfileCompleted below.
        return (
          <OnboardingScreen
            onFinish={() => setCurrentScreen("login")}
          />
        );
      case "permissionsIntro":
        return (
          <PermissionsIntroScreen
            onFinishPermissions={({ micGranted }) => {
              setUserData((prev: any) => ({ ...(prev || {}), emergencyDetectorReady: micGranted }));
              setCurrentScreen("notificationPermission");
            }}
            onBack={goBack}
          />
        );
      case "notificationPermission":
        return (
          <NotificationPermissionScreen
            onFinish={(granted) => {
              setUserData((prev: any) => ({ ...(prev || {}), notificationEnabled: granted }));
              setCurrentScreen("onboardingComplete");
            }}
            onBack={goBack}
          />
        );
      case "onboardingComplete":
        return (
          <OnboardingCompleteScreen
            onGoToHome={() => {
              handleOnboardingFinished({
                emergencyDetectorReady: userData?.emergencyDetectorReady ?? true,
                notificationEnabled: userData?.notificationEnabled ?? true,
              });
            }}
            micGranted={userData?.emergencyDetectorReady !== false}
            notificationGranted={userData?.notificationEnabled !== false}
            userName={userData?.first_name || userData?.firstName}
          />
        );
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
          <ElderNavigator
            onLogout={handleLogout}
            onSessionExpired={handleSessionExpired}
            userData={userData}
            setUserData={setUserData}
            authToken={authToken}
            isOnline={isOnline}
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
      case "medicationHistory":
        return (
          <MedicationHistoryScreen
            onBack={goBack}
          />
        );
      case "notifications":
        return (
          <ElderNotificationsScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
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
      case "taskDetails":
        return (
          <TaskDetailsScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "taskHistory":
        return (
          <TaskHistoryScreen
            onBack={goBack}
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
      case "moodHistory":
        return (
          <MoodHistoryScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "memories":
        return (
          <MyMemoriesScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "createMemory":
        return (
          <CreateMemoryScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "memoryDetails":
        return (
          <MemoryDetailsScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "editMemory":
        return (
          <EditMemoryScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "emergencySafety":
        return (
          <EmergencySafetyScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "emergencySettings":
      case "emergencyDetectionSettings":
        return (
          <EmergencySettingsScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "emergencyHistory":
        return (
          <EmergencyHistoryScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "emergencyDetails":
      case "emergencyEventDetails":
        return (
          <EmergencyEventDetailsScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "guardianInfo":
      case "guardianInformation":
        return (
          <GuardianInfoScreen
            userData={userData}
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "guardianDetails":
        return (
          <GuardianDetailsScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "connectGuardian":
      case "connect":
        return (
          <ConnectGuardianScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "scanGuardianQr":
        return (
          <ScanGuardianQrScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "guardianConnectionConfirmation":
        return (
          <GuardianConnectionConfirmationScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "guardianConnectionPending":
        return (
          <GuardianConnectionPendingScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "guardianConnectionManagement":
      case "guardianManagement":
        return (
          <GuardianConnectionManagementScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "guardianConnectionRemoved":
        return (
          <GuardianConnectionRemovedScreen
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "guardianNotificationPreferences":
      case "guardianNotifications":
        return (
          <GuardianNotificationPreferencesScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "quietHours":
        return (
          <QuietHoursScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "languageSettings":
      case "language":
        return (
          <LanguageSettingsScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "textSize":
        return (
          <TextSizeScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "highContrast":
        return (
          <HighContrastScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "largerTouchTargets":
        return (
          <LargerTouchTargetsScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "reduceMotion":
        return (
          <ReduceMotionScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "talkback":
      case "talkbackScreenReader":
        return (
          <TalkBackScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "privacyData":
      case "privacy":
        return (
          <PrivacyDataScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "dataUsage":
        return (
          <DataUsageScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "guardianDataSharing":
        return (
          <GuardianDataSharingScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "localData":
        return (
          <LocalDataScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "deleteLocalData":
        return (
          <DeleteLocalDataScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "localDataDeleted":
        return (
          <LocalDataDeletedScreen
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "helpSupport":
      case "helpSupportMain":
        return (
          <HelpSupportMainScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "howToUse":
      case "howToUseSithaMithuru":
        return (
          <HowToUseSithaMithuruScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "medicationHelp":
        return (
          <MedicationHelpScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "emergencyHelp":
        return (
          <EmergencyHelpScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "guardianHelp":
        return (
          <GuardianHelpScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "faq":
        return (
          <FaqScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "contactSupport":
        return (
          <ContactSupportScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "guardianModeIntro":
        return (
          <GuardianModeIntroductionScreen
            onContinue={() => navigateTo("guardianNotifications")}
          />
        );
      case "guardianConnectionSuccess":
        return (
          <GuardianConnectionSuccessScreen
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "notificationDetails":
        return (
          <NotificationDetailsScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "notificationSettings":
        return (
          <NotificationSettingsScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "accessibilitySettings":
        return (
          <AccessibilitySettingsScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "appSettings":
        return (
          <AppSettingsScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "aboutSithaMithuru":
        return (
          <AboutSithaMithuruScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "aboutApp":
      case "aboutAppInfo":
        return (
          <AboutAppInfoScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "privacyInfo":
        return (
          <PrivacyInformationScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "termsOfUse":
        return (
          <TermsOfUseScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "openSourceLicenses":
        return (
          <OpenSourceLicensesScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "helpSupport":
        return (
          <HelpSupportScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "appUpdate":
        return (
          <AppUpdateScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
            isOnline={isOnline}
          />
        );
      case "emergencySafetyGuide":
        return (
          <EmergencySafetyGuideScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
          />
        );
      case "testEmergencyDetection":
        return (
          <TestEmergencyDetectionScreen
            onBack={goBack}
            onNavigate={(screen: string) => navigateTo(screen as ScreenType)}
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
            biometricEnabled={biometricEnabled}
            onEnableBiometrics={enableBiometrics}
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
            onContinue={() => setCurrentScreen("onboarding")}
            onBack={goBack}
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
            medication={{ id: "1", name: "Sample Med", time: "08:00 AM", taken: false }}
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
  <SafeAreaProvider>
    <AuthProvider>
      <SyncProvider>
        <App />
      </SyncProvider>
    </AuthProvider>
  </SafeAreaProvider>
);

export default AppContainer;
