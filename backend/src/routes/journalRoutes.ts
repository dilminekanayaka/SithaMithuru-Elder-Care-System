import { Router } from "express";
import {
  getJournalEntries,
  createJournalEntry,
  deleteJournalEntry,
} from "../controllers/journalController";
import { protect } from "../middlewares/authMiddleware";
import { authorizeElderAccess } from "../middlewares/authorizationMiddleware";

const router = Router();

router.use(protect);

router.get("/elder/:elderId", authorizeElderAccess, getJournalEntries);
router.post("/", authorizeElderAccess, createJournalEntry);
// DELETE uses elder_id from body (journalController already validates ownership via elder_id)
router.delete("/:id", deleteJournalEntry);

export default router;
