export interface TempAccountProfiles {
  id: number;
  code: string;
  uniqueId: string;
  created_at: string;
  expired_at: string;
  profile_id: string;
  is_expired: boolean;
}
export type OneTimeCodeInfoPayload = {
  code_id: string;
  code: string;
  expiresAt: string;
  tempAccountProfiles: TempAccountProfiles[];
  maxQuota: number;
  totalActiveTempAccount: number;
};
