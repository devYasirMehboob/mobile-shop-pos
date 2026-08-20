import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import useAuth from "../hooks/useAuth";

function homeFor(user) {
  if (user?.role === "admin" || user?.permissions?.includes("dashboard.view")) return "/dashboard";
  if (user?.role === "cashier" || user?.permissions?.includes("pos.access")) return "/pos";
  if (user?.permissions?.includes("sales.view")) return "/sales";
  return "/dashboard";
}

function LoginPage() {
  const { user, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("admin@mobileshop.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Sign In | Dreams POS";
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
    <div className="relative min-h-screen w-full bg-white flex flex-col justify-between items-center p-4 sm:p-6 overflow-hidden select-none">
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

      {/* TOP BRAND LOGO (Dreams POS) */}
      <header className="relative z-10 pt-6 sm:pt-8 flex items-center justify-center">
        <div className="flex items-center gap-2.5">
          {/* Logo Bag Icon */}
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0E2040] to-[#172E56] shadow-sm">
            <Icon name="shopping-bag" className="size-5 text-[#FF9F43]" />
            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-[#FF9F43] ring-2 ring-white" />
          </div>

          {/* Brand Name */}
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black tracking-tight text-[#0B1E38]">
              Dreams
            </span>
            <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs font-black uppercase text-[#FF9F43] tracking-widest leading-none">
              POS
            </span>
          </div>
        </div>
      </header>

      {/* CENTER SIGN IN CARD */}
      <main className="relative z-10 w-full max-w-[440px] my-auto py-6">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-9 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
          {/* Title & Subtitle */}
          <h1 className="text-2xl font-black text-[#0B1E38] tracking-tight">
            Sign In
          </h1>
          <p className="mt-1.5 text-xs font-medium text-slate-500">
            Access the Dreamspos panel using your email and passcode.
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

          {/* Form */}
          <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Email Field */}
            <div>
              <label
                className="mb-1.5 block text-xs font-bold text-slate-700"
                htmlFor="email"
              >
                Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  placeholder="admin@mobileshop.com"
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

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-4 rounded border-slate-300 text-[#FF9F43] focus:ring-orange-400 accent-[#FF9F43] cursor-pointer"
                />
                <span>Remember Me</span>
              </label>

              <button
                type="button"
                onClick={() => handleDemoLogin("admin@mobileshop.com", "admin123")}
                className="font-bold text-[#FF9F43] hover:text-[#e0852d] transition"
              >
                Forgot Password?
              </button>
            </div>

            {/* Sign In Button (Vibrant Orange #FF9F43) */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-xl bg-[#FF9F43] py-3 text-xs font-extrabold text-white shadow-md shadow-orange-500/25 transition-all hover:bg-[#F38C2A] active:scale-98 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* New on our platform? */}
          <div className="mt-4 text-center text-xs font-medium text-slate-500">
            <span>New on our platform? </span>
            <button
              type="button"
              onClick={() => handleDemoLogin("cashier@mobileshop.com", "cashier123")}
              className="font-bold text-[#FF9F43] hover:underline"
            >
              Create an account
            </button>
          </div>

          {/* OR Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              OR
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={() => handleDemoLogin("admin@mobileshop.com", "admin123")}
            className="flex w-full h-11 items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition active:scale-98"
          >
            <svg className="size-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Sign in with Google</span>
          </button>
        </div>
      </main>

      {/* FOOTER COPYRIGHT */}
      <footer className="relative z-10 pb-4 text-center text-xs font-semibold text-slate-400">
        Copyrights © 2025 - DreamsPOS
      </footer>
    </div>
  );
}

export default LoginPage;
