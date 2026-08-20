import { useEffect, useState } from "react";
import Icon from "../Icon";

export default function ComingSoonPage() {
  // Live ticking countdown state
  const [timeLeft, setTimeLeft] = useState({
    days: 54,
    hours: 10,
    minutes: 47,
    seconds: 0,
  });

  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    document.title = "Coming Soon | Dreams POS";

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  function handleSubscribe(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
  }

  return (
    <div className="relative min-h-screen w-full bg-[#EAD8C7] flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none bg-[radial-gradient(#cbb094_1px,transparent_1px)] [background-size:16px_16px]">
      {/* Decorative Warm Wood Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#6b472e]/30 via-transparent to-[#3d2314]/20 pointer-events-none" />

      {/* Decorative Potted Plant & Wooden Element Graphics in corners */}
      <div
        className="absolute -top-12 -right-12 size-64 rounded-full bg-emerald-900/10 blur-2xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-16 -left-16 size-80 rounded-full bg-orange-950/10 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* CENTER FLOATING CARD (Exact from screenshot) */}
      <div className="relative z-10 w-full max-w-xl rounded-3xl bg-white/95 backdrop-blur-md p-8 sm:p-11 text-center shadow-[0_20px_60px_rgba(40,20,10,0.18)] border border-white/60">
        {/* Brand Logo */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative flex size-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0E2040] to-[#172E56] shadow-sm">
            <Icon name="shopping-bag" className="size-6 text-[#FF9F43]" />
            <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-[#FF9F43] ring-2 ring-white" />
          </div>
        </div>

        {/* Small Intro Title */}
        <p className="text-xs sm:text-sm font-extrabold text-slate-500 tracking-wide">
          Our Website is
        </p>

        {/* Big Dual-Color COMING SOON Heading */}
        <h1 className="mt-1 text-3xl sm:text-4xl font-black tracking-tight">
          <span className="text-[#FF9F43]">COMING</span>{" "}
          <span className="text-[#0E2040]">SOON</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-3 text-xs sm:text-sm font-medium text-slate-500 max-w-md mx-auto leading-relaxed">
          Please check back later. We are working hard to get everything just right.
        </p>

        {/* Dynamic Countdown Timer Units */}
        <div className="mt-8 flex items-center justify-center gap-2 sm:gap-3.5">
          {/* Days */}
          <div className="flex flex-col items-center">
            <div className="grid size-16 sm:size-20 place-items-center rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
              <strong className="text-2xl sm:text-3xl font-black text-[#0B1E38]">
                {String(timeLeft.days).padStart(2, "0")}
              </strong>
            </div>
            <span className="mt-1.5 text-[11px] font-bold text-slate-400">
              Days
            </span>
          </div>

          <span className="text-xl font-bold text-slate-300 -mt-5">:</span>

          {/* Hours */}
          <div className="flex flex-col items-center">
            <div className="grid size-16 sm:size-20 place-items-center rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
              <strong className="text-2xl sm:text-3xl font-black text-[#0B1E38]">
                {String(timeLeft.hours).padStart(2, "0")}
              </strong>
            </div>
            <span className="mt-1.5 text-[11px] font-bold text-slate-400">
              Hrs
            </span>
          </div>

          <span className="text-xl font-bold text-slate-300 -mt-5">:</span>

          {/* Minutes */}
          <div className="flex flex-col items-center">
            <div className="grid size-16 sm:size-20 place-items-center rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
              <strong className="text-2xl sm:text-3xl font-black text-[#0B1E38]">
                {String(timeLeft.minutes).padStart(2, "0")}
              </strong>
            </div>
            <span className="mt-1.5 text-[11px] font-bold text-slate-400">
              Min
            </span>
          </div>

          <span className="text-xl font-bold text-slate-300 -mt-5">:</span>

          {/* Seconds */}
          <div className="flex flex-col items-center">
            <div className="grid size-16 sm:size-20 place-items-center rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
              <strong className="text-2xl sm:text-3xl font-black text-[#0B1E38]">
                {String(timeLeft.seconds).padStart(2, "0")}
              </strong>
            </div>
            <span className="mt-1.5 text-[11px] font-bold text-slate-400">
              Sec
            </span>
          </div>
        </div>

        {/* Subscribe Section */}
        <div className="mt-8">
          <p className="text-xs font-bold text-[#0B1E38] mb-3">
            Subscribe to get notified!
          </p>

          {subscribed ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs font-extrabold text-emerald-700">
              ✓ Thank you! We will notify you when we launch.
            </div>
          ) : (
            <form
              onSubmit={handleSubscribe}
              className="flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-2xs transition focus-within:border-[#FF9F43] focus-within:ring-2 focus-within:ring-orange-100"
            >
              <input
                type="email"
                placeholder="Enter Your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-transparent px-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none"
              />
              <button
                type="submit"
                className="rounded-xl bg-[#FF9F43] px-5 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-[#F38C2A] transition active:scale-95 shrink-0"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>

        {/* Social Icons Row */}
        <div className="mt-7 flex items-center justify-center gap-2">
          {["f", "📸", "🐦", "📌", "in"].map((label, idx) => (
            <button
              key={idx}
              type="button"
              className="grid size-8 place-items-center rounded-lg bg-[#0E2040] text-white text-xs font-black shadow-2xs hover:bg-[#19325C] transition active:scale-95"
              aria-label={`Social icon ${idx + 1}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
