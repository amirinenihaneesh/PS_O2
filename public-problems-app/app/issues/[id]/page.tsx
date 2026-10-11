"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Issue = {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string | null;
  created_at: string;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
};

export default function IssueDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    const { data: issueData } = await supabase.from("issues").select("*").eq("id", id).single();
    setIssue(issueData);

    const { data: commentsData } = await supabase
      .from("comments")
      .select("*")
      .eq("issue_id", id)
      .order("created_at", { ascending: true });
    setComments(commentsData ?? []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    await supabase.from("comments").insert({ issue_id: id, content });
    setContent("");
    await loadData();
  }

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) return <p className="text-slate-500">Loading issue...</p>;
  if (!issue) return <p className="text-slate-500">Issue not found.</p>;

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
        ← Back to all issues
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{issue.category}</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">{issue.title}</h1>
        <p className="mt-4 text-slate-700">{issue.description}</p>
        {issue.image_url ? <img src={issue.image_url} alt={issue.title} className="mt-4 h-64 w-full rounded-xl object-cover" /> : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Comments</h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Add your comment"
          />
          <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">
            Post comment
          </button>
        </form>

        <div className="mt-6 space-y-3">
          {comments.length === 0 ? (
            <p className="text-sm text-slate-500">No comments yet.</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm text-slate-700">{comment.content}</p>
                <p className="mt-2 text-xs text-slate-400">{new Date(comment.created_at).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
