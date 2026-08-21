import SettingField from "./SettingField";

function SettingsSectionForm({ section, values, errors, onChange, disabled }) {
  const featureOff = values?.enabled === false;

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
      <header className="border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-black text-[#0B1E38] tracking-tight">
            {section.label}
          </h3>
          {section.private && (
            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-700 border border-amber-200/60">
              Admin Only
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-400 font-medium">
          {section.description}
        </p>
      </header>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {section.fields.map((field) => (
          <SettingField
            key={field[0]}
            field={field}
            value={values?.[field[0]]}
            error={errors[`${section.key}.${field[0]}`]?.[0]}
            onChange={onChange}
            disabled={disabled || (featureOff && field[0] !== "enabled")}
          />
        ))}
      </div>

      {section.key === "printer" && values?.printing_method === "qz" && (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800">
          <strong>Note:</strong> QZ Tray is not installed by this project. Browser
          printing (80mm) remains the working fallback.
        </p>
      )}

      {section.key === "backups" && (
        <p className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-3.5 text-xs text-blue-800">
          <strong>Note:</strong> These preferences are stored for the Backups
          module. Manual and automated exports can be triggered from the Backups tab.
        </p>
      )}
    </section>
  );
}

export default SettingsSectionForm;
