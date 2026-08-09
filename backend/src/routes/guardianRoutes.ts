import { Router } from "express";
import {
  getGuardianDashboard,
  getLinkedElders,
  getElderDetail,
  getElderActivity,
  getGuardianMedications,
  getGuardianMedicationDashboard,
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

const router = Router();

// All routes require authentication (JWT)
router.use(protect);

// MODULE FIX: requestLink is an Elder action (Elder sends link request to Guardian).
// It was previously in userRoutes.ts — moved here where guardian connection logic lives.
// This route allows Elders (not just Guardians), so it is registered before the
// requireRole('Guardian') middleware.
router.post("/link-request", requireRole("Elder"), requestLink);

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
router.post("/medications", medicationValidationRules, addGuardianMedication);
router.put(
  "/medications/:id",
  medicationValidationRules,
  updateGuardianMedication,
);
router.delete("/medications/:id", deleteGuardianMedication);

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
router.post("/elders/generate-invite", generateElderInviteCode);
router.post("/elders/connect-code", connectElderByCode);
router.get("/live-monitoring/:elderId", authorizeElderAccess, getElderLiveMonitoring);

// Report Generation
router.get("/export-pdf/:elderId", authorizeElderAccess, exportElderPDF);

export default router;
