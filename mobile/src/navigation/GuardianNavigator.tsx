/**
 * GuardianNavigator.tsx
 *
 * Isolates all Guardian-mode screen navigation into a self-contained component.
 * App.tsx simply renders <GuardianNavigator> for any guardian user — all internal
 * routing is handled here, keeping App.tsx clean and scalable.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { BackHandler } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import * as Notifications from 'expo-notifications';

import GuardianDashboard from '../screens/guardian/GuardianDashboard';
import GuardianMedicationDashboard from '../screens/guardian/GuardianMedicationDashboard';
import ManageElder from '../screens/guardian/ManageElder';
import AddMedicationScreen from '../screens/guardian/AddMedicationScreen';
import GuardianEditMedicationScreen from '../screens/guardian/GuardianEditMedicationScreen';
import ElderActivityScreen from '../screens/guardian/ElderActivityScreen';
import GuardianProfileScreen from '../screens/guardian/GuardianProfileScreen';
import GuardianSettingsScreen from '../screens/guardian/GuardianSettingsScreen';
import GuardianNotificationsScreen from '../screens/guardian/GuardianNotificationsScreen';
import EmergencyAlertsScreen from '../screens/guardian/EmergencyAlertsScreen';
import EmergencyDetailsScreen from '../screens/guardian/EmergencyDetailsScreen';
import ReportsScreen from '../screens/guardian/ReportsScreen';
import PendingRequestsScreen from '../screens/PendingRequestsScreen';
import ConnectionSuccessScreen from '../screens/ConnectionSuccessScreen';
import ConnectScreen from '../screens/ConnectScreen';
import AnalyticsSummaryScreen from '../screens/guardian/AnalyticsSummaryScreen';
import ElderOverviewScreen from '../screens/guardian/ElderOverviewScreen';
import GuardianElderJournalScreen from '../screens/guardian/GuardianElderJournalScreen';
import EmergencyHistoryScreen from '../screens/Elder/EmergencyHistoryScreen';
import MyEldersScreen from '../screens/guardian/MyEldersScreen';
import AddElderScreen from '../screens/guardian/AddElderScreen';
import PreparingDashboardScreen from '../screens/guardian/PreparingDashboardScreen';
import RiskDashboardScreen from '../screens/guardian/RiskDashboardScreen';
import GuardianWelcomeScreen from '../screens/guardian/GuardianWelcomeScreen';
import LiveMonitoringScreen from '../screens/guardian/LiveMonitoringScreen';
import GuardianMedicationDetailsScreen from '../screens/guardian/GuardianMedicationDetailsScreen';
import GuardianMedicationHistoryScreen from '../screens/guardian/GuardianMedicationHistoryScreen';
import GuardianTaskDashboardScreen from '../screens/guardian/GuardianTaskDashboardScreen';
import GuardianMoodDashboardScreen from '../screens/guardian/GuardianMoodDashboardScreen';
import GuardianEmergencyContactsScreen from '../screens/guardian/GuardianEmergencyContactsScreen';
import GuardianNotificationSettingsScreen from '../screens/guardian/GuardianNotificationSettingsScreen';
import GuardianHelpSupportScreen from '../screens/guardian/GuardianHelpSupportScreen';
import GuardianAboutScreen from '../screens/guardian/GuardianAboutScreen';
import GuardianTodaysMedicationScreen from '../screens/guardian/GuardianTodaysMedicationScreen';
import GuardianMissedMedicationScreen from '../screens/guardian/GuardianMissedMedicationScreen';
import GuardianMedicationAnalyticsScreen from '../screens/guardian/GuardianMedicationAnalyticsScreen';
import GuardianTodaysRoutineScreen from '../screens/guardian/GuardianTodaysRoutineScreen';
import GuardianRoutineDetailsScreen from '../screens/guardian/GuardianRoutineDetailsScreen';
import GuardianRoutineHistoryScreen from '../screens/guardian/GuardianRoutineHistoryScreen';
import GuardianRoutineAlertsScreen from '../screens/guardian/GuardianRoutineAlertsScreen';
import GuardianRoutineAnalyticsScreen from '../screens/guardian/GuardianRoutineAnalyticsScreen';
import GuardianTodaysWellbeingScreen from '../screens/guardian/GuardianTodaysWellbeingScreen';
import GuardianWellbeingCheckinDetailsScreen from '../screens/guardian/GuardianWellbeingCheckinDetailsScreen';
import GuardianWellbeingHistoryScreen from '../screens/guardian/GuardianWellbeingHistoryScreen';
import GuardianWellbeingAlertsScreen from '../screens/guardian/GuardianWellbeingAlertsScreen';
import GuardianWellbeingAnalyticsScreen from '../screens/guardian/GuardianWellbeingAnalyticsScreen';
import GuardianReminderDashboardScreen from '../screens/guardian/GuardianReminderDashboardScreen';
import GuardianReminderHistoryScreen from '../screens/guardian/GuardianReminderHistoryScreen';
import GuardianActivityDashboardScreen from '../screens/guardian/GuardianActivityDashboardScreen';
import GuardianActivityTimelineScreen from '../screens/guardian/GuardianActivityTimelineScreen';
import GuardianActivityDetailsScreen from '../screens/guardian/GuardianActivityDetailsScreen';
import GuardianNotificationDetailsScreen from '../screens/guardian/GuardianNotificationDetailsScreen';
import GuardianHealthOverviewScreen from '../screens/guardian/GuardianHealthOverviewScreen';
import GuardianEmergencyAnalyticsScreen from '../screens/guardian/GuardianEmergencyAnalyticsScreen';
import GuardianReportDetailsScreen from '../screens/guardian/GuardianReportDetailsScreen';
import OfflineBanner from '../components/OfflineBanner';

// ─── Screen type ──────────────────────────────────────────────────────────────
export type GuardianScreen =
  | 'guardianDashboard'
  | 'manageElder'
  | 'addMedication'
  | 'editMedication'
  | 'elderActivity'
  | 'guardianProfile'
  | 'guardianSettings'
  | 'guardianNotifications'
  | 'emergencyAlerts'
  | 'emergencyDetails'
  | 'reports'
  | 'pendingRequests'
  | 'connectionSuccess'
  | 'connect'
  | 'analyticsSummary'
  | 'elderOverview'
  | 'elderJournal'
  | 'emergencyHistory'
  | 'guardianMedication'
  | 'myElders'
  | 'addElder'
  | 'riskDashboard'
  | 'guardianWelcome'
  | 'liveMonitoring'
  | 'medicationDetails'
  | 'medicationHistory'
  | 'taskDashboard'
  | 'moodDashboard'
  | 'emergencyContacts'
  | 'notificationSettings'
  | 'helpSupport'
  | 'about'
  | 'todaysMedication'
  | 'missedMedication'
  | 'medicationAnalytics'
  | 'todaysRoutine'
  | 'routineDetails'
  | 'routineHistory'
  | 'routineAlerts'
  | 'routineAnalytics'
  | 'todaysWellbeing'
  | 'wellbeingCheckinDetails'
  | 'wellbeingHistory'
  | 'wellbeingAlerts'
  | 'wellbeingAnalytics'
  | 'reminderDashboard'
  | 'reminderHistory'
  | 'activityDashboard'
  | 'activityTimeline'
  | 'activityDetails'
  | 'notificationDetails'
  | 'healthOverview'
  | 'emergencyAnalytics'
  | 'reportDetails'
  | 'preparingDashboard';

interface GuardianNavigatorProps {
  onLogout: () => void;
  onSessionExpired: () => void;
  userData: any;
  authToken: string;
  isOnline: boolean;
}

const GuardianNavigator: React.FC<GuardianNavigatorProps> = ({
  onLogout,
  onSessionExpired,
  userData,
  authToken,
  isOnline,
}) => {
  const [screen, setScreen] = useState<GuardianScreen>('guardianDashboard');
  const [navHistory, setNavHistory] = useState<GuardianScreen[]>([]);
  const [selectedElderId, setSelectedElderId] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [selectedMedication, setSelectedMedication] = useState<any>(null);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [selectedMoodCheckInId, setSelectedMoodCheckInId] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [selectedReportParams, setSelectedReportParams] = useState<any>(null);
  const [currentUserData, setCurrentUserData] = useState(userData);

  // Phase 9 Audit: Lockscreen Push Notification Deep-Linking
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === 'emergency' || data?.alertId || data?.screen === 'emergencyAlerts') {
        if (data?.alertItem) {
          setSelectedAlert(data.alertItem);
          setScreen('emergencyDetails');
        } else {
          setScreen('emergencyAlerts');
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const navigate = useCallback((s: string, payload?: any) => {
    if (s === 'medicationDetails' && payload !== undefined) {
      setSelectedMedication(payload);
    }
    if (s === 'routineDetails' && payload !== undefined) {
      setSelectedRoutineId(String(payload));
    }
    if (s === 'wellbeingCheckinDetails' && payload !== undefined) {
      setSelectedMoodCheckInId(String(payload));
    }
    if (s === 'activityDetails' && payload !== undefined) {
      setSelectedActivity(payload);
    }
    if (s === 'notificationDetails' && payload !== undefined) {
      setSelectedNotification(payload);
    }
    if (s === 'reportDetails' && payload !== undefined) {
      setSelectedReportParams(payload);
    }
    setNavHistory((prev) => {
      if (prev[prev.length - 1] === screen) return prev;
      return [...prev, screen];
    });
    setScreen(s as GuardianScreen);
  }, [screen]);

  const goBack = useCallback(() => {
    if (navHistory.length > 0) {
      const last = navHistory[navHistory.length - 1];
      setNavHistory((prev) => prev.slice(0, -1));
      setScreen(last);
      return true;
    } else if (screen !== 'guardianDashboard') {
      setScreen('guardianDashboard');
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

  const getInitials = (name?: string) => {
    if (!name) return 'G';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const renderScreen = () => {
    switch (screen) {
      // ── Main Dashboard ──────────────────────────────────────────────────────
      case 'guardianDashboard':
        return (
          <GuardianDashboard
            onLogout={onLogout}
            userName={currentUserData?.name}
            userEmail={currentUserData?.email}
            userInitials={getInitials(currentUserData?.name)}
            guardianId={currentUserData?.id}
            token={authToken}
            selectedElderId={selectedElderId}
            onSelectElder={(id) => setSelectedElderId(id)}
            onNavigate={navigate}
            onSessionExpired={onSessionExpired}
          />
        );

      // ── Guardian Medication Dashboard ───────────────────────────────────────
      case 'guardianMedication':
        return (
          <GuardianMedicationDashboard
            onBack={goBack}
            onNavigate={navigate}
            token={authToken}
            elderId={selectedElderId}
            onSelectElder={(id) => setSelectedElderId(id)}
            onSessionExpired={onSessionExpired}
          />
        );

      // ── Manage Elder ────────────────────────────────────────────────────────
      case 'manageElder':
        return (
          <ManageElder
            onBack={goBack}
            onNavigate={navigate}
            onEditMedication={(med) => {
              setSelectedMedication(med);
              navigate('editMedication');
            }}
            userName={currentUserData?.name}
            userInitials={getInitials(currentUserData?.name)}
            guardianId={currentUserData?.id}
            elderId={selectedElderId ?? undefined}
            token={authToken}
          />
        );

      // ── Add Medication ──────────────────────────────────────────────────────
      case 'addMedication':
        if (!selectedElderId) {
          goBack();
          return null;
        }
        return (
          <AddMedicationScreen
            onBack={goBack}
            token={authToken}
            elderId={selectedElderId}
            onSave={goBack}
          />
        );

      // ── Edit Medication ─────────────────────────────────────────────────────
      case 'editMedication':
        if (!selectedElderId || !selectedMedication) {
          goBack();
          return null;
        }
        return (
          <GuardianEditMedicationScreen
            onBack={goBack}
            token={authToken}
            medication={selectedMedication}
            onSaveSuccess={goBack}
            onDeleteSuccess={goBack}
            onSessionExpired={onSessionExpired}
          />
        );

      // ── Elder Activity ──────────────────────────────────────────────────────
      case 'elderActivity':
        return (
          <ElderActivityScreen
            onBack={goBack}
            token={authToken}
            elderId={selectedElderId}
            onNavigate={navigate}
          />
        );

      // ── Guardian Profile ────────────────────────────────────────────────────
      case 'guardianProfile':
        return (
          <GuardianProfileScreen
            onBack={goBack}
            onLogout={onLogout}
            onSessionExpired={onSessionExpired}
            userData={currentUserData}
            token={authToken}
            onSave={(updatedUser) => {
              setCurrentUserData({ ...updatedUser, role: 'Guardian' });
              goBack();
            }}
          />
        );

      // ── Guardian Settings ───────────────────────────────────────────────────
      case 'guardianSettings':
        return (
          <GuardianSettingsScreen
            onBack={goBack}
            onLogout={onLogout}
            onNavigate={navigate}
          />
        );

      // ── Guardian Notifications ──────────────────────────────────────────────
      case 'guardianNotifications':
        return (
          <GuardianNotificationsScreen
            onBack={goBack}
            token={authToken}
            guardianId={currentUserData?.id}
            onNavigate={(s: string, payload?: any) => navigate(s, payload)}
            onSessionExpired={onSessionExpired}
          />
        );

      // ── Connect Screen ──────────────────────────────────────────────────────
      case 'connect':
        return (
          <ConnectScreen
            onBack={goBack}
            token={authToken}
            userRole="Guardian"
          />
        );

      // ── Emergency Alerts ────────────────────────────────────────────────────
      case 'emergencyAlerts':
        return (
          <EmergencyAlertsScreen
            token={authToken}
            onBack={goBack}
            onSelectAlert={(alert) => {
              setSelectedAlert(alert);
              navigate('emergencyDetails');
            }}
            onSessionExpired={onSessionExpired}
          />
        );

      // ── Emergency Details ───────────────────────────────────────────────────
      case 'emergencyDetails':
        if (!selectedAlert) {
          goBack();
          return null;
        }
        return (
          <EmergencyDetailsScreen
            alertItem={selectedAlert}
            token={authToken}
            onBack={goBack}
            onResolved={goBack}
            onSessionExpired={onSessionExpired}
          />
        );

      // ── Reports Screen ──────────────────────────────────────────────────────
      case 'reports':
        return (
          <ReportsScreen
            token={authToken}
            onBack={goBack}
            elderId={selectedElderId ?? undefined}
            onNavigate={(s: string, payload?: any) => navigate(s, payload)}
            onSessionExpired={onSessionExpired}
          />
        );

      // ── Pending Requests ────────────────────────────────────────────────────
      case 'pendingRequests':
        return (
          <PendingRequestsScreen
            token={authToken}
            onBack={goBack}
            onAccepted={() => navigate('connectionSuccess')}
            onSessionExpired={onSessionExpired}
          />
        );

      // ── Connection Success ──────────────────────────────────────────────────
      case 'connectionSuccess':
        return (
          <ConnectionSuccessScreen
            connectedName="Elder"
            role="Guardian"
            onContinue={goBack}
          />
        );

      // ── Care Analytics Summary ──────────────────────────────────────────────
      case 'analyticsSummary':
        return (
          <AnalyticsSummaryScreen
            onBack={goBack}
          />
        );

      // ── Elder Overview Snapshot ─────────────────────────────────────────────
      case 'elderOverview':
        return (
          <ElderOverviewScreen
            onBack={goBack}
            onNavigate={(s) => navigate(s)}
            token={authToken}
            elderId={selectedElderId}
            onSessionExpired={onSessionExpired}
          />
        );

      // ── Elder Journal ───────────────────────────────────────────────────────
      case 'elderJournal':
        return (
          <GuardianElderJournalScreen
            elderId={selectedElderId ?? undefined}
            token={authToken}
            onBack={goBack}
            onNavigate={(s) => navigate(s)}
          />
        );

      // ── Emergency History ───────────────────────────────────────────────────
      case 'emergencyHistory':
        return (
          <EmergencyHistoryScreen
            token={authToken}
            elderId={selectedElderId ?? undefined}
            onBack={goBack}
          />
        );

      // ── My Elders List ──────────────────────────────────────────────────────
      case 'myElders':
        return (
          <MyEldersScreen
            token={authToken}
            onBack={goBack}
            onNavigate={(s) => navigate(s)}
            onSelectElder={(id) => setSelectedElderId(id)}
            onSessionExpired={onSessionExpired}
          />
        );

      // ── Add Elder (QR / Invite Code) ────────────────────────────────────────
      case 'addElder':
        return (
          <AddElderScreen
            token={authToken}
            onBack={goBack}
            onSessionExpired={onSessionExpired}
            onSuccess={() => navigate('preparingDashboard' as any)}
          />
        );

      // ── Preparing Care Dashboard Transition Screen ────────────────────────────
      case 'preparingDashboard':
        return (
          <PreparingDashboardScreen
            elderName="Your Elder"
            onFinish={() => navigate('guardianDashboard')}
          />
        );

      // ── Risk Dashboard (Green / Yellow / Red AI Health) ──────────────────────
      case 'riskDashboard':
        return (
          <RiskDashboardScreen
            token={authToken}
            elderId={selectedElderId}
            onBack={goBack}
            onNavigate={(s: string, payload?: any) => navigate(s, payload)}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'guardianWelcome':
        return (
          <GuardianWelcomeScreen
            onLogin={() => navigate('guardianDashboard')}
            onRegister={() => navigate('addElder')}
          />
        );

      case 'liveMonitoring':
        return (
          <LiveMonitoringScreen
            token={authToken}
            elderId={selectedElderId}
            onBack={goBack}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'medicationDetails':
        return (
          <GuardianMedicationDetailsScreen
            token={authToken}
            elderId={selectedElderId}
            medicationId={selectedMedication?.id ?? null}
            onBack={goBack}
            onNavigate={(s) => navigate(s)}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'medicationHistory':
        return (
          <GuardianMedicationHistoryScreen
            token={authToken}
            elderId={selectedElderId}
            onBack={goBack}
            onNavigate={(s: string, payload?: any) => navigate(s, payload)}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'todaysMedication':
        return (
          <GuardianTodaysMedicationScreen
            token={authToken}
            elderId={selectedElderId}
            onBack={goBack}
            onNavigate={(s: string, payload?: any) => navigate(s, payload)}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'missedMedication':
        return (
          <GuardianMissedMedicationScreen
            token={authToken}
            elderId={selectedElderId}
            onBack={goBack}
            onNavigate={(s: string, payload?: any) => navigate(s, payload)}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'medicationAnalytics':
        return (
          <GuardianMedicationAnalyticsScreen
            token={authToken}
            elderId={selectedElderId}
            onBack={goBack}
            onNavigate={(s: string, payload?: any) => navigate(s, payload)}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'todaysRoutine':
        return (
          <GuardianTodaysRoutineScreen
            token={authToken}
            elderId={selectedElderId}
            onBack={goBack}
            onNavigate={(s: string, payload?: any) => navigate(s, payload)}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'routineDetails':
        return (
          <GuardianRoutineDetailsScreen
            token={authToken}
            elderId={selectedElderId}
            routineId={selectedRoutineId ?? undefined}
            onBack={goBack}
            onNavigate={(s: string, payload?: any) => navigate(s, payload)}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'routineHistory':
        return (
          <GuardianRoutineHistoryScreen
            token={authToken}
            elderId={selectedElderId}
            onBack={goBack}
            onNavigate={(s: string, payload?: any) => navigate(s, payload)}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'routineAlerts':
        return (
          <GuardianRoutineAlertsScreen
            token={authToken}
            elderId={selectedElderId}
            onBack={goBack}
            onNavigate={(s: string, payload?: any) => navigate(s, payload)}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'routineAnalytics':
        return (
          <GuardianRoutineAnalyticsScreen
            token={authToken}
            elderId={selectedElderId}
            onBack={goBack}
            onNavigate={(s: string, payload?: any) => navigate(s, payload)}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'todaysWellbeing':
        return (
          <GuardianTodaysWellbeingScreen
            token={authToken}
            elderId={selectedElderId}
            onBack={goBack}
            onNavigate={(s: string, payload?: any) => navigate(s, payload)}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'wellbeingCheckinDetails':
        return (
          <GuardianWellbeingCheckinDetailsScreen
            token={authToken}
            elderId={selectedElderId}
            checkInId={selectedMoodCheckInId ?? undefined}
            onBack={goBack}
            onNavigate={(s: string, payload?: any) => navigate(s, payload)}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'wellbeingHistory':
        return (
          <GuardianWellbeingHistoryScreen
            token={authToken}
            elderId={selectedElderId}
            onBack={goBack}
            onNavigate={(s: string, payload?: any) => navigate(s, payload)}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'wellbeingAlerts':
        return (
          <GuardianWellbeingAlertsScreen
            token={authToken}
            elderId={selectedElderId}
            onBack={goBack}
            onNavigate={(s: string, payload?: any) => navigate(s, payload)}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'wellbeingAnalytics':
        return (
          <GuardianWellbeingAnalyticsScreen
            token={authToken}
            elderId={selectedElderId}
            onBack={goBack}
            onNavigate={(s: string, payload?: any) => navigate(s, payload)}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'reminderDashboard':
        return (
          <GuardianReminderDashboardScreen
            token={authToken}
            elderId={selectedElderId}
            onBack={goBack}
            onNavigate={(s: string, payload?: any) => navigate(s, payload)}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'reminderHistory':
        return (
          <GuardianReminderHistoryScreen
            token={authToken}
            elderId={selectedElderId}
            onBack={goBack}
            onNavigate={(s: string, payload?: any) => navigate(s, payload)}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'activityDashboard':
        return (
          <GuardianActivityDashboardScreen
            token={authToken}
            elderId={selectedElderId}
            onBack={goBack}
            onNavigate={(s: string, payload?: any) => navigate(s, payload)}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'activityTimeline':
        return (
          <GuardianActivityTimelineScreen
            token={authToken}
            elderId={selectedElderId}
            onBack={goBack}
            onNavigate={(s: string, payload?: any) => navigate(s, payload)}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'activityDetails':
        return (
          <GuardianActivityDetailsScreen
            token={authToken}
            elderId={selectedElderId}
            activity={selectedActivity}
            onBack={goBack}
            onNavigate={(s: string, payload?: any) => navigate(s, payload)}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'notificationDetails':
        return (
          <GuardianNotificationDetailsScreen
            token={authToken}
            notification={selectedNotification}
            onBack={goBack}
            onNavigate={(s: string, payload?: any) => navigate(s, payload)}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'healthOverview':
        return (
          <GuardianHealthOverviewScreen
            token={authToken}
            elderId={selectedElderId}
            onBack={goBack}
            onNavigate={(s: string, payload?: any) => navigate(s, payload)}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'emergencyAnalytics':
        return (
          <GuardianEmergencyAnalyticsScreen
            token={authToken}
            elderId={selectedElderId}
            onBack={goBack}
            onNavigate={(s) => navigate(s)}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'reportDetails':
        return (
          <GuardianReportDetailsScreen
            token={authToken}
            elderId={selectedElderId}
            reportType={selectedReportParams?.reportType}
            days={selectedReportParams?.days}
            onBack={goBack}
            onNavigate={(s: string, payload?: any) => navigate(s, payload)}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'taskDashboard':
        return (
          <GuardianTaskDashboardScreen
            token={authToken}
            elderId={selectedElderId}
            onBack={goBack}
            onNavigate={(s: string, payload?: any) => navigate(s, payload)}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'moodDashboard':
        return (
          <GuardianMoodDashboardScreen
            token={authToken}
            elderId={selectedElderId}
            onBack={goBack}
            onNavigate={(s: string, payload?: any) => navigate(s, payload)}
            onSessionExpired={onSessionExpired}
          />
        );

      case 'emergencyContacts':
        return <GuardianEmergencyContactsScreen onBack={goBack} />;

      case 'notificationSettings':
        return <GuardianNotificationSettingsScreen onBack={goBack} />;

      case 'helpSupport':
        return <GuardianHelpSupportScreen onBack={goBack} />;

      case 'about':
        return <GuardianAboutScreen onBack={goBack} />;

      default:
        return null;
    }
  };

  return (
    <>
      <OfflineBanner isOnline={isOnline} />
      {renderScreen()}
    </>
  );
};

export default GuardianNavigator;
