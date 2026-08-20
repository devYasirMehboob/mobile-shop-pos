import { Link } from "react-router-dom";
import Icon from "../Icon";

export default function ServerErrorPage() {
  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center select-none">
      {/* 500 VECTOR ARTWORK (Exact match from screenshot) */}
      <div className="relative w-full max-w-lg h-72 sm:h-80 flex items-center justify-center mb-6">
        <svg
          viewBox="0 0 500 350"
          className="w-full h-full drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Soft background peach circle / blob */}
          <ellipse cx="250" cy="180" rx="140" ry="120" fill="#FFF0E2" />

          {/* Server Rack (Left) */}
          <g>
            <rect x="135" y="110" width="65" height="135" rx="6" fill="#0E2040" />
            <rect x="140" y="115" width="55" height="15" rx="2" fill="#1E293B" />
            <circle cx="148" cy="122" r="2.5" fill="#FF9F43" />
            <circle cx="156" cy="122" r="2.5" fill="#38BDF8" />
            <circle cx="164" cy="122" r="2.5" fill="#34D399" />

            {/* Server unit slots */}
            {[135, 155, 175, 195, 215].map((y) => (
              <g key={y}>
                <rect x="140" y={y} width="55" height="16" rx="2" fill="#1E293B" stroke="#334155" strokeWidth="1" />
                <rect x="144" y={y + 5} width="28" height="3" rx="1" fill="#FF9F43" />
                <circle cx="180" cy={y + 8} r="2" fill="#38BDF8" />
                <circle cx="188" cy={y + 8} r="2" fill="#F87171" />
              </g>
            ))}

            {/* Cable wires coming out to floor */}
            <path d="M150 245 C150 275 220 285 240 270" stroke="#0E2040" strokeWidth="2.5" fill="none" />
            <path d="M165 245 C165 280 260 290 280 275" stroke="#475569" strokeWidth="2" fill="none" />
            <path d="M180 245 C180 270 200 280 220 275" stroke="#0E2040" strokeWidth="2" fill="none" />
          </g>

          {/* Technician / Engineer (Center) */}
          <g>
            {/* Cap */}
            <path d="M230 115 C230 102 265 102 265 115 Z" fill="#FF9F43" />
            <ellipse cx="232" cy="117" rx="8" ry="2" fill="#FDBA74" />

            {/* Head & Hand scratching head */}
            <circle cx="248" cy="124" r="14" fill="#CBD5E1" />
            <path d="M258 115 C264 110 268 120 260 126" stroke="#475569" strokeWidth="3" strokeLinecap="round" fill="none" />

            {/* Upper body & Overalls */}
            <path d="M225 145 C225 138 270 138 270 145 L275 190 L220 190 Z" fill="#334155" />
            <path d="M230 145 L265 145 L265 235 L250 235 L247 185 L245 185 L242 235 L227 235 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />

            {/* Overalls Straps */}
            <rect x="236" y="145" width="5" height="40" fill="#FF9F43" />
            <rect x="254" y="145" width="5" height="40" fill="#FF9F43" />

            {/* Hand holding wrench */}
            <path d="M230 170 L250 178" stroke="#FDBA74" strokeWidth="6" strokeLinecap="round" />
            <path d="M245 180 L258 172 M248 184 L260 175" stroke="#FF9F43" strokeWidth="4" strokeLinecap="round" />

            {/* Shoes */}
            <ellipse cx="232" cy="238" rx="8" ry="4" fill="#0E2040" />
            <ellipse cx="260" cy="238" rx="8" ry="4" fill="#0E2040" />
          </g>

          {/* 500 Number & Error Badge (Right) */}
          <g>
            <text
              x="305"
              y="160"
              fontFamily="system-ui, sans-serif"
              fontSize="56"
              fontWeight="900"
              fill="#0E2040"
              letterSpacing="-2"
            >
              500
            </text>

            <rect x="305" y="172" width="130" height="24" rx="6" fill="#FF9F43" />
            <text
              x="315"
              y="188"
              fontFamily="system-ui, sans-serif"
              fontSize="11"
              fontWeight="bold"
              fill="white"
              letterSpacing="0.5"
            >
              Internal Server Error
            </text>
          </g>

          {/* Small plant on right floor */}
          <g>
            <rect x="345" y="240" width="16" height="5" rx="2" fill="#0E2040" />
            <path d="M350 240 C340 220 330 200 345 190 C345 210 350 230 353 240" fill="#94A3B8" />
            <path d="M353 240 C360 215 370 205 365 195 C360 210 355 230 353 240" fill="#CBD5E1" />
          </g>
        </svg>
      </div>

      {/* Main Text Content */}
      <div className="max-w-md space-y-2">
        <h1 className="text-xl sm:text-2xl font-black text-[#0B1E38] tracking-tight">
          Oops, something went wrong
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">
          Server Error 500. We apologise and are fixing the problem. Please try again at a later stage.
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
