function UsersPagination({ pagination, onPage }) {
  if (!pagination || pagination.total_pages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-slate-100 bg-[#FAFAFA] px-5 py-3.5 text-xs text-slate-500 font-medium">
      <span>
        Showing Page <strong className="text-slate-800 font-bold">{pagination.page}</strong> of{" "}
        <strong className="text-slate-800 font-bold">{pagination.total_pages}</strong> (
        {pagination.total} total staff)
      </span>
      <div className="flex gap-1.5">
        <button
          type="button"
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
          disabled={pagination.page <= 1}
          onClick={() => onPage(pagination.page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
          disabled={pagination.page >= pagination.total_pages}
          onClick={() => onPage(pagination.page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default UsersPagination;