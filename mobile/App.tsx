import React, { useState, useEffect } from "react";
import { SafeAreaView, StatusBar, useColorScheme, Alert } from "react-native";
import Toast from "react-native-toast-message";
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
import GuardianDashboard from "./src/screens/guardian/GuardianDashboard";
import ManageElder from "./src/screens/guardian/ManageElder";

type ScreenType =
  | "splash"
  | "onboarding"
  | "login"
  | "signup"
  | "elderDashboard"
  | "guardianDashboard"
  | "sos"
  | "medicines"
  | "tasks"
  | "mood"
  | "profile"
  | "settings"
  | "journal"
  | "editProfile"
  | "addTask"
  | "manageElder"
  | "forgotPassword";

type Role = "Elder" | "Guardian";

const App = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>("splash");
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    import("./src/database/db").then((db) => {
      db.initDB();
    });
  }, []);

  const handleAuthSuccess = (role: Role, user?: any) => {
    setUserRole(role);
    if (user) {
      setUserData(user);
    }
    if (role === "Elder") {
      setCurrentScreen("elderDashboard");
    } else {
      // Placeholder for Guardian Dashboard
      setCurrentScreen("guardianDashboard");
      console.log("Navigate to Guardian Dashboard");
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    setUserData(null);
    setCurrentScreen("login");
    Toast.show({
      type: "success",
      text1: "Logged Out",
      text2: "You have been successfully logged out.",
      position: "top",
    });
  };

  const navigateToDashboard = () => {
    // Return to appropriate dashboard
    if (userRole === "Elder") {
      setCurrentScreen("elderDashboard");
    } else {
      setCurrentScreen("guardianDashboard");
    }
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
        return <SplashScreen onFinish={() => setCurrentScreen("onboarding")} />;
      case "onboarding":
        return <OnboardingScreen onFinish={() => setCurrentScreen("login")} />;
      case "login":
        return (
          <LoginScreen
            onLoginPress={handleAuthSuccess}
            onRegisterPress={() => setCurrentScreen("signup")}
            onForgotPassword={() => setCurrentScreen("forgotPassword")}
          />
        );
      case "forgotPassword":
        return (
          <ForgotPasswordScreen
            onBack={() => setCurrentScreen("login")}
            onSendResetLink={(email) => {
              console.log("Reset link sent to:", email);
              Alert.alert("Success", "Reset link sent!");
              setCurrentScreen("login");
            }}
          />
        );
      case "signup":
        return (
          <SignupScreen
            onSignupPress={handleAuthSuccess}
            onLoginPress={() => setCurrentScreen("login")}
          />
        );
      case "elderDashboard":
        return (
          <ElderDashboardScreen
            onLogout={handleLogout}
            userName={userData?.name}
            userEmail={userData?.email}
            userInitials={getInitials(userData?.name)}
            onNavigate={(screen: string) =>
              setCurrentScreen(screen as ScreenType)
            }
          />
        );
      case "guardianDashboard":
        return (
          <GuardianDashboard
            onLogout={handleLogout}
            userName={userData?.name}
            userEmail={userData?.email}
            userInitials={getInitials(userData?.name)}
            onNavigate={(screen: string) =>
              setCurrentScreen(screen as ScreenType)
            }
          />
        );
      case "manageElder":
        return (
          <ManageElder
            onBack={navigateToDashboard}
            onNavigate={(screen: string) =>
              setCurrentScreen(screen as ScreenType)
            }
            userName={userData?.name || "Mr. Dumidu"}
          />
        );
      case "sos":
        return (
          <EmergencySOSScreen
            onBack={navigateToDashboard}
            onNavigate={(screen: string) =>
              setCurrentScreen(screen as ScreenType)
            }
          />
        );
      case "medicines":
        return (
          <MedicinesScreen
            onBack={navigateToDashboard}
            onNavigate={(screen: string) =>
              setCurrentScreen(screen as ScreenType)
            }
          />
        );
      case "tasks":
        return (
          <TasksScreen
            onBack={navigateToDashboard}
            onNavigate={(screen: string) =>
              setCurrentScreen(screen as ScreenType)
            }
          />
        );
      case "mood":
        return (
          <MoodScreen
            onBack={navigateToDashboard}
            onNavigate={(screen: string) =>
              setCurrentScreen(screen as ScreenType)
            }
          />
        );
      case "profile":
        return (
          <ProfileScreen
            userData={userData}
            onBack={navigateToDashboard}
            onNavigate={(screen: string) =>
              setCurrentScreen(screen as ScreenType)
            }
          />
        );
      case "settings":
        return (
          <SettingsScreen
            onBack={navigateToDashboard}
            onLogout={handleLogout}
            onNavigate={(screen: string) =>
              setCurrentScreen(screen as ScreenType)
            }
          />
        );
      case "journal":
        return (
          <JournalScreen
            onBack={navigateToDashboard}
            onNavigate={(screen: string) =>
              setCurrentScreen(screen as ScreenType)
            }
          />
        );
      case "editProfile":
        return (
          <EditProfileScreen
            userData={userData}
            onBack={() => setCurrentScreen("profile")}
            onNavigate={(screen: string) =>
              setCurrentScreen(screen as ScreenType)
            }
            onSave={(updatedUser) => {
              setUserData(updatedUser);
              setCurrentScreen("profile");
            }}
          />
        );
      case "addTask":
        return (
          <AddTaskScreen
            onBack={() => setCurrentScreen("tasks")}
            onNavigate={(screen) => setCurrentScreen(screen as ScreenType)}
            onSave={(task) => {
              console.log("New Task:", task);
              // Global state update would happen here
              setCurrentScreen("tasks");
            }}
          />
        );
      default:
        return <SplashScreen onFinish={() => setCurrentScreen("onboarding")} />;
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

export default App;
