import { Link } from "react-router-dom";
import Icon from "../components/Icon";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center select-none">
      {/* 404 VECTOR ARTWORK (Exact match from screenshot) */}
      <div className="relative w-full max-w-lg h-72 sm:h-80 flex items-center justify-center mb-6">
        <svg
          viewBox="0 0 500 350"
          className="w-full h-full drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle background window / bricks */}
          <rect x="150" y="80" width="200" height="150" rx="12" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="6 6" fill="#FFFFFF" />
          <line x1="250" y1="80" x2="250" y2="230" stroke="#E2E8F0" strokeWidth="2" />
          <line x1="150" y1="155" x2="350" y2="155" stroke="#E2E8F0" strokeWidth="2" />

          {/* ERROR 404 Orange Frame Box */}
          <g transform="rotate(-6 200 130)">
            <rect
              x="130"
              y="50"
              width="180"
              height="110"
              rx="8"
              stroke="#FF9F43"
              strokeWidth="5"
              strokeDasharray="10 6"
              fill="white"
            />
            <text
              x="145"
              y="85"
              fontFamily="system-ui, sans-serif"
              fontSize="20"
              fontWeight="900"
              fill="#FF9F43"
              letterSpacing="2"
            >
              ERROR
            </text>
            <text
              x="145"
              y="140"
              fontFamily="system-ui, sans-serif"
              fontSize="52"
              fontWeight="900"
              fill="#FF9F43"
              letterSpacing="1"
            >
              404
            </text>
          </g>

          {/* Top Ceiling Hole */}
          <ellipse cx="360" cy="80" rx="55" ry="10" fill="#0E2040" />

          {/* Ladder */}
          <g stroke="#64748B" strokeWidth="5" strokeLinecap="round">
            {/* Side rails */}
            <line x1="310" y1="85" x2="280" y2="290" />
            <line x1="345" y1="85" x2="365" y2="290" />
            {/* Steps */}
            <line x1="305" y1="120" x2="350" y2="120" strokeWidth="4" />
            <line x1="300" y1="155" x2="355" y2="155" strokeWidth="4" />
            <line x1="295" y1="190" x2="360" y2="190" strokeWidth="4" />
            <line x1="290" y1="225" x2="362" y2="225" strokeWidth="4" />
            <line x1="285" y1="260" x2="365" y2="260" strokeWidth="4" />
          </g>

          {/* Person climbing ladder into top hole */}
          <g>
            {/* Torso */}
            <path d="M330 95 C330 80 375 80 375 95 L370 120 L335 120 Z" fill="#FED7AA" />
            {/* Blue Jeans */}
            <path d="M335 120 L370 120 L365 190 L350 190 L345 140 L340 190 L330 190 Z" fill="#0E2040" />
            {/* Hand on top rung */}
            <circle cx="330" cy="90" r="5" fill="#FDBA74" />
          </g>

          {/* Bottom Floor Hole */}
          <ellipse cx="230" cy="290" rx="55" ry="12" fill="#0E2040" />

          {/* Person peeking out from bottom hole */}
          <g>
            {/* Head & Face */}
            <circle cx="235" cy="250" r="16" fill="#FDBA74" />
            {/* Dark Hair / Beard */}
            <path d="M220 245 C220 230 250 230 250 245 C250 262 220 262 220 245" fill="#0E2040" />
            <circle cx="235" cy="248" r="13" fill="#FDBA74" />
            {/* Eyes */}
            <circle cx="238" cy="245" r="1.5" fill="#0E2040" />
            {/* Yellow shirt peeking */}
            <path d="M210 290 C210 270 260 270 260 290 Z" fill="#FED7AA" />
          </g>

          {/* Oops! Speech Bubble */}
          <g>
            <rect x="235" y="195" width="48" height="24" rx="8" fill="#FFF5EC" stroke="#FFD8B2" strokeWidth="1.5" />
            <text x="244" y="211" fontFamily="system-ui, sans-serif" fontSize="10" fontWeight="bold" fill="#FF9F43">
              Oops!
            </text>
            <polygon points="245,219 248,226 253,219" fill="#FFF5EC" stroke="#FFD8B2" strokeWidth="1.5" />
          </g>

          {/* Potted plant on left */}
          <g>
            <polygon points="150,290 170,290 167,260 153,260" fill="#FF9F43" />
            <line x1="160" y1="260" x2="160" y2="170" stroke="#334155" strokeWidth="2.5" />
            {/* Leaves */}
            <ellipse cx="152" cy="240" rx="8" ry="5" transform="rotate(-30 152 240)" fill="#475569" />
            <ellipse cx="168" cy="225" rx="8" ry="5" transform="rotate(30 168 225)" fill="#475569" />
            <ellipse cx="152" cy="205" rx="8" ry="5" transform="rotate(-30 152 205)" fill="#475569" />
            <ellipse cx="168" cy="185" rx="8" ry="5" transform="rotate(30 168 185)" fill="#475569" />
            <ellipse cx="160" cy="165" rx="6" ry="8" fill="#475569" />
          </g>
        </svg>
      </div>

      {/* Main Text Content */}
      <div className="max-w-md space-y-2">
        <h1 className="text-xl sm:text-2xl font-black text-[#0B1E38] tracking-tight">
          Oops, something went wrong
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">
          Error 404 Page not found. Sorry the page you looking for doesn't exist or has been moved.
        </p>
      </div>

      {/* Back to Dashboard Button */}
      <div className="mt-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF9F43] px-6 py-2.5 text-xs font-black text-white shadow-md shadow-orange-500/20 hover:bg-[#F38C2A] transition active:scale-95"
        >
          <Icon name="dashboard" className="size-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
