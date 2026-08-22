function PermissionSelector({
  permissions = [],
  inherited = [],
  overrides = {},
  onChange,
  disabled = false,
}) {
  const modules = [...new Set(permissions.map((permission) => permission.module))];

  return (
    <div className="space-y-4 text-xs">
      {modules.map((module) => (
        <section key={module} className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
          <header className="border-b border-slate-100 bg-[#F8F9FA] px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
            {module} Capabilities
          </header>

          <div className="divide-y divide-slate-100">
            {permissions
              .filter((permission) => permission.module === module)
              .map((permission) => {
                const inheritedValue = inherited.includes(permission.key);
                const value = overrides[permission.key] || "inherit";

                return (
                  <div
                    key={permission.key || permission.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50/70 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <strong className="block text-xs font-bold text-[#0B1E38]">
                        {permission.name}
                      </strong>
                      <span className="mt-0.5 block text-[10px] text-slate-400 font-mono">
                        {permission.key}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase border shadow-2xs ${
                          inheritedValue
                            ? "bg-purple-50 text-purple-700 border-purple-200/60"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {inheritedValue ? "Role Default" : "Not Inherited"}
                      </span>

                      <select
                        className="h-8 rounded-xl border border-slate-200 bg-white px-2 text-xs font-bold text-slate-700 outline-none focus:border-[#FF9F43] cursor-pointer"
                        value={value}
                        disabled={disabled}
                        onChange={(event) => onChange(permission.key, event.target.value)}
                      >
                        <option value="inherit">Inherit Role</option>
                        <option value="allow">Force Allow</option>
                        <option value="deny">Force Deny</option>
                      </select>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}

export default PermissionSelector;