import { Link } from "react-router-dom";
import Icon from "../Icon";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center select-none">
      {/* MAINTENANCE VECTOR ARTWORK (Exact match from screenshot) */}
      <div className="relative w-full max-w-lg h-72 sm:h-80 flex items-center justify-center mb-6">
        <svg
          viewBox="0 0 500 350"
          className="w-full h-full drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Construction Crane on Left */}
          <g>
            {/* Tower Body with lattice struts */}
            <rect x="140" y="90" width="22" height="150" fill="#0E2040" />
            <path d="M140 100 L162 120 M140 120 L162 140 M140 140 L162 160 M140 160 L162 180 M140 180 L162 200 M140 200 L162 220 M140 220 L162 240" stroke="#CBD5E1" strokeWidth="1.5" />
            
            {/* Top Jib Arm */}
            <polygon points="120,95 240,95 230,85 130,85" fill="#0E2040" />
            <line x1="145" y1="85" x2="220" y2="85" stroke="#CBD5E1" strokeWidth="2" />
            <line x1="220" y1="95" x2="220" y2="135" stroke="#64748B" strokeWidth="2" />
            {/* Crane Hook */}
            <circle cx="220" cy="138" r="4" fill="#0E2040" />
            <path d="M217 142 C217 150 223 150 223 145" stroke="#0E2040" strokeWidth="2" fill="none" />
          </g>

          {/* Laptop Screen with Layout Wireframe (Center) */}
          <g>
            {/* Laptop Base & Lid */}
            <rect x="175" y="100" width="160" height="110" rx="8" fill="#FFFFFF" stroke="#0E2040" strokeWidth="4" />
            <rect x="155" y="210" width="200" height="10" rx="4" fill="#CBD5E1" stroke="#0E2040" strokeWidth="3" />
            <rect x="235" y="210" width="40" height="4" rx="2" fill="#94A3B8" />

            {/* Wireframe blocks on screen */}
            <rect x="185" y="112" width="140" height="12" rx="2" fill="#F1F5F9" />
            <circle cx="192" cy="118" r="2" fill="#CBD5E1" />
            <circle cx="198" cy="118" r="2" fill="#CBD5E1" />
            <circle cx="204" cy="118" r="2" fill="#CBD5E1" />

            {/* Orange component tile being hoisted */}
            <g transform="rotate(-4 240 150)">
              <rect x="190" y="135" width="85" height="30" rx="4" fill="#FF9F43" stroke="#FDBA74" strokeWidth="1.5" />
              <circle cx="205" cy="150" r="4" fill="#FFFFFF" opacity="0.8" />
              <line x1="215" y1="146" x2="265" y2="146" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
              <line x1="215" y1="154" x2="250" y2="154" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
            </g>

            {/* Wireframe grid placeholder right */}
            <rect x="282" y="132" width="45" height="68" rx="2" stroke="#E2E8F0" strokeWidth="1.5" fill="none" />
            <line x1="282" y1="132" x2="327" y2="200" stroke="#F1F5F9" strokeWidth="1.5" />
            <line x1="327" y1="132" x2="282" y2="200" stroke="#F1F5F9" strokeWidth="1.5" />
          </g>

          {/* Construction Road Barrier (Left Front) */}
          <g>
            <rect x="145" y="200" width="60" height="22" rx="2" fill="#FF9F43" stroke="#FFFFFF" strokeWidth="1.5" />
            {/* White Warning Stripes */}
            <polygon points="152,200 158,200 150,222 144,222" fill="white" />
            <polygon points="168,200 174,200 166,222 160,222" fill="white" />
            <polygon points="184,200 190,200 182,222 176,222" fill="white" />
            <polygon points="200,200 205,200 198,222 192,222" fill="white" />
            {/* Barrier Legs */}
            <line x1="150" y1="222" x2="150" y2="242" stroke="#0E2040" strokeWidth="4" />
            <line x1="200" y1="222" x2="200" y2="242" stroke="#0E2040" strokeWidth="4" />
            <circle cx="175" cy="211" r="8" fill="#FF9F43" stroke="white" strokeWidth="2" />
            <line x1="170" y1="211" x2="180" y2="211" stroke="white" strokeWidth="2.5" />
          </g>

          {/* Traffic Cones */}
          <g>
            <polygon points="255,242 265,242 260,224" fill="#FF9F43" />
            <rect x="253" y="242" width="14" height="2" fill="#FF9F43" />
            <polygon points="257,234 263,234 262,231 258,231" fill="white" />

            <polygon points="295,242 305,242 300,224" fill="#FF9F43" />
            <rect x="293" y="242" width="14" height="2" fill="#FF9F43" />
            <polygon points="297,234 303,234 302,231 298,231" fill="white" />
          </g>

          {/* Construction Worker (Right) with Large Wrench */}
          <g>
            {/* Hardhat Helmet */}
            <ellipse cx="360" cy="120" rx="14" ry="8" fill="#FF9F43" />
            <rect x="348" y="122" width="24" height="4" rx="2" fill="#FF9F43" />

            {/* Head */}
            <circle cx="360" cy="130" r="10" fill="#FDBA74" />

            {/* Vest & Upper Body */}
            <path d="M345 142 C345 138 375 138 375 142 L378 185 L342 185 Z" fill="#FF9F43" />
            <rect x="350" y="142" width="5" height="43" fill="#FFFFFF" />
            <rect x="365" y="142" width="5" height="43" fill="#FFFFFF" />

            {/* Navy Pants */}
            <rect x="345" y="185" width="14" height="52" fill="#0E2040" />
            <rect x="362" y="185" width="14" height="52" fill="#0E2040" />

            {/* Shoes */}
            <ellipse cx="348" cy="240" rx="9" ry="4" fill="#FF9F43" />
            <ellipse cx="372" cy="240" rx="9" ry="4" fill="#FF9F43" />

            {/* Giant Blue Wrench */}
            <g transform="rotate(-20 370 120)">
              <rect x="320" y="125" width="80" height="10" rx="3" fill="#0E2040" />
              <path d="M315 120 C310 130 310 135 325 138 L320 128 L328 122 Z" fill="#0E2040" />
              <path d="M395 120 C400 130 400 135 385 138 L390 128 L382 122 Z" fill="#0E2040" />
            </g>
          </g>
        </svg>
      </div>

      {/* Main Text Content */}
      <div className="max-w-md space-y-2">
        <h1 className="text-xl sm:text-2xl font-black text-[#0B1E38] tracking-tight">
          We are Under Maintenance
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">
          Sorry for any inconvenience caused, we have almost done. Will get back soon!
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
