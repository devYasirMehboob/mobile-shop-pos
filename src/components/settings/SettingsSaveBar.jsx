function SettingsSaveBar({
  dirty,
  isDirty,
  busy,
  isBusy,
  onReset,
  onSave,
}) {
  const activeDirty = dirty ?? isDirty ?? false;
  const activeBusy = busy ?? isBusy ?? false;

  return (
    <div className="sticky bottom-6 z-10 mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-xl shadow-slate-300/30 backdrop-blur-md sm:flex-row sm:items-center">
      <p className="flex-1 px-1 text-xs font-semibold text-slate-500">
        {activeDirty ? (
          <span className="text-amber-600 font-bold flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-amber-500 animate-ping" />
            You have unsaved changes in this section.
          </span>
        ) : (
          <span className="text-emerald-600 font-bold flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            This section is saved and up to date.
          </span>
        )}
      </p>

      <div className="flex gap-2.5">
        <button
          type="button"
          disabled={!activeDirty || activeBusy}
          onClick={onReset}
          className="min-h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-extrabold text-slate-600 transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Reset
        </button>

        <button
          type="button"
          disabled={!activeDirty || activeBusy}
          onClick={onSave}
          className="min-h-10 rounded-xl bg-[#FF9F43] px-6 text-xs font-extrabold text-white shadow-md shadow-orange-500/20 transition hover:bg-[#F38C2A] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {activeBusy ? "Saving Changes..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

export default SettingsSaveBar;
