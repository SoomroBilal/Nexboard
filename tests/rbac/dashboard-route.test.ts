import { beforeEach, describe, expect, it, vi } from "vitest";

const createClientMock = vi.fn();
const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

describe("/dashboard role routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects anonymous users to sign in", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
      from: vi.fn(),
    });

    const dashboardPage = await import("@/app/dashboard/page");
    await expect(dashboardPage.default()).rejects.toThrow("REDIRECT:/auth/signin");
    expect(redirectMock).toHaveBeenCalledWith("/auth/signin");
  });

  it("redirects authenticated mentor to mentor dashboard", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      from: vi.fn(() => ({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({ data: { role: "mentor" } }),
          }),
        }),
      })),
    });

    const dashboardPage = await import("@/app/dashboard/page");
    await expect(dashboardPage.default()).rejects.toThrow("REDIRECT:/dashboard/mentor");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard/mentor");
  });

  it("falls back to new-hire route for unknown role", async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      from: vi.fn(() => ({
        select: () => ({
          eq: () => ({
            single: vi.fn().mockResolvedValue({ data: { role: "unknown_role" } }),
          }),
        }),
      })),
    });

    const dashboardPage = await import("@/app/dashboard/page");
    await expect(dashboardPage.default()).rejects.toThrow("REDIRECT:/dashboard/new-hire");
    expect(redirectMock).toHaveBeenCalledWith("/dashboard/new-hire");
  });
});
