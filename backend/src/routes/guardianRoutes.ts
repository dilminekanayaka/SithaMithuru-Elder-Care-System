import { Router } from "express";
import {
  getGuardianDashboard,
  getLinkedElders,
  getElderDetail,
  getElderActivity,
  getGuardianMedications,
  getGuardianMedicationDashboard,
  getGuardianMedicationHistory,
  sendMedicationReminder,
  getGuardianTaskHistory,
  sendTaskReminder,
  addGuardianMedication,
  updateGuardianMedication,
  deleteGuardianMedication,
  getEmergencyLogs,
  getAllGuardianEmergencyAlerts,
  getGuardianNotifications,
  markGuardianNotificationRead,
  getPendingLinkRequests,
  respondToLinkRequest,
  getElderRiskProfile,
  requestLink,
  exportElderPDF,
  generateElderInviteCode,
  connectElderByCode,
  getElderLiveMonitoring,
} from "../controllers/guardianController";
import { resolveEmergency } from "../controllers/emergencyController";
import { protect, requireRole } from "../middlewares/authMiddleware";
import { authorizeElderAccess } from "../middlewares/authorizationMiddleware";
import { medicationValidationRules } from "../middlewares/validationMiddleware";
import { connectionValidateLimiter } from "../middlewares/rateLimiter";

const router = Router();

// All routes require authentication (JWT)
router.use(protect);

// MODULE FIX: requestLink is an Elder action (Elder sends link request to Guardian).
router.post("/link-request", requireRole("Elder"), requestLink);

// QR/code-based linking with rate limiting protection
router.post("/elders/connect-code", requireRole("Elder"), connectionValidateLimiter, connectElderByCode);

// Adherence history for medications/tasks is genuinely useful to the Elder
// themself too (MedicationHistoryScreen.tsx / TaskHistoryScreen.tsx), not
// just their Guardian — both are already gated per-request by
// authorizeElderAccess (which allows the elder's own id or a linked
// guardian), so these two are registered here, before the blanket
// requireRole('Guardian') gate below, mirroring the connect-code fix above.
router.get("/medications/:elderId/history", authorizeElderAccess, getGuardianMedicationHistory);
router.get("/tasks/:elderId/history", authorizeElderAccess, getGuardianTaskHistory);

// All guardian routes below require authentication AND the Guardian role.
// An Elder with a valid JWT cannot access these endpoints.
router.use(requireRole("Guardian"));

// Dashboard & Elders
router.get("/dashboard", getGuardianDashboard);
router.get("/elders", getLinkedElders);
router.get("/elders/:elderId", authorizeElderAccess, getElderDetail);
router.get("/elders/:elderId/activity", authorizeElderAccess, getElderActivity);

// Medication management
router.get("/medications/:elderId", authorizeElderAccess, getGuardianMedications);
router.get("/medications/:elderId/dashboard", authorizeElderAccess, getGuardianMedicationDashboard);
router.post("/medications/:medicationId/remind", sendMedicationReminder);
router.post("/medications", medicationValidationRules, addGuardianMedication);
router.put(
  "/medications/:id",
  medicationValidationRules,
  updateGuardianMedication,
);
router.delete("/medications/:id", deleteGuardianMedication);

// Task / routine management
router.post("/tasks/:taskId/remind", sendTaskReminder);

// Emergency Logs & Resolution
router.get("/emergency-alerts", getAllGuardianEmergencyAlerts);
router.get("/emergency-logs/:elderId", authorizeElderAccess, getEmergencyLogs);
router.post("/emergency-alerts/:id/resolve", resolveEmergency);
router.put("/emergency-alerts/:id/resolve", resolveEmergency);

// Notifications
router.get("/notifications", getGuardianNotifications);
router.get("/notifications/:guardianId", getGuardianNotifications);
router.put("/notifications/:id/read", markGuardianNotificationRead);

// Guardian-Elder connection approvals
router.get("/pending-requests", getPendingLinkRequests);
router.put("/link/:elderId/respond", authorizeElderAccess, respondToLinkRequest);

// Elder Risk Profile & AI Dashboard
router.get("/risk-dashboard/:elderId", authorizeElderAccess, getElderRiskProfile);
router.get("/risk-profile/:elderId", authorizeElderAccess, getElderRiskProfile);

// Elder Invitations & Add Elder
router.post("/elders/generate-invite", connectionValidateLimiter, generateElderInviteCode);
router.get("/live-monitoring/:elderId", authorizeElderAccess, getElderLiveMonitoring);

// Report Generation
router.get("/export-pdf/:elderId", authorizeElderAccess, exportElderPDF);

export default router;
