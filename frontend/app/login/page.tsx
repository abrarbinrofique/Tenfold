"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type Vals = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Vals>({ resolver: zodResolver(schema) });

  async function onSubmit(v: Vals) {
    setLoading(true);
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
    try {
      const r = await fetch(`${base}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: v.email }),
      });
      if (r.status === 401) { toast.error("Unknown email. Try avery@acme.test"); setLoading(false); return; }
      if (!r.ok) { toast.error(`Backend error ${r.status}. API: ${base}`); setLoading(false); return; }
      const payload = await r.json().catch(() => null);
      const token = payload?.token;
      if (token && typeof window !== "undefined") {
        localStorage.setItem("tenfold_token", token);
        document.cookie = `tenfold_token=${token}; Path=/; SameSite=Lax; Max-Age=${60 * 60 * 24}`;
      }
      const me = await fetch(`${base}/me`, { credentials: "include" });
      const data = me.ok ? await me.json() : null;
      const teamId = data?.teams?.[0]?.id ?? "team_lead";
      router.push(`/team/${teamId}`);
    } catch (e: any) {
      toast.error(`Network error: ${e?.message ?? "unknown"}. API: ${base}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen grid grid-cols-1 md:grid-cols-[55%_45%]">
      {/* Diagonal ruling overlay — login only */}
      <div aria-hidden className="pointer-events-none fixed inset-0 diag-ruling opacity-[0.6] z-[1]" />

      {/* Left editorial panel */}
      <section className="relative overflow-hidden border-r border-[var(--hair)] flex flex-col justify-between min-h-[70vh] md:min-h-screen px-[max(48px,6vw)] py-16">
        {/* Topographic contour backdrop */}
        <div
          aria-hidden
          className="absolute inset-0 topo opacity-[0.07] pointer-events-none"
          style={{ transform: "rotate(-4deg) scale(1.3)" }}
        />
        {/* 12-col hairline grid, very faint */}
        <div
          aria-hidden
          className="absolute inset-y-0 left-[max(48px,6vw)] right-[max(48px,6vw)] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--hair) 1px, transparent 1px)",
            backgroundSize: "calc(100% / 12) 100%",
            opacity: 0.35,
          }}
        />

        <div className="relative z-10 flex items-baseline gap-2 y-reveal">
          <span className="font-serif text-[22px] font-light tracking-display">Tenfold</span>
          <span className="inline-block h-[4px] w-[4px] rounded-full bg-ink translate-y-[-3px]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            ·01 · AN OPERATING SYSTEM FOR THE WEEKLY MEETING
          </span>
        </div>

        <div className="relative z-10 max-w-full">
          <div className="flex items-end gap-6">
            <div className="flex-1">
              <div className="caps mb-5 y-reveal">§ 01 · THE WEEKLY TEN</div>
              <h1
                className="font-serif leading-[0.88] tracking-display y-reveal-90"
                style={{
                  fontSize: "clamp(96px, 18vw, 220px)",
                  fontWeight: 300,
                  fontVariationSettings: '"SOFT" 100, "opsz" 144',
                }}
              >
                Tenfold
              </h1>
              <div className="mt-2 h-px bg-ink/80 origin-left draw-x" />
            </div>
            <div
              className="hidden lg:block font-mono text-[10px] uppercase tracking-[0.3em] text-muted self-end pb-4"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              · AN OPERATING SYSTEM FOR THE WEEKLY MEETING ·
            </div>
          </div>

          <p className="mt-8 max-w-md text-[13px] text-fg/70 leading-relaxed y-reveal-180">
            A disciplined 90-minute cadence for the people who run the company.
            Scorecard, Rocks, Issues, To-Dos — nothing more.
          </p>
        </div>

        <figure className="relative z-10 max-w-md y-reveal-270">
          <div className="h-px bg-[var(--hair-strong)] mb-4" />
          <blockquote className="font-serif italic font-light text-[22px] leading-snug text-fg/85">
            "What gets measured, gets managed."
          </blockquote>
          <figcaption className="mt-2 caps">— Peter Drucker · 1954</figcaption>
        </figure>
      </section>

      {/* Right form */}
      <section className="relative z-10 flex items-center justify-center px-[max(40px,4vw)] py-16 bg-bg">
        <div className="w-full max-w-sm">
          <div className="caps mb-3 y-reveal">§ SIGN IN</div>
          <h2 className="font-serif text-[32px] font-light leading-tight tracking-display mb-8 y-reveal-90">
            Continue to your team.
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-7 y-reveal-180">
            <div>
              <label className="caps block mb-3">Email</label>
              <Input
                variant="underline"
                autoFocus
                type="email"
                placeholder="you@company.com"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <div className="mt-2 text-[11px] text-[color:var(--rail-off)]">
                  {errors.email.message}
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="ghost"
              size="md"
              className="px-0 gap-1.5 btn-reveal"
              disabled={loading}
            >
              <span className="btn-label">{loading ? "Opening…" : "Continue"}</span>
              <ArrowRight className="h-3.5 w-3.5 btn-arrow" />
            </Button>
          </form>

          <div className="mt-12 h-px bg-[var(--hair)]" />
          <p className="mt-4 caps">
            A one-time link to your inbox. No passwords, ever.
          </p>
        </div>
      </section>
    </main>
  );
}
