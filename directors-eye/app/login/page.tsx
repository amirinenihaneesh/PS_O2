"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    if (!supabase) {
      setMessage("Add Supabase credentials to .env.local to enable sign in.");
      return;
    }

    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/` } });
  }

  async function signInWithEmail(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (!supabase) {
      setMessage("Add Supabase credentials to .env.local to enable sign in.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    setMessage(error ? error.message : "Check your email for a secure sign-in link.");
    setLoading(false);
  }

  return (
    <main className="login-shell">
      <section className="login-art"><div className="brand"><span className="brand-mark"><span>+</span></span><span>Director&apos;s Eye</span><small>STUDIO</small></div><div className="login-quote"><p>“The frame is where<br />the story begins.”</p><small>— A working space for directors</small></div><div className="login-grid" /></section>
      <section className="login-form"><Link href="/" className="back-link">← Back to workspace</Link><div className="login-card"><p className="eyebrow">WELCOME BACK</p><h1>Your next great shot<br />starts here.</h1><p className="login-copy">Sign in to keep your scene plans, references, and camera setups together.</p><button className="google-button" onClick={signInWithGoogle}><span className="google-g">G</span> Continue with Google</button><div className="or"><span>or</span></div><form onSubmit={signInWithEmail}><label className="field-label" htmlFor="email">Email address</label><input id="email" className="login-input" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@production.com" /><button className="email-button" disabled={loading}>{loading ? "Sending link..." : "Continue with email"}<span>→</span></button></form>{message ? <p className="login-message">{message}</p> : null}<p className="terms">By continuing, you agree to the Director&apos;s Eye terms and privacy policy.</p></div><p className="login-footer">New to the studio? <Link href="/">Create a free workspace</Link></p></section>
    </main>
  );
}