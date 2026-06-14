import { describe, expect, it, vi, beforeEach } from "vitest";

const createClientMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when company creation fails", async () => {
    const companySingle = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "duplicate key" },
    });

    createClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "companies") {
          return {
            insert: () => ({
              select: () => ({ single: companySingle }),
            }),
          };
        }
        return {};
      }),
    });

    const { POST } = await import("@/app/api/auth/signup/route");
    const response = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "owner@acme.com",
          password: "password123",
          fullName: "Acme Owner",
          companyName: "Acme",
          companySlug: "acme",
        }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error: "duplicate key" });
  });

  it("cleans up company when auth signup fails", async () => {
    const companySingle = vi.fn().mockResolvedValue({
      data: { id: "company-1", name: "Acme", slug: "acme" },
      error: null,
    });
    const deleteEq = vi.fn().mockResolvedValue({ error: null });

    createClientMock.mockResolvedValue({
      auth: {
        signUp: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "email exists" },
        }),
      },
      from: vi.fn((table: string) => {
        if (table === "companies") {
          return {
            insert: () => ({
              select: () => ({ single: companySingle }),
            }),
            delete: () => ({
              eq: deleteEq,
            }),
          };
        }
        if (table === "profiles") {
          return {
            update: () => ({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        return {};
      }),
    });

    const { POST } = await import("@/app/api/auth/signup/route");
    const response = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "owner@acme.com",
          password: "password123",
          fullName: "Acme Owner",
          companyName: "Acme",
          companySlug: "acme",
        }),
      })
    );

    expect(response.status).toBe(400);
    expect(deleteEq).toHaveBeenCalledWith("id", "company-1");
    await expect(response.json()).resolves.toMatchObject({ error: "email exists" });
  });
});
