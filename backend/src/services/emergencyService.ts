import * as emergencyRepository from "../repositories/emergencyRepository";
import { EmergencyInput } from "../repositories/emergencyRepository";
import { verifyGuardianElderLink } from "./connectionService";
import { getIo } from "../utils/ioProvider";
import { sendPushNotification } from "../config/firebase";
import { logger } from "../utils/logger";
import { AppError } from "../utils/AppError";

type UserContext = { id: string | number; role: string };

export const notifyGuardiansOfEmergency = async (elderId: string | number, log: any) => {
  const { elderName, guardianIds } = await emergencyRepository.findLinkedGuardianUserIds(elderId);

  const io = getIo();
  guardianIds.forEach((guardianId) => {
    io.to(guardianId.toString()).emit("sos:triggered", {
      elder_name: elderName,
      log,
    });
    logger.info(`[SOS] Emitted sos:triggered to room ${guardianId} for elder ${elderName}`);
  });

  if (guardianIds.length > 0) {
    const guardiansWithFcm = await emergencyRepository.findGuardianFcmTokens(guardianIds);
    guardiansWithFcm.forEach((guardian: any) => {
      sendPushNotification(
        guardian.fcm_token,
        "🚨 EMERGENCY SOS ALERT 🚨",
        `${elderName} triggered an emergency SOS! Tap to check GPS location.`,
        {
          elderId: elderId.toString(),
          logId: log.id.toString(),
          mapsUrl: log.maps_url || "",
          screen: "emergencyDetails",
        }
      );
    });
  }
};

export const triggerSOS = async (data: EmergencyInput, user?: UserContext) => {
  if (!data.elder_id) {
    throw AppError.badRequest("elder_id is required to trigger SOS");
  }

  if (user && user.role === "Elder" && String(user.id) !== String(data.elder_id)) {
    throw AppError.forbidden("Forbidden: You cannot trigger SOS for another user");
  }

  const createdLog = await emergencyRepository.insertEmergencyLog(data);
  await notifyGuardiansOfEmergency(data.elder_id, createdLog);
  return createdLog;
};

export const resolveEmergency = async (
  id: string | number,
  status: "Resolved" | "False Alarm",
  reason: string,
  user: UserContext
) => {
  if (!status || !["Resolved", "False Alarm"].includes(status)) {
    throw AppError.badRequest("Valid status ('Resolved' or 'False Alarm') is required");
  }

  const checkLog = await emergencyRepository.findEmergencyLogById(id);
  if (!checkLog) throw AppError.notFound("Emergency log not found");

  const elderId = checkLog.elder_id;

  if (user.role !== "Guardian") {
    throw AppError.forbidden("Forbidden: Only guardians can resolve emergency alerts");
  }
  await verifyGuardianElderLink(user.id, elderId);

  const validReasons = ["False Alarm", "Medical Help Provided", "Ambulance Dispatched", "Elder Cancelled"];
  const resolutionReason = validReasons.includes(reason)
    ? reason
    : status === "False Alarm"
    ? "False Alarm"
    : "Medical Help Provided";

  const updatedLog = await emergencyRepository.resolveEmergencyLog(id, user.id, status, resolutionReason, "Guardian");

  const io = getIo();
  io.to(elderId.toString()).emit("sos:resolved", {
    log: updatedLog,
    message: `Guardian resolved alert: ${resolutionReason}`,
  });

  const { guardianIds } = await emergencyRepository.findLinkedGuardianUserIds(elderId);
  guardianIds.forEach((gId) => {
    io.to(gId.toString()).emit("sos:resolved", {
      log: updatedLog,
      message: `Emergency resolved: ${resolutionReason}`,
    });
  });

  return updatedLog;
};

export const cancelSOS = async (id: string | number, user: UserContext) => {
  const checkLog = await emergencyRepository.findEmergencyLogById(id);
  if (!checkLog) throw AppError.notFound("Emergency log not found");

  const elderId = checkLog.elder_id;

  if (user.role !== "Elder" || String(user.id) !== String(elderId)) {
    throw AppError.forbidden("Forbidden: You can only cancel your own emergency alert");
  }

  const updatedLog = await emergencyRepository.resolveEmergencyLog(
    id,
    user.id,
    "False Alarm",
    "Elder cancelled - I am safe now",
    "Elder"
  );

  const io = getIo();
  io.to(elderId.toString()).emit("sos:cancelled", {
    log: updatedLog,
    message: "Elder cancelled the SOS alert - safe now.",
  });
  io.to(elderId.toString()).emit("sos:resolved", {
    log: updatedLog,
    message: "Elder cancelled SOS - safe now.",
  });

  const { guardianIds } = await emergencyRepository.findLinkedGuardianUserIds(elderId);
  guardianIds.forEach((gId) => {
    io.to(gId.toString()).emit("sos:cancelled", {
      log: updatedLog,
      message: "Elder cancelled SOS - safe now.",
    });
    io.to(gId.toString()).emit("sos:resolved", {
      log: updatedLog,
      message: "Elder cancelled SOS - safe now.",
    });
  });

  return updatedLog;
};

export const getEmergencyLogsForElder = async (elderId: string | number, user?: UserContext) => {
  if (user && user.role === "Guardian") {
    await verifyGuardianElderLink(user.id, elderId);
  }
  return emergencyRepository.findEmergencyLogsByElder(elderId);
};

export const getAllGuardianEmergencyAlerts = async (guardianId: string | number, elderIdFilter?: string | number) => {
  return emergencyRepository.findEmergencyAlertsForGuardian(guardianId, elderIdFilter);
};
