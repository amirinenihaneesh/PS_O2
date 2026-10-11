"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthStatus from "./components/AuthStatus";
import IssueForm from "./components/IssueForm";
import IssueList from "./components/IssueList";
import { useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-700 p-8 text-white shadow-xl">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-300">Public problems app</p>
            <div className="flex items-center gap-4">
              <Link href="/directors-eye" className="text-sm font-medium text-white underline decoration-slate-400 underline-offset-4 hover:text-slate-200">
                Director&apos;s Eye
              </Link>
              <AuthStatus />
            </div>
          </div>
          <h1 className="mt-3 text-4xl font-semibold">Report public issues and help improve your area</h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-200">
            Citizens can report problems like potholes, garbage, streetlights, and drainage issues with photos and comments.
          </p>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Report a problem</h2>
              <Link href="/" className="text-sm text-slate-600">Refresh</Link>
            </div>
            <IssueForm
              onCreated={() => {
                setRefreshKey((current) => current + 1);
                router.refresh();
              }}
            />
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Recent issues</h2>
              <p className="text-sm text-slate-500">Live list</p>
            </div>
            <IssueList refreshKey={refreshKey} />
          </section>
        </div>
      </div>
    </main>
  );
}
