export type Role = "pending" | "owner" | "sub_owner" | "igl" | "recruiter" | "strategist" | "admin" | "player" | "substitute";
export type Profile = {
  id: string; username: string | null; role: Role; can_manage_strategies: boolean;
  country: string | null; agent_role: string | null; avatar_key: string | null; status: string | null;
};
export type Match = {
  id: string; opponent: string; starts_at: string; competition: string | null;
  status: "upcoming" | "live" | "completed"; score_for: number | null; score_against: number | null;
};
export type NewsItem = { id: string; title: string; body: string; created_at: string; published: boolean };
export type Strategy = {
  id: string; title: string; map_name: string; side: "attack" | "defense";
  description: string | null; board: BoardData; updated_at: string;
};
export type BoardData = { markers: Marker[]; paths: Point[][]; notes: string; map_image?: string };
export type Point = { x: number; y: number };
export type Marker = { id: string; x: number; y: number; label: string; kind: string };
