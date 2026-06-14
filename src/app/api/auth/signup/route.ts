import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { email, password, fullName, companyName, companySlug } = await request.json();
    const supabase = await createClient();

    // Create the company first
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .insert({
        name: companyName || `${fullName}'s Company`,
        slug: companySlug || fullName.toLowerCase().replace(/\s+/g, "-") + "-company",
      })
      .select()
      .single();

    if (companyError) {
      return NextResponse.json({ error: companyError.message }, { status: 400 });
    }

    // Sign up user with company metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: "company_admin",
          company_id: company.id,
        },
      },
    });

    if (authError) {
      // Clean up company if auth fails
      await supabase.from("companies").delete().eq("id", company.id);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Update profile with company_id (trigger creates basic profile)
    if (authData.user) {
      await supabase
        .from("profiles")
        .update({ company_id: company.id, role: "company_admin" })
        .eq("id", authData.user.id);
    }

    return NextResponse.json({ user: authData.user, company }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
