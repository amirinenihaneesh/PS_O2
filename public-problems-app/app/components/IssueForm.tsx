"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function IssueForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Pothole");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (!userId) {
        setMessage("Please log in before reporting an issue.");
        return;
      }

      let imageUrl = "";

      if (imageFile) {
        const fileName = `${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("issues-images")
          .upload(fileName, imageFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("issues-images").getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }

      const { error } = await supabase.rpc("submit_issue", {
        p_title: title,
        p_description: description,
        p_category: category,
        p_image_url: imageUrl,
        p_submitter_id: userId,
      });

      if (error) throw error;

      setTitle("");
      setDescription("");
      setCategory("Pothole");
      setImageFile(null);
      if (imageInputRef.current) imageInputRef.current.value = "";
      setMessage("Issue saved. You can report another problem now.");
      onCreated();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error !== null && "message" in error && typeof error.message === "string"
            ? error.message
            : "Something went wrong";
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  if (!userId) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-slate-600">Log in to report an issue.</p>
        <Link href="/login" className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">
          Log in or create an account
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Broken streetlight"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-28 w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Describe the problem and where it is located"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        >
          <option>Pothole</option>
          <option>Garbage</option>
          <option>Streetlight</option>
          <option>Drainage</option>
          <option>Water Leak</option>
          <option>Safety</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Photo</label>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          className="w-full rounded-lg border border-dashed border-slate-300 px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Reporting..." : "Report issue"}
      </button>

      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </form>
  );
}
