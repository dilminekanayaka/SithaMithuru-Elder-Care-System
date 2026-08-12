import * as journalRepository from "../repositories/journalRepository";
import { JournalInput } from "../repositories/journalRepository";
import { verifyUserElderAccess, UserContext } from "../utils/accessHelper";
import { AppError } from "../utils/AppError";

export const getJournalEntries = async (
  elderId: string | number,
  limit: number = 20,
  offset: number = 0,
  user?: UserContext
) => {
  if (user) {
    await verifyUserElderAccess(user, elderId);
  }

  const [entries, totalCount] = await Promise.all([
    journalRepository.findJournalEntriesByElder(elderId, limit, offset),
    journalRepository.countJournalEntriesByElder(elderId),
  ]);

  const totalPages = Math.ceil(totalCount / limit);
  const hasMore = offset + limit < totalCount;
  const page = Math.floor(offset / limit) + 1;

  return {
    entries,
    pagination: {
      page,
      limit,
      total: totalCount,
      total_pages: totalPages,
      has_more: hasMore,
    },
  };
};

export const createJournalEntry = async (data: JournalInput, user?: UserContext) => {
  if (user) {
    await verifyUserElderAccess(user, data.elder_id);
  }

  if (!data.elder_id || !data.title || !data.content) {
    throw AppError.badRequest("elder_id, title, and content are required");
  }

  return journalRepository.createJournalEntry(data);
};

export const deleteJournalEntry = async (id: string | number, user?: UserContext) => {
  const elderId = await journalRepository.findJournalEntryElderId(id);
  if (!elderId) throw AppError.notFound("Journal entry not found");

  if (user) {
    await verifyUserElderAccess(user, elderId);
  }

  const deleted = await journalRepository.deleteJournalEntry(id);
  if (!deleted) throw AppError.notFound("Journal entry not found");
  return { message: "Journal entry deleted" };
};
