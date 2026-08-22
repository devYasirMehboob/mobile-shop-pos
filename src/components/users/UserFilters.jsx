import Icon from "../Icon";

function UserFilters({ filters, roles, onChange, onClear, onRefresh, isLoading }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
      <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_180px_180px_auto_auto]">
        {/* Search */}
        <label className="relative block">
          <span className="sr-only">Search Users</span>
          <Icon
            name="search"
            className="pointer-events-none absolute left-3.5 top-3 size-4 text-slate-400"
          />
          <input
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-3 text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:border-[#FF9F43] focus:bg-white focus:ring-2 focus:ring-orange-100"
            placeholder="Search by name, email or phone..."
            value={filters.search}
            onChange={(event) => onChange("search", event.target.value)}
          />
        </label>

        {/* Role Dropdown */}
        <select
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100 cursor-pointer"
          value={filters.role}
          onChange={(event) => onChange("role", event.target.value)}
        >
          <option value="">All Roles</option>
          {roles.map((role) => (
            <option key={role.id} value={role.slug}>
              {role.name}
            </option>
          ))}
        </select>

        {/* Status Dropdown */}
        <select
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100 cursor-pointer"
          value={filters.status}
          onChange={(event) => onChange("status", event.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* Clear Button */}
        <button
          type="button"
          className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          onClick={onClear}
        >
          Clear
        </button>

        {/* Refresh Button */}
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <Icon name="refresh" className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>
    </section>
  );
}

export default UserFilters;