"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Issue = {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string | null;
  created_at: string;
};

export default function IssueList({ refreshKey = 0 }: { refreshKey?: number }) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchIssues() {
    setLoading(true);
    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setIssues(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    const refresh = setTimeout(() => {
      void fetchIssues();
    }, 0);

    return () => clearTimeout(refresh);
  }, [refreshKey]);

  return (
    <div className="space-y-4">
      {loading ? (
        <p className="text-slate-500">Loading issues...</p>
      ) : issues.length === 0 ? (
        <p className="text-slate-500">No issues reported yet.</p>
      ) : (
        issues.map((issue) => (
          <Link key={issue.id} href={`/issues/${issue.id}`} className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{issue.category}</p>
                <h3 className="text-lg font-semibold text-slate-900">{issue.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{issue.description}</p>
              </div>
              {issue.image_url ? (
                <img src={issue.image_url} alt={issue.title} className="h-24 w-24 rounded-xl object-cover" />
              ) : null}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Reported on {new Date(issue.created_at).toLocaleString()}
            </p>
          </Link>
        ))
      )}
    </div>
  );
}
