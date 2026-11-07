import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, canManageStrategies } from "@/lib/auth";
export async function POST(req: NextRequest) {
  const profile=await getCurrentProfile();
  if(!profile || !canManageStrategies(profile)) return NextResponse.redirect(new URL("/account/tactics?error=forbidden",req.url));
  const form=await req.formData(); const id=String(form.get("id")||"");
  const supabase=await createClient(); await supabase.from("strategies").delete().eq("id",id);
  return NextResponse.redirect(new URL("/account/tactics",req.url));
}
