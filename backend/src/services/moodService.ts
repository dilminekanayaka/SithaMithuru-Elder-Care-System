import * as moodRepository from "../repositories/moodRepository";
import { MoodLogInput } from "../repositories/moodRepository";
import { verifyUserElderAccess, UserContext } from "../utils/accessHelper";
import { AppError } from "../utils/AppError";

const VALID_MOODS = ["Happy", "Sad", "Neutral", "Angry", "Anxious"];

export const getMoodHistory = async (elderId: string | number, days: number = 7, user?: UserContext) => {
  if (user) {
    await verifyUserElderAccess(user, elderId);
  }

  const history = await moodRepository.findMoodHistoryByElder(elderId, days);
  const todayStr = new Date().toISOString().split("T")[0];
  const todayMood = history.find((r: any) => r.date === todayStr) || null;

  return { history, todayMood };
};

export const saveMood = async (data: MoodLogInput, user?: UserContext) => {
  if (user) {
    await verifyUserElderAccess(user, data.elder_id);
  }

  if (!data.elder_id || !data.mood_type) {
    throw AppError.badRequest("elder_id and mood_type are required");
  }

  if (!VALID_MOODS.includes(data.mood_type)) {
    throw AppError.badRequest(`Invalid mood. Must be one of: ${VALID_MOODS.join(", ")}`);
  }

  return moodRepository.createMoodLog(data);
};
