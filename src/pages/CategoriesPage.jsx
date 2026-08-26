import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategory,
  updateCategory,
  updateCategoryStatus,
} from "../api/categoriesApi";
import CategoryForm from "../components/categories/CategoryForm";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import useAlert from "../hooks/useAlert";
import useConfirmation from "../hooks/useConfirmation";
import normalizeApiError from "../utils/normalizeApiError";

const emptyForm = { name: "", description: "" };

function formatDate(dateStr) {
  if (!dateStr) return "Today";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Today";
  }
}

function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const alert = useAlert();
  const confirmDialog = useConfirmation();

  const [formMode, setFormMode] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formValues, setFormValues] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionId, setActionId] = useState(null);

  const loadCategories = useCallback(
    async (search = "", isRefresh = false) => {
      isRefresh ? setIsRefreshing(true) : setIsLoading(true);

      try {
        const data = await getCategories(search);
        setCategories(data || []);
      } catch (error) {
        alert.error(normalizeApiError(error).message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [alert]
  );

  useEffect(() => {
    document.title = "Category | BiteBlix POS";
    loadCategories();
  }, [loadCategories]);

  function handleSearchChange(e) {
    const val = e.target.value;
    setSearchInput(val);
    setCurrentPage(1);
    loadCategories(val);
  }

  function handleStatusChange(e) {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  }

  // Filtered list
  const filteredCategories = categories.filter((c) => {
    if (statusFilter && c.status !== statusFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredCategories.length / limit) || 1;
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

  function toggleSelectAll() {
    if (selectedIds.size === paginatedCategories.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedCategories.map((c) => c.id)));
    }
  }

  function toggleSelectOne(id) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function openCreateForm() {
    setEditingCategory(null);
    setFormValues(emptyForm);
    setFormErrors({});
    setFormMode("create");
  }

  async function openEditForm(category) {
    setActionId(category.id);

    try {
      const latestCategory = await getCategory(category.id);
      setEditingCategory(latestCategory);
      setFormValues({
        name: latestCategory.name,
        description: latestCategory.description || "",
      });
      setFormErrors({});
      setFormMode("edit");
    } catch (error) {
      alert.error(normalizeApiError(error).message);
    } finally {
      setActionId(null);
    }
  }

  function closeForm() {
    if (isSubmitting) return;
    setFormMode(null);
    setEditingCategory(null);
    setFormErrors({});
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setFormValues((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: "" }));
  }

  async function handleFormSubmit(event) {
    event.preventDefault();
    setFormErrors({});

    if (!formValues.name.trim()) {
      setFormErrors({ name: "Category name is required." });
      return;
    }

    setIsSubmitting(true);

    try {
      const response =
        formMode === "edit"
          ? await updateCategory(editingCategory.id, formValues)
          : await createCategory(formValues);

      setFormMode(null);
      setEditingCategory(null);
      alert.success(response.message || "Category saved successfully.");
      loadCategories(searchInput);
    } catch (error) {
      const normalized = normalizeApiError(error);
      setFormErrors(normalized.fieldErrors || {});
      if (Object.keys(normalized.fieldErrors || {}).length === 0) {
        alert.error(normalized.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(category) {
    const confirmed = await confirmDialog({
      title: "Delete Category",
      description: `Are you sure you want to delete category "${category.name}"? This cannot be undone.`,
      confirmText: "Delete",
      tone: "danger",
      destructive: true,
      requiredText: category.name,
    });

    if (!confirmed) return;

    setActionId(category.id);
    try {
      const response = await deleteCategory(category.id);
      alert.success(response.message || "Category deleted.");
      loadCategories(searchInput);
    } catch (error) {
      alert.error(normalizeApiError(error).message);
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-5 pb-8">
      {/* 1. TOP HEADER & BREADCRUMB + ACTION BUTTONS */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1E38] tracking-tight">
            Category
          </h1>
          <nav className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Link to="/dashboard" className="hover:text-slate-700 transition">
              Dashboard
            </Link>
            <span>›</span>
            <span className="text-slate-600 font-bold">Category</span>
          </nav>
        </div>

        {/* Right Actions: Refresh, Collapse, + Add Category */}
        <div className="flex flex-wrap items-center gap-2">

          {/* Refresh Button */}
          <button
            type="button"
            disabled={isRefreshing}
            onClick={() => loadCategories(searchInput, true)}
            className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            title="Refresh List"
            aria-label="Refresh List"
          >
            <Icon
              name="refresh"
              className={`size-4 ${
                isRefreshing ? "animate-spin text-[#FF9F43]" : ""
              }`}
            />
          </button>

          {/* Collapse Chevron Button */}
          <button
            type="button"
            className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50 transition"
            title="Toggle View"
            aria-label="Toggle View"
          >
            <Icon name="chevron-left" className="size-4 rotate-90" />
          </button>

          {/* + Add Category (Orange #FF9F43) */}
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF9F43] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm shadow-orange-500/20 transition-all hover:bg-[#F38C2A] active:scale-95 cursor-pointer"
          >
            <Icon name="plus-circle" className="size-4" />
            <span>Add Category</span>
          </button>
        </div>
      </section>

      {/* 2. CATEGORIES WHITE CONTAINER */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-5">
          {/* Search Box */}
          <div className="relative w-full sm:max-w-xs">
            <Icon
              name="search"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search"
              value={searchInput}
              onChange={handleSearchChange}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-4 focus:ring-orange-100"
            />
          </div>

          {/* Filter Dropdown on Right */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={handleStatusChange}
                className="appearance-none rounded-xl border border-slate-200 bg-white pl-3.5 pr-8 py-2 text-xs font-bold text-slate-700 shadow-2xs outline-none transition hover:border-slate-300 focus:border-[#FF9F43] focus:ring-2 focus:ring-orange-100 cursor-pointer"
              >
                <option value="">Status ⌄</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <Icon
                name="chevron-down"
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* 3. TABLE OR LOADING / EMPTY STATE */}
        {isLoading ? (
          <div className="py-12">
            <LoadingState label="Loading categories..." />
          </div>
        ) : paginatedCategories.length === 0 ? (
          <EmptyState
            icon="categories"
            title="No categories found"
            description="Add your first category or adjust your search filter."
            actionLabel="Add Category"
            onAction={openCreateForm}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="w-10 px-4 py-3.5">
                    <input
                      type="checkbox"
                      className="size-4 rounded-md border-slate-300 text-[#FF9F43] focus:ring-orange-400 accent-[#FF9F43] cursor-pointer"
                      checked={
                        paginatedCategories.length > 0 &&
                        selectedIds.size === paginatedCategories.length
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Category Slug</th>
                  <th className="px-4 py-3.5">Created On ⇅</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 font-medium">
                {paginatedCategories.map((cat) => {
                  const isSelected = selectedIds.has(cat.id);
                  const slug = (cat.name || "")
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "");

                  return (
                    <tr
                      key={cat.id}
                      className={`transition hover:bg-slate-50/80 ${
                        isSelected ? "bg-orange-50/40" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          className="size-4 rounded-md border-slate-300 text-[#FF9F43] focus:ring-orange-400 accent-[#FF9F43] cursor-pointer"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(cat.id)}
                        />
                      </td>

                      {/* Category Name */}
                      <td className="px-4 py-3.5">
                        <strong className="block text-xs font-extrabold text-[#0B1E38]">
                          {cat.name}
                        </strong>
                      </td>

                      {/* Category Slug */}
                      <td className="px-4 py-3.5 text-slate-500 font-medium">
                        {slug}
                      </td>

                      {/* Created On */}
                      <td className="px-4 py-3.5 text-slate-600 font-semibold whitespace-nowrap">
                        {formatDate(cat.created_at)}
                      </td>

                      {/* Status Badge */}
                      <td className="px-4 py-3.5">
                        {cat.status === "active" ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-800">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase text-slate-600">
                            <span className="size-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit */}
                          <button
                            type="button"
                            disabled={actionId === cat.id}
                            onClick={() => openEditForm(cat)}
                            className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition disabled:opacity-50"
                            title="Edit Category"
                            aria-label="Edit Category"
                          >
                            <Icon name="edit" className="size-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            disabled={actionId === cat.id}
                            onClick={() => handleDelete(cat)}
                            className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
                            title="Delete Category"
                            aria-label="Delete Category"
                          >
                            <Icon name="trash" className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. FOOTER PAGINATION & ROWS PER PAGE */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-4 text-xs">
          {/* Left: Row Per Page */}
          <div className="flex items-center gap-2 text-slate-500 font-semibold">
            <span>Row Per Page</span>
            <div className="relative">
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="appearance-none rounded-lg border border-slate-200 bg-white pl-2.5 pr-7 py-1 text-xs font-bold text-slate-700 shadow-2xs outline-none cursor-pointer"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
              <Icon
                name="chevron-down"
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-2.5 text-slate-400"
              />
            </div>
            <span>Entries</span>
          </div>

          {/* Right: Numbered Pagination Controls (< 1 2 3 [4] ... 15 >) */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
              aria-label="Previous Page"
            >
              ‹
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(
              (pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`grid size-8 place-items-center rounded-lg text-xs font-bold transition cursor-pointer ${
                    currentPage === pageNum
                      ? "bg-[#FF9F43] text-white shadow-xs"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {pageNum}
                </button>
              )
            )}

            {totalPages > 5 && (
              <>
                <span className="px-1 text-slate-400">...</span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  className="grid size-8 place-items-center rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-2xs hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
              aria-label="Next Page"
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {/* CREATE / EDIT CATEGORY MODAL */}
      <Modal
        isOpen={formMode !== null}
        title={formMode === "edit" ? "Edit Category" : "Add Category"}
        description={
          formMode === "edit"
            ? "Update category information."
            : "Create a new product category."
        }
        onClose={closeForm}
        size="md"
      >
        <CategoryForm
          values={formValues}
          errors={formErrors}
          isSubmitting={isSubmitting}
          submitLabel={
            formMode === "edit" ? "Save Changes" : "Create Category"
          }
          onChange={handleFormChange}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
        />
      </Modal>
    </div>
  );
}

export default CategoriesPage;
