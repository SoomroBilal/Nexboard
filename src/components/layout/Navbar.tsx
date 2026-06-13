"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar({
  userEmail,
  userName,
  onMenuClick,
}: {
  userEmail?: string;
  userName?: string;
  onMenuClick?: () => void;
}) {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/signin");
    router.refresh();
  };

  return (
    <header className="flex h-14 items-center border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950">
      <button
        onClick={onMenuClick}
        className="mr-3 rounded-md p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 lg:hidden"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="flex items-center gap-3">
          <div className="text-right text-sm">
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              {userName || "User"}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {userEmail}
            </p>
          </div>
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {(userName || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
