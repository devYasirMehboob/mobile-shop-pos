import React from "react";
import { logger, getDebugMode } from "../utils/logger";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  // eslint-disable-next-line no-unused-vars
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    logger.error("React Component Error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  render() {
    if (this.state.hasError) {
      if (getDebugMode()) {
        return (
          <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] p-6 text-slate-800 select-none">
            <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="grid size-10 place-items-center rounded-xl bg-rose-50 text-rose-600 text-lg font-bold">
                  ⚠️
                </span>
                <div>
                  <h1 className="text-xl font-black text-rose-600">
                    Application Error (Debug Mode)
                  </h1>
                  <p className="text-xs font-semibold text-slate-400">
                    An unhandled exception occurred in component rendering.
                  </p>
                </div>
              </div>

              <div className="my-5 overflow-auto rounded-xl border border-rose-100 bg-rose-50/50 p-4 text-xs font-mono text-rose-800 max-h-60">
                <strong>{this.state.error && this.state.error.toString()}</strong>
                <pre className="mt-2 whitespace-pre-wrap text-[11px] text-slate-600">
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={this.handleGoHome}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-extrabold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Return to Dashboard
                </button>
                <button
                  onClick={this.handleReload}
                  className="rounded-xl bg-[#FF9F43] px-6 py-2.5 text-xs font-extrabold text-white shadow-md shadow-orange-500/20 hover:bg-[#F38C2A] transition active:scale-95 cursor-pointer"
                >
                  Reload Page
                </button>
              </div>
            </div>
            <p className="mt-6 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Dreams POS · System Error Handler
            </p>
          </div>
        );
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] p-6 text-center select-none">
          <div className="w-full max-w-md">
            {/* Dreams POS Error Illustration */}
            <div className="relative mx-auto mb-6 size-44 flex items-center justify-center">
              <svg viewBox="0 0 200 200" className="size-full">
                {/* Soft backdrop circles */}
                <circle cx="100" cy="100" r="85" fill="#FFF5EC" />
                <circle cx="100" cy="100" r="65" fill="#FFEADB" />

                {/* Shield / Screen */}
                <rect
                  x="55"
                  y="55"
                  width="90"
                  height="75"
                  rx="16"
                  fill="#0E2040"
                />
                <rect
                  x="62"
                  y="62"
                  width="76"
                  height="61"
                  rx="10"
                  fill="#19325C"
                />

                {/* Exclamation & Spark */}
                <circle cx="100" cy="85" r="4" fill="#FF9F43" />
                <rect
                  x="98"
                  y="72"
                  width="4"
                  height="8"
                  rx="2"
                  fill="#FF9F43"
                />

                {/* Status Bar */}
                <rect
                  x="70"
                  y="102"
                  width="60"
                  height="6"
                  rx="3"
                  fill="#FF9F43"
                />

                {/* Base Stand */}
                <path
                  d="M85 130 L115 130 L125 150 L75 150 Z"
                  fill="#0E2040"
                  opacity="0.9"
                />
              </svg>
            </div>

            {/* Title & Message */}
            <h1 className="text-2xl font-black text-[#0B1E38] tracking-tight">
              This page could not be displayed.
            </h1>
            <p className="mt-2 text-xs font-semibold text-slate-500 max-w-xs mx-auto">
              We&apos;re sorry, but something went wrong while trying to display
              this page.
            </p>

            {/* Action Buttons */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="rounded-xl bg-[#FF9F43] px-6 py-2.5 text-xs font-extrabold text-white shadow-md shadow-orange-500/20 hover:bg-[#F38C2A] transition active:scale-95 cursor-pointer"
              >
                Reload
              </button>
              <button
                onClick={this.handleGoHome}
                className="rounded-xl bg-[#0E2040] px-6 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-[#19325C] transition active:scale-95 cursor-pointer"
              >
                Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
