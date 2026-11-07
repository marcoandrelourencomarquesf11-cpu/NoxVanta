import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data as Profile | null;
}

export function isOwner(profile: Profile | null) {
  return profile?.role === "owner";
}
export function canManageStrategies(profile: Profile | null) {
  return !!profile && (["owner", "sub_owner", "igl"].includes(profile.role) || (profile.role === "strategist" && profile.can_manage_strategies));
}
export function canManageContent(profile: Profile | null) {
  return !!profile && ["owner", "sub_owner", "admin"].includes(profile.role);
}
export function canManageCompetitive(profile: Profile | null) {
  return !!profile && ["owner", "sub_owner", "igl"].includes(profile.role);
}
export function canManageRecruitment(profile: Profile | null) {
  return !!profile && ["owner", "sub_owner", "recruiter"].includes(profile.role);
}
export function canManageRoster(profile: Profile | null) {
  return !!profile && ["owner", "sub_owner", "igl"].includes(profile.role);
}
export function canAccessManagement(profile: Profile | null) {
  return canManageCompetitive(profile) || canManageRecruitment(profile);
}
export function roleLabel(role: string) {
  const labels: Record<string, string> = {
    owner: "Owner", sub_owner: "Sub-owner", igl: "IGL", recruiter: "Recrutador",
    strategist: "Estrategista", admin: "Administrador", player: "Titular",
    substitute: "Suplente", pending: "Pendente"
  };
  return labels[role] || role;
}

export function isApprovedMember(profile: Profile | null) {
  return !!profile && profile.role !== "pending";
}
