export interface TempAccountProfiles {
  id: number;
  code: string;
  uniqueId: string;
  created_at: string;
  expired_at: string;
  profile_id: string;
}
export type OneTimeCodeInfoPayload = {
  code: string;
  expiresAt: string;
  tempAccountProfiles: TempAccountProfiles[];
  maxQuota: number;
  totalActiveTempAccount: number;
};
