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
// Ownership is verified inside deleteJournalEntry against the entry's actual
// elder_id (fetched from the row itself), since elderId isn't in the URL here.
router.delete("/:id", deleteJournalEntry);

export default router;
