import InlineError from "../feedback/InlineError";

function SettingField({ field, value, error, onChange, disabled }) {
  const [key, label, type, options] = field;
  const id = `setting-${key}`;

  if (type === "toggle") {
    return (
      <label
        htmlFor={id}
        className="flex min-h-[64px] cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition-colors hover:bg-slate-100/70"
      >
        <span className="flex flex-col gap-0.5">
          <strong className="text-xs font-bold text-[#0B1E38]">
            {label}
          </strong>
          {error && <InlineError error={error} />}
        </span>
        <input
          id={id}
          type="checkbox"
          checked={Boolean(value)}
          disabled={disabled}
          onChange={(e) => onChange(key, e.target.checked)}
          className="size-5 rounded-md border-slate-300 text-[#FF9F43] focus:ring-orange-400 accent-[#FF9F43] cursor-pointer disabled:opacity-50"
        />
      </label>
    );
  }

  const base =
    "min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100 disabled:opacity-50 hover:border-slate-300";

  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-[11px] font-extrabold text-slate-700">
        {label}
      </span>
      {type === "textarea" ? (
        <textarea
          id={id}
          rows="3"
          value={value ?? ""}
          disabled={disabled}
          onChange={(e) => onChange(key, e.target.value)}
          className={`${base} py-2.5 resize-none ${
            error
              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
              : "border-slate-200"
          }`}
        />
      ) : type === "select" ? (
        <select
          id={id}
          value={value ?? ""}
          disabled={disabled}
          onChange={(e) => onChange(key, e.target.value)}
          className={`${base} cursor-pointer ${
            error
              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
              : "border-slate-200"
          }`}
        >
          {options.map(([optVal, optLabel]) => (
            <option key={optVal} value={optVal}>
              {optLabel}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={type || "text"}
          value={value ?? ""}
          disabled={disabled}
          onChange={(e) => onChange(key, e.target.value)}
          className={`${base} ${
            error
              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-100"
              : "border-slate-200"
          }`}
        />
      )}
      {error && <InlineError error={error} />}
    </label>
  );
}

export default SettingField;
