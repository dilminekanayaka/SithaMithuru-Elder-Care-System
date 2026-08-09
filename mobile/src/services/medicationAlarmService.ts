import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export interface MedicationAlarmItem {
  id: string;
  name: string;
  dosage?: string;
  form?: string;
  strength?: string;
  instructions?: string;
  times?: string[];
  time_schedule?: string;
  schedule_type?: string;
  schedule_values?: number[];
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

/**
 * Ensures notification permissions are granted before scheduling local alarms.
 */
export const ensureNotificationPermissions = async (): Promise<boolean> => {
  if (Platform.OS === "web") return false;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === "granted";
  } catch (error) {
    console.warn("⚠️ Could not check notification permissions:", error);
    return false;
  }
};

/**
 * Re-schedules all active medication reminders as local background alarms.
 * Works completely offline without requiring network connectivity.
 */
export const scheduleMedicationAlarms = async (medications: MedicationAlarmItem[]) => {
  if (Platform.OS === "web") return;

  const hasPermission = await ensureNotificationPermissions();
  if (!hasPermission) {
    console.warn("⚠️ Medication local alarms skipped: no notification permission.");
    return;
  }

  try {
    // Cancel existing scheduled medication notifications to prevent duplicates
    const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of allScheduled) {
      const data = notif.content.data;
      if (data && data.type === "MEDICATION_REMINDER") {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }

    let activeAlarmCount = 0;

    for (const med of medications) {
      if (med.is_active === false) continue;

      // Extract times array or fallback to single time_schedule
      const reminderTimes =
        med.times && med.times.length > 0
          ? med.times
          : med.time_schedule
          ? [med.time_schedule]
          : [];

      for (const timeStr of reminderTimes) {
        if (!timeStr || !timeStr.includes(":")) continue;

        const parts = timeStr.split(":");
        const hour = parseInt(parts[0], 10);
        const minute = parseInt(parts[1], 10);

        if (isNaN(hour) || isNaN(minute)) continue;

        const dosageText = [
          med.strength ? `${med.strength}` : null,
          med.dosage ? med.dosage : "Take your scheduled dose",
        ]
          .filter(Boolean)
          .join(" — ");

        const instructionsText = med.instructions ? `\nNote: ${med.instructions}` : "";

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `💊 Time for ${med.name}`,
            body: `${dosageText}${instructionsText}`,
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            data: {
              type: "MEDICATION_REMINDER",
              medicationId: med.id,
              medicationName: med.name,
              scheduledTime: timeStr,
            },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
          } as any,
        });

        activeAlarmCount++;
      }
    }

    console.log(`✅ Scheduled ${activeAlarmCount} local offline medication alarms successfully.`);
  } catch (error) {
    console.warn("⚠️ Failed to schedule medication alarms:", error);
  }
};

/**
 * Snoozes a medication reminder by scheduling a one-off notification in X minutes.
 */
export const snoozeMedicationAlarm = async (
  medicationName: string,
  scheduledTime: string,
  snoozeMinutes: number = 30
): Promise<boolean> => {
  if (Platform.OS === "web") return false;

  const hasPermission = await ensureNotificationPermissions();
  if (!hasPermission) return false;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏰ Snoozed Reminder: ${medicationName}`,
        body: `It has been ${snoozeMinutes} minutes since ${scheduledTime}. Time to take your medication!`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: {
          type: "MEDICATION_REMINDER",
          medicationName,
          snoozed: true,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: snoozeMinutes * 60,
      } as any,
    });

    console.log(`⏰ Snoozed local alarm for ${medicationName} (${snoozeMinutes}m)`);
    return true;
  } catch (error) {
    console.warn("⚠️ Failed to snooze medication alarm:", error);
    return false;
  }
};
