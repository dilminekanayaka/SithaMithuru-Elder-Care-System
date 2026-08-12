import { calculateRiskProfile, RiskProfile } from "./riskEngine";
import * as riskRepository from "../repositories/riskRepository";
import { verifyGuardianElderLink } from "./connectionService";
import { AppError } from "../utils/AppError";

type UserContext = { id: string | number; role: string };

export const getElderRiskProfile = async (elderId: string | number, user?: UserContext): Promise<RiskProfile> => {
  if (!elderId) throw AppError.badRequest("elderId is required");

  if (user && user.role === "Guardian") {
    await verifyGuardianElderLink(user.id, elderId);
  }

  const profile = await calculateRiskProfile(Number(elderId), true);
  return profile;
};

export const getSavedRiskProfile = async (elderId: string | number, user?: UserContext) => {
  if (user && user.role === "Guardian") {
    await verifyGuardianElderLink(user.id, elderId);
  }
  return riskRepository.findLatestRiskProfile(elderId);
};
