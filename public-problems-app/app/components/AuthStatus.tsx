"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthStatus() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  if (!email) {
    return (
      <Link href="/login" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-white">
        Log in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm text-slate-200">
      <span>{email}</span>
      <button type="button" onClick={handleSignOut} className="rounded-lg border border-slate-500 px-3 py-1.5 font-semibold text-white">
        Log out
      </button>
    </div>
  );
}