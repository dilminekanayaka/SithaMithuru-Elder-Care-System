/**
 * ElderNavigator.tsx
 *
 * Encapsulates all Elder-mode screen navigation into a modular, self-contained navigator.
 * App.tsx renders <ElderNavigator> when userRole === "Elder", removing monolithic switch-case
 * routing from App.tsx while providing consistent navigation history and back-button support.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { BackHandler } from 'react-native';
import * as Notifications from 'expo-notifications';

import OfflineBanner from '../components/OfflineBanner';
import ElderDashboardScreen from '../screens/Elder/ElderDashboardScreen';
import EmergencySOSScreen from '../screens/Elder/EmergencySOSScreen';
import MedicinesScreen from '../screens/Elder/MedicinesScreen';
import MedicationHistoryScreen from '../screens/Elder/MedicationHistoryScreen';
import TasksScreen from '../screens/Elder/TasksScreen';
import TaskDetailsScreen from '../screens/Elder/TaskDetailsScreen';
import TaskHistoryScreen from '../screens/Elder/TaskHistoryScreen';
import AddTaskScreen from '../screens/Elder/AddTaskScreen';
import MoodScreen from '../screens/Elder/MoodScreen';
import MoodHistoryScreen from '../screens/Elder/MoodHistoryScreen';
import ProfileScreen from '../screens/Elder/ProfileScreen';
import SettingsScreen from '../screens/Elder/SettingsScreen';
import JournalScreen from '../screens/Elder/JournalScreen';
import MyMemoriesScreen from '../screens/Elder/MyMemoriesScreen';
import CreateMemoryScreen from '../screens/Elder/CreateMemoryScreen';
import MemoryDetailsScreen from '../screens/Elder/MemoryDetailsScreen';
import EditMemoryScreen from '../screens/Elder/EditMemoryScreen';
import EmergencySafetyScreen from '../screens/Elder/EmergencySafetyScreen';
import EmergencySettingsScreen from '../screens/Elder/EmergencySettingsScreen';
import EmergencyHistoryScreen from '../screens/Elder/EmergencyHistoryScreen';
import EmergencyEventDetailsScreen from '../screens/Elder/EmergencyEventDetailsScreen';
import EditProfileScreen from '../screens/Elder/EditProfileScreen';
import GuardianInfoScreen from '../screens/Elder/GuardianInfoScreen';
import ConnectGuardianScreen from '../screens/Elder/ConnectGuardianScreen';
import ScanGuardianQrScreen from '../screens/Elder/ScanGuardianQrScreen';
import GuardianConnectionSuccessScreen from '../screens/Elder/GuardianConnectionSuccessScreen';
import ElderNotificationsScreen from '../screens/Elder/ElderNotificationsScreen';
import NotificationDetailsScreen from '../screens/Elder/NotificationDetailsScreen';
import NotificationSettingsScreen from '../screens/Elder/NotificationSettingsScreen';
import AccessibilitySettingsScreen from '../screens/Elder/AccessibilitySettingsScreen';
import AppSettingsScreen from '../screens/Elder/AppSettingsScreen';
import AboutSithaMithuruScreen from '../screens/Elder/AboutSithaMithuruScreen';
import AboutAppInfoScreen from '../screens/Elder/AboutAppInfoScreen';
import PrivacyInformationScreen from '../screens/Elder/PrivacyInformationScreen';
import TermsOfUseScreen from '../screens/Elder/TermsOfUseScreen';
import OpenSourceLicensesScreen from '../screens/Elder/OpenSourceLicensesScreen';
import HelpSupportScreen from '../screens/Elder/HelpSupportScreen';
import AppUpdateScreen from '../screens/Elder/AppUpdateScreen';
import EmergencySafetyGuideScreen from '../screens/Elder/EmergencySafetyGuideScreen';
import TestEmergencyDetectionScreen from '../screens/Elder/TestEmergencyDetectionScreen';
import GuardianDetailsScreen from '../screens/Elder/GuardianDetailsScreen';
import GuardianConnectionConfirmationScreen from '../screens/Elder/GuardianConnectionConfirmationScreen';
import GuardianConnectionPendingScreen from '../screens/Elder/GuardianConnectionPendingScreen';
import GuardianConnectionManagementScreen from '../screens/Elder/GuardianConnectionManagementScreen';
import GuardianConnectionRemovedScreen from '../screens/Elder/GuardianConnectionRemovedScreen';
import GuardianNotificationPreferencesScreen from '../screens/Elder/GuardianNotificationPreferencesScreen';
import QuietHoursScreen from '../screens/Elder/QuietHoursScreen';
import LanguageSettingsScreen from '../screens/Elder/LanguageSettingsScreen';
import TextSizeScreen from '../screens/Elder/TextSizeScreen';
import HighContrastScreen from '../screens/Elder/HighContrastScreen';
import LargerTouchTargetsScreen from '../screens/Elder/LargerTouchTargetsScreen';
import ReduceMotionScreen from '../screens/Elder/ReduceMotionScreen';
import TalkBackScreen from '../screens/Elder/TalkBackScreen';
import PrivacyDataScreen from '../screens/Elder/PrivacyDataScreen';
import DataUsageScreen from '../screens/Elder/DataUsageScreen';
import GuardianDataSharingScreen from '../screens/Elder/GuardianDataSharingScreen';
import LocalDataScreen from '../screens/Elder/LocalDataScreen';
import DeleteLocalDataScreen from '../screens/Elder/DeleteLocalDataScreen';
import LocalDataDeletedScreen from '../screens/Elder/LocalDataDeletedScreen';
import HelpSupportMainScreen from '../screens/Elder/HelpSupportMainScreen';
import HowToUseSithaMithuruScreen from '../screens/Elder/HowToUseSithaMithuruScreen';
import MedicationHelpScreen from '../screens/Elder/MedicationHelpScreen';
import EmergencyHelpScreen from '../screens/Elder/EmergencyHelpScreen';
import GuardianHelpScreen from '../screens/Elder/GuardianHelpScreen';
import FaqScreen from '../screens/Elder/FaqScreen';
import ContactSupportScreen from '../screens/Elder/ContactSupportScreen';
import GuardianModeIntroductionScreen from '../screens/Elder/GuardianModeIntroductionScreen';
import AddMedicationScreen from '../screens/Elder/AddMedicationScreen';
import MedicationDetailsScreen from '../screens/Elder/MedicationDetailsScreen';
import EditMedicationScreen from '../screens/Elder/EditMedicationScreen';
import GuardianManagementScreen from '../screens/Elder/GuardianManagementScreen';
import EmergencyContactsScreen from '../screens/Elder/EmergencyContactsScreen';

export type ElderScreen =
  | 'elderDashboard'
  | 'sos'
  | 'medicines'
  | 'medicationHistory'
  | 'tasks'
  | 'taskDetails'
  | 'taskHistory'
  | 'addTask'
  | 'mood'
  | 'moodHistory'
  | 'profile'
  | 'settings'
  | 'journal'
  | 'memories'
  | 'createMemory'
  | 'memoryDetails'
  | 'editMemory'
  | 'emergencySafety'
  | 'emergencySettings'
  | 'emergencyHistory'
  | 'emergencyEventDetails'
  | 'emergencyDetails'
  | 'editProfile'
  | 'guardianInfo'
  | 'connectGuardian'
  | 'scanGuardianQr'
  | 'guardianConnectionSuccess'
  | 'notifications'
  | 'notificationDetails'
  | 'notificationSettings'
  | 'accessibilitySettings'
  | 'appSettings'
  | 'aboutSithaMithuru'
  | 'aboutAppInfo'
  | 'aboutApp'
  | 'privacyInfo'
  | 'termsOfUse'
  | 'openSourceLicenses'
  | 'helpSupport'
  | 'appUpdate'
  | 'emergencySafetyGuide'
  | 'testEmergencyDetection'
  | 'guardianDetails'
  | 'guardianConnectionConfirmation'
  | 'guardianConnectionPending'
  | 'guardianConnectionManagement'
  | 'guardianConnectionRemoved'
  | 'guardianNotificationPreferences'
  | 'quietHours'
  | 'languageSettings'
  | 'textSize'
  | 'highContrast'
  | 'largerTouchTargets'
  | 'reduceMotion'
  | 'talkback'
  | 'privacyData'
  | 'dataUsage'
  | 'guardianDataSharing'
  | 'localData'
  | 'deleteLocalData'
  | 'localDataDeleted'
  | 'howToUse'
  | 'medicationHelp'
  | 'emergencyHelp'
  | 'guardianHelp'
  | 'faq'
  | 'contactSupport'
  | 'guardianModeIntro'
  | 'addMedicationElder'
  | 'medicationDetailsElder'
  | 'editMedicationElder'
  | 'reminderHistoryElder'
  | 'emergencyHistoryElder'
  | 'guardianManagementElder'
  | 'elderNotifications'
  | 'emergencyContacts'
  | 'emergencyDetectionSettings'
  | 'guardianInformation'
  | 'guardianManagement'
  | 'guardianNotifications'
  | 'language'
  | 'talkbackScreenReader'
  | 'privacy'
  | 'helpSupportMain'
  | 'howToUseSithaMithuru';

interface ElderNavigatorProps {
  onLogout: () => void;
  onSessionExpired: () => void;
  userData: any;
  setUserData: React.Dispatch<React.SetStateAction<any>>;
  authToken: string;
  isOnline: boolean;
}

const ElderNavigator: React.FC<ElderNavigatorProps> = ({
  onLogout,
  onSessionExpired,
  userData,
  setUserData,
  authToken,
  isOnline,
}) => {
  const [screen, setScreen] = useState<ElderScreen>('elderDashboard');
  const [navHistory, setNavHistory] = useState<ElderScreen[]>([]);
  const [currentUserData, setCurrentUserData] = useState(userData);
  const [selectedMedication, setSelectedMedication] = useState<{ id: string; name: string; dosage?: string; time: string; taken: boolean } | null>(null);
  const [selectedMemory, setSelectedMemory] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [selectedEmergencyEvent, setSelectedEmergencyEvent] = useState<any>(null);

  useEffect(() => {
    setCurrentUserData(userData);
  }, [userData]);

  const navigate = useCallback((s: string, params?: any) => {
    if (params) {
      if (params.medication) setSelectedMedication(params.medication);
      if (params.memory) setSelectedMemory(params.memory);
      if (params.task) setSelectedTask(params.task);
      if (params.notification) setSelectedNotification(params.notification);
      if (params.event) setSelectedEmergencyEvent(params.event);
    }
    setNavHistory((prev) => {
      if (prev[prev.length - 1] === screen) return prev;
      return [...prev, screen];
    });
    setScreen(s as ElderScreen);
  }, [screen]);

  const goBack = useCallback(() => {
    if (navHistory.length > 0) {
      const last = navHistory[navHistory.length - 1];
      setNavHistory((prev) => prev.slice(0, -1));
      setScreen(last);
      return true;
    } else if (screen !== 'elderDashboard') {
      setScreen('elderDashboard');
      return true;
    }
    return false;
  }, [navHistory, screen]);

  // Hardware Back Button Handler
  useEffect(() => {
    const onBackPress = () => goBack();
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [goBack]);

  // Push Notification Handler
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (typeof data?.screen === 'string') {
        navigate(data.screen);
      } else if (data?.type === 'emergency') {
        navigate('sos');
      } else if (data?.type === 'medication') {
        navigate('medicines');
      }
    });
    return () => subscription.remove();
  }, [navigate]);

  const getInitials = (name?: string) => {
    if (!name) return 'E';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handleBackVoid = () => {
    goBack();
  };

  const renderScreen = () => {
    switch (screen) {
      case 'elderDashboard':
        return (
          <ElderDashboardScreen
            onLogout={onLogout}
            userName={currentUserData?.name}
            userEmail={currentUserData?.email}
            userInitials={getInitials(currentUserData?.name)}
            elderId={currentUserData?.id}
            token={authToken}
            onNavigate={navigate}
          />
        );

      case 'sos':
        return (
          <EmergencySOSScreen
            onBack={handleBackVoid}
            onNavigate={navigate}
            elderId={currentUserData?.id}
            token={authToken}
            guardianPhone={currentUserData?.guardian_phone}
          />
        );

      case 'medicines':
        return (
          <MedicinesScreen
            elderId={currentUserData?.id}
            token={authToken}
            isOnline={isOnline}
            onBack={handleBackVoid}
            onNavigate={navigate}
            onViewMedication={(med) => {
              setSelectedMedication({ ...med, id: String(med.id) });
              navigate('medicationDetailsElder');
            }}
          />
        );

      case 'medicationHistory':
      case 'reminderHistoryElder':
        return <MedicationHistoryScreen onBack={handleBackVoid} elderId={currentUserData?.id} token={authToken} />;

      case 'tasks':
        return (
          <TasksScreen
            elderId={currentUserData?.id}
            token={authToken}
            isOnline={isOnline}
            onBack={handleBackVoid}
            onNavigate={navigate}
            onViewTask={(task) => setSelectedTask(task)}
          />
        );

      case 'taskDetails':
        return (
          <TaskDetailsScreen
            onBack={handleBackVoid}
            onNavigate={navigate}
            taskData={selectedTask}
            elderId={currentUserData?.id}
            token={authToken}
          />
        );

      case 'taskHistory':
        return <TaskHistoryScreen onBack={handleBackVoid} elderId={currentUserData?.id} token={authToken} />;

      case 'addTask':
        return <AddTaskScreen onBack={handleBackVoid} onNavigate={navigate} token={authToken} elderId={currentUserData?.id} />;

      case 'mood':
        return <MoodScreen onBack={handleBackVoid} onNavigate={navigate} elderId={currentUserData?.id} token={authToken} />;

      case 'moodHistory':
        return <MoodHistoryScreen onBack={handleBackVoid} onNavigate={navigate} elderId={currentUserData?.id} token={authToken} />;

      case 'profile':
        return <ProfileScreen onBack={handleBackVoid} onNavigate={navigate} userData={currentUserData} />;

      case 'settings':
        return <SettingsScreen onBack={handleBackVoid} onNavigate={navigate} onLogout={onLogout} />;

      case 'journal':
        return <JournalScreen onBack={handleBackVoid} onNavigate={navigate} token={authToken} elderId={currentUserData?.id} />;

      case 'memories':
        return (
          <MyMemoriesScreen
            onBack={handleBackVoid}
            onNavigate={navigate}
            elderId={currentUserData?.id}
            onViewMemory={(memory) => {
              setSelectedMemory(memory);
              navigate('memoryDetails');
            }}
          />
        );

      case 'createMemory':
        return <CreateMemoryScreen onBack={handleBackVoid} onNavigate={navigate} elderId={currentUserData?.id} />;

      case 'memoryDetails':
        return (
          <MemoryDetailsScreen
            onBack={handleBackVoid}
            onNavigate={navigate}
            memoryData={selectedMemory}
          />
        );

      case 'editMemory':
        return (
          <EditMemoryScreen
            onBack={handleBackVoid}
            onNavigate={navigate}
            memoryData={selectedMemory}
            onSave={(updated) => setSelectedMemory(updated)}
          />
        );

      case 'emergencySafety':
        return <EmergencySafetyScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'emergencySettings':
      case 'emergencyDetectionSettings':
        return <EmergencySettingsScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'emergencyHistory':
      case 'emergencyHistoryElder':
        return (
          <EmergencyHistoryScreen
            onBack={handleBackVoid}
            onNavigate={navigate}
            token={authToken}
            elderId={currentUserData?.id}
            onViewEvent={(event) => setSelectedEmergencyEvent(event)}
          />
        );

      case 'emergencyDetails':
      case 'emergencyEventDetails':
        return <EmergencyEventDetailsScreen onBack={handleBackVoid} onNavigate={navigate} eventData={selectedEmergencyEvent} />;

      case 'editProfile':
        return (
          <EditProfileScreen
            userData={currentUserData}
            token={authToken}
            onBack={handleBackVoid}
            onNavigate={navigate}
            onSave={async (updatedUser) => {
              const merged = { ...currentUserData, ...updatedUser };
              setCurrentUserData(merged);
              setUserData(merged);
              goBack();
            }}
          />
        );

      case 'guardianInfo':
      case 'guardianInformation':
        return <GuardianInfoScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'connectGuardian':
        return <ConnectGuardianScreen onBack={handleBackVoid} onNavigate={navigate} token={authToken} onSessionExpired={onSessionExpired} />;

      case 'scanGuardianQr':
        return <ScanGuardianQrScreen onBack={handleBackVoid} onNavigate={navigate} token={authToken} onSessionExpired={onSessionExpired} />;

      case 'guardianConnectionSuccess':
        return <GuardianConnectionSuccessScreen onNavigate={navigate} />;

      case 'notifications':
      case 'elderNotifications':
        return (
          <ElderNotificationsScreen
            onBack={handleBackVoid}
            onNavigate={navigate}
            elderId={currentUserData?.id}
            token={authToken}
            onViewNotification={(n) => setSelectedNotification(n)}
          />
        );

      case 'notificationDetails':
        return (
          <NotificationDetailsScreen
            onBack={handleBackVoid}
            onNavigate={navigate}
            notificationData={
              selectedNotification
                ? {
                    id: selectedNotification.id,
                    type: selectedNotification.type,
                    title: selectedNotification.title,
                    body: selectedNotification.body,
                    timeStr: selectedNotification.time,
                    statusText: selectedNotification.read ? undefined : 'New',
                    targetScreen: selectedNotification.targetScreen,
                    actionLabel: selectedNotification.actionLabel,
                  }
                : null
            }
          />
        );

      case 'notificationSettings':
      case 'guardianNotifications':
        return <NotificationSettingsScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'accessibilitySettings':
        return <AccessibilitySettingsScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'appSettings':
        return <AppSettingsScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'aboutSithaMithuru':
      case 'aboutApp':
        return <AboutSithaMithuruScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'aboutAppInfo':
        return <AboutAppInfoScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'privacyInfo':
        return <PrivacyInformationScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'termsOfUse':
        return <TermsOfUseScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'openSourceLicenses':
        return <OpenSourceLicensesScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'helpSupport':
        return <HelpSupportScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'helpSupportMain':
        return <HelpSupportMainScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'appUpdate':
        return <AppUpdateScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'emergencySafetyGuide':
        return <EmergencySafetyGuideScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'testEmergencyDetection':
        return <TestEmergencyDetectionScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'guardianDetails':
        return <GuardianDetailsScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'guardianConnectionConfirmation':
        return <GuardianConnectionConfirmationScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'guardianConnectionPending':
        return <GuardianConnectionPendingScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'guardianConnectionManagement':
      case 'guardianManagement':
      case 'guardianManagementElder':
        return <GuardianConnectionManagementScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'guardianConnectionRemoved':
        return <GuardianConnectionRemovedScreen onNavigate={navigate} />;

      case 'guardianNotificationPreferences':
        return <GuardianNotificationPreferencesScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'quietHours':
        return <QuietHoursScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'languageSettings':
      case 'language':
        return <LanguageSettingsScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'textSize':
        return <TextSizeScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'highContrast':
        return <HighContrastScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'largerTouchTargets':
        return <LargerTouchTargetsScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'reduceMotion':
        return <ReduceMotionScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'talkback':
      case 'talkbackScreenReader':
        return <TalkBackScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'privacyData':
      case 'privacy':
        return <PrivacyDataScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'dataUsage':
        return <DataUsageScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'guardianDataSharing':
        return <GuardianDataSharingScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'localData':
        return <LocalDataScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'deleteLocalData':
        return <DeleteLocalDataScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'localDataDeleted':
        return <LocalDataDeletedScreen onNavigate={navigate} />;

      case 'howToUse':
      case 'howToUseSithaMithuru':
        return <HowToUseSithaMithuruScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'medicationHelp':
        return <MedicationHelpScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'emergencyHelp':
        return <EmergencyHelpScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'guardianHelp':
        return <GuardianHelpScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'faq':
        return <FaqScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'contactSupport':
        return <ContactSupportScreen onBack={handleBackVoid} onNavigate={navigate} />;

      case 'guardianModeIntro':
        return <GuardianModeIntroductionScreen onContinue={() => navigate('guardianDashboard')} />;

      case 'addMedicationElder':
        return (
          <AddMedicationScreen
            token={authToken}
            elderId={currentUserData?.id}
            onBack={handleBackVoid}
            onSave={handleBackVoid}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'medicationDetailsElder':
        if (!selectedMedication) {
          goBack();
          return null;
        }
        return (
          <MedicationDetailsScreen
            medication={selectedMedication}
            token={authToken}
            elderId={currentUserData?.id}
            onBack={handleBackVoid}
            onUpdated={handleBackVoid}
            onEdit={() => navigate('editMedicationElder')}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'editMedicationElder':
        return (
          <EditMedicationScreen
            onBack={handleBackVoid}
            onSaveSuccess={handleBackVoid}
            onDeleteSuccess={handleBackVoid}
          />
        );

      case 'emergencyContacts':
        return <EmergencyContactsScreen onBack={handleBackVoid} token={authToken} elderId={currentUserData?.id} />;

      default:
        return (
          <ElderDashboardScreen
            onLogout={onLogout}
            userName={currentUserData?.name}
            userEmail={currentUserData?.email}
            userInitials={getInitials(currentUserData?.name)}
            elderId={currentUserData?.id}
            token={authToken}
            onNavigate={navigate}
          />
        );
    }
  };

  return (
    <>
      <OfflineBanner isOnline={isOnline} />
      {renderScreen()}
    </>
  );
};

export default ElderNavigator;
