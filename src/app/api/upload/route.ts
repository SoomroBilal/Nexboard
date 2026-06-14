import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "uploads";

async function ensureBucket() {
  const supabase = createAdminClient();
  const { data: existing } = await supabase.storage.getBucket(BUCKET);
  if (!existing) {
    await supabase.storage.createBucket(BUCKET, { public: true });
  }
}

export async function POST(request: Request) {
  try {
    await ensureBucket();
  } catch {
    return NextResponse.json({ error: "Failed to initialize storage bucket" }, { status: 500 });
  }

  let file: File;
  let owner: string;
  try {
    const form = await request.formData();
    const f = form.get("file");
    if (!f || !(f instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }
    file = f;
    owner = (form.get("owner") as string) || "anonymous";
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "png";
  const path = `${owner}/${Date.now()}.${ext}`;

  const supabase = createAdminClient();
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: true,
  });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: publicUrl.publicUrl });
}
