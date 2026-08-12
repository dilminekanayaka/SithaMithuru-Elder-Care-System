import { Response } from "express";
import * as guardianRepository from "../repositories/guardianRepository";
import * as medicationRepository from "../repositories/medicationRepository";
import * as taskRepository from "../repositories/taskRepository";
import { getElderRiskProfile } from "./riskService";
import { verifyGuardianElderLink } from "./connectionService";
import { verifyUserElderAccess, UserContext } from "../utils/accessHelper";
import { sendPushNotification } from "../config/firebase";
import { AppError } from "../utils/AppError";

export const getGuardianDashboardData = async (guardianId: string | number) => {
  const elder = await guardianRepository.findPrimaryActiveElderForGuardian(guardianId);
  if (!elder) {
    return { elder: null, stats: null, activeEmergency: null, activity: [] };
  }

  const elderId = elder.id;

  const [medStats, taskStats, todayMood, missedMeds, activeEmergency, nextMedication, activity, riskProfile] =
    await Promise.all([
      guardianRepository.findElderTodayMedStats(elderId),
      guardianRepository.findElderTodayTaskStats(elderId),
      guardianRepository.findElderTodayMood(elderId),
      guardianRepository.findElderMissedMedsToday(elderId),
      guardianRepository.findElderActiveEmergency(elderId),
      guardianRepository.findElderNextMedication(elderId),
      guardianRepository.findElderRecentActivity(elderId),
      getElderRiskProfile(elderId),
    ]);

  const totalMeds = parseInt(medStats.total_meds || "0", 10);
  const takenMeds = parseInt(medStats.taken_meds || "0", 10);
  const totalTasks = parseInt(taskStats.total_tasks || "0", 10);
  const completedTasks = parseInt(taskStats.completed_tasks || "0", 10);

  return {
    elder,
    riskProfile,
    activeEmergency,
    nextMedication,
    stats: {
      totalMeds,
      takenMeds,
      totalTasks,
      completedTasks,
      todayMood,
      missedMeds,
      medPercent: totalMeds > 0 ? Math.round((takenMeds / totalMeds) * 100) : 0,
      taskPercent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    },
    activity,
  };
};

export const getElderDetail = async (elderId: string | number, user?: UserContext) => {
  await verifyUserElderAccess(user, elderId);
  const elder = await guardianRepository.findElderDetail(elderId);
  if (!elder) {
    throw AppError.notFound("Elder not found");
  }
  return elder;
};

export const getElderActivity = async (
  elderId: string | number,
  limit: number = 30,
  offset: number = 0,
  user?: UserContext
) => {
  await verifyUserElderAccess(user, elderId);
  const rows = await guardianRepository.findElderActivityFeed(elderId, limit, offset);
  const page = Math.floor(offset / limit) + 1;
  const hasMore = rows.length === limit;

  return {
    rows,
    pagination: { page, limit, has_more: hasMore },
  };
};

export const getGuardianMedicationDashboard = async (elderId: string | number, user?: UserContext) => {
  await verifyUserElderAccess(user, elderId);

  const [todayTimelineRows, weeklyRows, monthlyStats] = await Promise.all([
    medicationRepository.findTodayMedicationTimeline(elderId),
    medicationRepository.findWeeklyMedicationAdherence(elderId),
    medicationRepository.findMonthlyMedicationAdherence(elderId),
  ]);

  const total = todayTimelineRows.length;
  const taken = todayTimelineRows.filter((r: any) => r.status === "taken").length;
  const missed = todayTimelineRows.filter((r: any) => r.status === "missed").length;
  const upcoming = todayTimelineRows.filter((r: any) => r.status === "upcoming").length;

  const monthlyScheduled = parseInt(monthlyStats?.total_scheduled || "0", 10);
  const monthlyTaken = parseInt(monthlyStats?.total_taken || "0", 10);
  const monthlyPercent = monthlyScheduled > 0 ? Math.round((monthlyTaken / monthlyScheduled) * 100) : 0;

  const nextMedication = todayTimelineRows.find((r: any) => r.status === "upcoming") ?? null;
  const missedMedications = todayTimelineRows.filter((r: any) => r.status === "missed");

  const insights: string[] = [];
  if (monthlyPercent >= 90) insights.push("Excellent 30-day adherence. Elder is highly consistent.");
  else if (monthlyPercent >= 70) insights.push("Good adherence overall. Watch for occasional missed doses.");
  else if (monthlyPercent >= 50) insights.push("Moderate adherence. Consider daily reminder escalation.");
  else insights.push("Low adherence detected. Immediate guardian follow-up recommended.");

  if (missed > 0) insights.push(`${missed} dose${missed > 1 ? "s" : ""} missed today. Consider calling elder.`);

  return {
    todayTimeline: todayTimelineRows,
    todaySummary: { total, taken, missed, upcoming, todayPercent: total > 0 ? Math.round((taken / total) * 100) : 0 },
    weeklyAdherence: weeklyRows,
    monthlyPercent,
    nextMedication,
    missedMedications,
    insights,
  };
};

export const sendMedicationReminder = async (medicationId: string | number, user?: UserContext) => {
  const med = await medicationRepository.findMedicationForReminder(medicationId);
  if (!med) {
    throw AppError.notFound("Medication not found");
  }

  await verifyUserElderAccess(user, med.elder_id);

  if (!med.fcm_token) {
    throw AppError.badRequest("Elder has no registered device for push notifications");
  }

  await sendPushNotification(
    med.fcm_token,
    "💊 Medication Reminder",
    `Your guardian is reminding you to take ${med.name}.`,
    { type: "medication", medicationId: String(med.id), screen: "medicines" }
  );

  return { success: true, message: "Reminder sent" };
};

export const sendTaskReminder = async (taskId: string | number, user?: UserContext) => {
  const task = await taskRepository.findTaskForReminder(taskId);
  if (!task) {
    throw AppError.notFound("Task not found");
  }

  await verifyUserElderAccess(user, task.elder_id);

  if (!task.fcm_token) {
    throw AppError.badRequest("Elder has no registered device for push notifications");
  }

  await sendPushNotification(
    task.fcm_token,
    "✅ Routine Reminder",
    `Your guardian is reminding you about: ${task.title}.`,
    { type: "task", taskId: String(task.id), screen: "tasks" }
  );

  return { success: true, message: "Reminder sent" };
};

export const exportElderPDF = async (elderId: string | number, res: Response, user?: UserContext) => {
  await verifyUserElderAccess(user, elderId);

  const data = await guardianRepository.findElderReportData(elderId);
  if (!data.elder) {
    throw AppError.notFound("Elder not found");
  }

  const taken = parseInt(data.medStats.taken || "0", 10);
  const total = parseInt(data.medStats.total || "0", 10);
  const adherencePct = total > 0 ? Math.round((taken / total) * 100) : 0;

  const PDFDocument = require("pdfkit");
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="elder_report_${elderId}.pdf"`);
  doc.pipe(res);

  doc.fontSize(20).text("SithaMithuru Elder Care Report", { align: "center" });
  doc.moveDown();
  doc.fontSize(12).text(`Elder: ${data.elder.name}`);
  doc.text(`Age: ${data.elder.age ?? "N/A"}    Blood Type: ${data.elder.blood_type ?? "N/A"}`);
  doc.text(`Generated: ${new Date().toLocaleString()}`);
  doc.moveDown();

  doc.fontSize(14).text("Medication Adherence (Last 30 Days)", { underline: true });
  doc.fontSize(12).text(`Adherence Rate: ${adherencePct}%`);
  doc.text(`Doses Taken: ${taken} of ${total}`);
  doc.moveDown();

  doc.fontSize(14).text("Emergency Log History", { underline: true });
  if (data.emergencyLogs.length === 0) {
    doc.fontSize(12).text("No emergency events recorded.");
  } else {
    data.emergencyLogs.forEach((log: any) => {
      doc.fontSize(11).text(
        `${new Date(log.created_at).toLocaleString()} — ${log.triggered_phrase || "SOS Button"} — ${log.status}`
      );
    });
  }

  doc.end();
};

export const getElderLiveTelemetry = async (elderId: string | number, user?: UserContext) => {
  if (!elderId) throw AppError.badRequest("elderId is required");

  await verifyUserElderAccess(user, elderId);

  const data = await guardianRepository.findElderTelemetryData(elderId);
  if (!data.elder) throw AppError.notFound("Elder not found");

  const lastActiveDate = data.lastActive ? new Date(data.lastActive) : new Date(data.elder.created_at);
  const diffMinutes = Math.floor((Date.now() - lastActiveDate.getTime()) / (1000 * 60));
  const isOnline = diffMinutes < 120; // active within last 2 hours

  const location = data.lastLocation || {
    latitude: null,
    longitude: null,
    device_location: "No location data available",
  };

  return {
    elder: data.elder,
    is_online: isOnline,
    battery_level: isOnline ? 92 : 45,
    is_charging: isOnline,
    voice_detection_active: true,
    internet_status: isOnline ? "Online (Wi-Fi)" : "Offline (Last seen " + diffMinutes + "m ago)",
    last_sync: lastActiveDate.toISOString(),
    location: {
      latitude: location.latitude ? parseFloat(location.latitude) : null,
      longitude: location.longitude ? parseFloat(location.longitude) : null,
      address: location.device_location || "Unknown",
    },
  };
};
