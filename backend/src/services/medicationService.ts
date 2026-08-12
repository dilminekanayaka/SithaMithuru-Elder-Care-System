import * as medicationRepository from "../repositories/medicationRepository";
import { MedicationInput } from "../repositories/medicationRepository";
import { verifyUserElderAccess, UserContext } from "../utils/accessHelper";
import { verifyGuardianElderLink } from "./connectionService";
import { AppError } from "../utils/AppError";

const getSessionLabel = (timeStr: string): string => {
  const hour = parseInt(timeStr.split(":")[0], 10);
  if (hour >= 4 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  return "Night";
};

export const getMedicationsByElder = async (elderId: string | number, user?: UserContext) => {
  if (user) {
    await verifyUserElderAccess(user, elderId);
  }

  const rawMeds = await medicationRepository.findMedicationsByElder(elderId);

  const sessionMap: Record<string, any> = {
    Morning: { id: "morning", title: "Morning", icon: "weather-sunny", color: "#FFB800", bgColor: "#FFFBE6", timeRange: "4:00 AM - 12:00 PM", medicines: [] },
    Afternoon: { id: "afternoon", title: "Afternoon", icon: "weather-partly-cloudy", color: "#2D8CFF", bgColor: "#E6F0FF", timeRange: "12:00 PM - 5:00 PM", medicines: [] },
    Night: { id: "night", title: "Night", icon: "weather-night", color: "#6C63FF", bgColor: "#F2E6FF", timeRange: "5:00 PM - 3:59 AM", medicines: [] },
  };

  rawMeds.forEach((med: any) => {
    const session = getSessionLabel(med.time_schedule);
    sessionMap[session].medicines.push({
      id: med.id,
      name: med.name,
      dosage: med.dosage,
      time: med.time_schedule,
      taken: med.taken,
      form: med.form,
      strength: med.strength,
      instructions: med.instructions,
      schedule_type: med.schedule_type,
      schedule_values: med.schedule_values,
      times: med.times && Array.isArray(med.times) && med.times.length > 0 ? med.times : [med.time_schedule],
      start_date: med.start_date,
      end_date: med.end_date,
      category: med.category,
      is_active: med.is_active,
      icon: med.form === "LIQUID" ? "bottle-tonic-plus" : med.form === "INJECTION" ? "needle" : med.form === "DROPS" ? "eyedropper" : "pill",
    });
  });

  const sessions = Object.values(sessionMap).filter((s) => s.medicines.length > 0);
  const totalMeds = rawMeds.length;
  const takenMeds = rawMeds.filter((m: any) => m.taken).length;

  return { sessions, totalMeds, takenMeds, rawMedications: rawMeds };
};

export const getMedicationsForGuardianView = async (elderId: string | number, guardianId: string | number) => {
  await verifyGuardianElderLink(guardianId, elderId);
  return medicationRepository.findMedicationsByElderWithCreator(elderId);
};

export const createMedication = async (data: MedicationInput, user?: UserContext) => {
  if (user) {
    await verifyUserElderAccess(user, data.elder_id);
  }
  return medicationRepository.createMedication(data);
};

export const updateMedication = async (id: string | number, data: Partial<MedicationInput>, user?: UserContext) => {
  const elderId = await medicationRepository.findMedicationElderId(id);
  if (!elderId) throw AppError.notFound("Medication not found or inactive");

  if (user) {
    await verifyUserElderAccess(user, elderId);
  }

  const updated = await medicationRepository.updateMedication(id, data);
  if (!updated) throw AppError.notFound("Medication not found or inactive");
  return updated;
};

export const deleteMedication = async (id: string | number, user?: UserContext) => {
  const elderId = await medicationRepository.findMedicationElderId(id);
  if (!elderId) throw AppError.notFound("Medication not found");

  if (user) {
    await verifyUserElderAccess(user, elderId);
  }

  const archived = await medicationRepository.archiveMedication(id);
  if (!archived) throw AppError.notFound("Medication not found");
  return { message: "Medication archived safely" };
};

export const logMedication = async (logData: {
  medicationId: string | number;
  elderId: string | number;
  takenStatus: boolean;
  status: string;
  scheduledTime?: string | null;
  clientUpdatedAt?: Date;
}, user?: UserContext) => {
  if (user) {
    await verifyUserElderAccess(user, logData.elderId);
  }
  return medicationRepository.upsertMedicationLog(logData);
};

export const getUpcomingMedications = async (elderId: string | number, user?: UserContext) => {
  if (user) {
    await verifyUserElderAccess(user, elderId);
  }
  return medicationRepository.findUpcomingMedications(elderId);
};

export const getTodayTimeline = async (elderId: string | number, user?: UserContext) => {
  if (user) {
    await verifyUserElderAccess(user, elderId);
  }
  return medicationRepository.findTodayMedicationTimeline(elderId);
};

export const getMedicationHistory = async (elderId: string | number, days: number = 30, user?: UserContext) => {
  if (user) {
    await verifyUserElderAccess(user, elderId);
  }
  return medicationRepository.findMedicationHistory(elderId, days);
};

export const getMedicationAdherenceStats = async (elderId: string | number, user?: UserContext) => {
  if (user) {
    await verifyUserElderAccess(user, elderId);
  }
  const [weekly, monthly] = await Promise.all([
    medicationRepository.findWeeklyMedicationAdherence(elderId),
    medicationRepository.findMonthlyMedicationAdherence(elderId),
  ]);

  const total = parseInt(monthly?.total_scheduled || "0", 10);
  const taken = parseInt(monthly?.total_taken || "0", 10);
  const monthlyAdherencePct = total > 0 ? Math.round((taken / total) * 100) : 0;

  return { weekly, monthly: { total, taken, adherencePct: monthlyAdherencePct } };
};

export const getDictionary = () => medicationRepository.getMedicationDictionary();
