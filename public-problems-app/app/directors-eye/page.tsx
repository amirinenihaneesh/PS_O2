import Link from "next/link";

export default function DirectorsEyePage() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-950">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 px-4 text-white">
        <Link href="/" className="text-sm text-slate-200 hover:text-white">
          <span aria-hidden="true">← </span>Public Problems App
        </Link>
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
          Director&apos;s Eye
        </span>
      </header>
      <iframe
        className="min-h-0 w-full flex-1 border-0"
        src="https://directors-eye.vercel.app/"
        title="Director’s Eye camera planning studio"
        allow="camera; fullscreen"
      />
    </main>
  );
}