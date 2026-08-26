import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import useAuth from "../hooks/useAuth";

function homeFor(user) {
  if (user?.role === "admin" || user?.permissions?.includes("dashboard.view"))
    return "/dashboard";
  if (user?.role === "cashier" || user?.permissions?.includes("pos.access"))
    return "/pos";
  if (user?.permissions?.includes("sales.view")) return "/sales";
  return "/dashboard";
}

function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("admin2@mobileshop.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Sign In | BiteBlix POS";
  }, []);

  if (!isLoading && user) return <Navigate to={homeFor(user)} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }
    if (!password) {
      setError("Enter your passcode.");
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedInUser = await login(email.trim(), password);
      navigate(location.state?.from?.pathname || homeFor(loggedInUser), {
        replace: true,
      });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDemoLogin(roleEmail, rolePass) {
    setEmail(roleEmail);
    setPassword(rolePass);
  }

  return (
    <div className="relative min-h-screen w-full bg-white flex flex-col justify-center items-center p-4 sm:p-6 overflow-hidden select-none">
      {/* Decorative Geometric Background Backgrounds (as seen in screenshot) */}
      <div
        className="pointer-events-none absolute -bottom-16 -right-16 w-[650px] h-[450px] bg-[#FFF5ED] rounded-tl-[160px] -rotate-6 z-0"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-36 -left-12 w-64 h-16 bg-[#FF9F43] rounded-r-2xl -rotate-6 shadow-lg shadow-orange-500/10 z-0"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-44 -left-8 w-44 h-10 bg-[#FFB86C] rounded-r-xl -rotate-6 z-0"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-[440px] flex flex-col items-center my-auto py-4">
        {/* TOP BRAND LOGO (BiteBlix POS) */}
        <header className="mb-5 flex items-center justify-center">
          <div className="flex items-center gap-2.5">
            {/* Logo Bag Icon */}
            <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0E2040] to-[#172E56] shadow-sm">
              <Icon name="shopping-bag" className="size-5 text-[#FF9F43]" />
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-[#FF9F43] ring-2 ring-white" />
            </div>

            {/* Brand Name */}
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black tracking-tight text-[#0B1E38]">
                BiteBlix
              </span>
              <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs font-black uppercase text-[#FF9F43] tracking-widest leading-none">
                POS
              </span>
            </div>
          </div>
        </header>

        {/* CENTER SIGN IN CARD */}
        <main className="w-full">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-9 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
            {/* Title & Subtitle */}
            <h1 className="text-2xl font-black text-[#0B1E38] tracking-tight">
              Sign In
            </h1>
            <p className="mt-1.5 text-xs font-medium text-slate-500">
              Access the BiteBlix POS panel using your email and passcode.
            </p>

            {/* Error Message */}
            {error && (
              <div
                className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs font-semibold text-rose-700 animate-in fade-in"
                role="alert"
              >
                <Icon name="alert" className="size-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {/* Email Field */}
              <div>
                <label
                  className="mb-1.5 block text-xs font-bold text-slate-700"
                  htmlFor="email"
                >
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 pr-10 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Icon name="mail" className="size-4" />
                  </span>
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label
                  className="mb-1.5 block text-xs font-bold text-slate-700"
                  htmlFor="password"
                >
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 pr-10 py-2.5 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex="-1"
                  >
                    <Icon name="eye" className="size-4" />
                  </button>
                </div>
              </div>

              {/* Sign In Button (Vibrant Orange #FF9F43) */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 w-full rounded-xl bg-[#FF9F43] py-3 text-xs font-extrabold text-white shadow-md shadow-orange-500/25 transition-all hover:bg-[#F38C2A] active:scale-98 disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        </main>

        {/* FOOTER COPYRIGHT */}
        <footer className="mt-4 text-center text-xs font-semibold text-slate-400 space-y-1">
          <p>2025-2026 BiteBlix Solutions All right reserved</p>
          <p>
            Designed &amp; Developed By
            <a
              href="https://biteblixsolutions.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FF9F43] font-bold hover:underline ml-1"
            >
              biteblixsolutions.com
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default LoginPage;
