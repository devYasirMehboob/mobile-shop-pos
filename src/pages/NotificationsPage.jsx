import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import useAlert from "../hooks/useAlert";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import LoadingState from "../components/LoadingState";
import useNotifications from "../hooks/useNotifications";
import usePermissions from "../hooks/usePermissions";
import AnnouncementModal from "./AnnouncementModal";
import NotificationPreferencesDialog from "./NotificationPreferencesDialog";

export default function NotificationsPage() {
  const { can } = usePermissions();
  const alert = useAlert();
  const {
    unreadSummary,
    notificationsList,
    pagination,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    dismiss,
    dismissAll,
    resolve,
    triggerEvaluation,
  } = useNotifications(60);

  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusTab, setStatusTab] = useState("all"); // 'all', 'unread', 'read', 'resolved'
  const [severityFilter, setSeverityFilter] = useState(""); // '', 'critical', 'warning', 'info', 'success'
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = useCallback(async () => {
    const params = {
      page: currentPage,
      limit: 10,
      search: search.trim() || undefined,
      severity: severityFilter || undefined,
    };

    if (statusTab !== "all") {
      params.status = statusTab;
    }

    await fetchNotifications(params);
  }, [fetchNotifications, currentPage, search, statusTab, severityFilter]);

  useEffect(() => {
    document.title = "Notifications | Dreams POS";
    loadData();
  }, [loadData]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusTabChange = (tab) => {
    setStatusTab(tab);
    setCurrentPage(1);
  };

  const handleSeverityCardClick = (sev) => {
    setSeverityFilter((prev) => (prev === sev ? "" : sev));
    setCurrentPage(1);
  };

  const handleRefreshScan = async () => {
    setIsEvaluating(true);
    await triggerEvaluation();
    await loadData();
    setIsEvaluating(false);
    alert.success("System alerts scanned and updated in real time.");
  };

  const handleResolve = async (id) => {
    await resolve(id);
    alert.success("Alert marked as resolved.");
    loadData();
  };

  const handleMarkAsRead = async (id) => {
    await markAsRead(id);
    alert.success("Notification marked as read.");
    loadData();
  };

  const handleMarkAsUnread = async (id) => {
    await markAsUnread(id);
    alert.info("Notification marked as unread.");
    loadData();
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    alert.success("All notifications marked as read.");
    loadData();
  };

  const handleDismiss = async (id) => {
    await dismiss(id);
    alert.info("Notification dismissed.");
    loadData();
  };

  const handleDismissAll = async () => {
    if (window.confirm("Are you sure you want to dismiss all notifications?")) {
      await dismissAll();
      alert.success("All notifications dismissed.");
      loadData();
    }
  };

  const timeAgo = (dateString) => {
    if (!dateString) return "";
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (isNaN(seconds) || seconds < 0) return "Just now";
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  return (
    <div className="space-y-6 pb-8">
      {/* 1. TOP HEADER & BREADCRUMB + ACTION BUTTONS */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1E38] tracking-tight">
            Notifications &amp; Alerts
          </h1>
          <nav className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Link to="/dashboard" className="hover:text-slate-700 transition">
              Dashboard
            </Link>
            <span>›</span>
            <span className="text-slate-600 font-bold">Notifications</span>
          </nav>
        </div>

        {/* Action Buttons: Scan, Announcement, Preferences, Mark All Read */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Real-time Scan */}
          <button
            type="button"
            onClick={handleRefreshScan}
            disabled={isEvaluating}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-extrabold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
            title="Re-evaluate system alerts in real time"
          >
            <Icon
              name="refresh"
              className={`size-3.5 ${
                isEvaluating ? "animate-spin text-[#FF9F43]" : "text-slate-500"
              }`}
            />
            <span>{isEvaluating ? "Scanning..." : "Scan Alerts"}</span>
          </button>

          {/* New Announcement */}
          {can("notifications.announce") && (
            <button
              type="button"
              onClick={() => setIsAnnouncementOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-extrabold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
            >
              <span className="text-[#FF9F43]">📢</span>
              <span>Announcement</span>
            </button>
          )}

          {/* Preferences */}
          <button
            type="button"
            onClick={() => setIsPreferencesOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-extrabold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer"
          >
            <Icon name="settings" className="size-3.5 text-slate-500" />
            <span>Preferences</span>
          </button>

          {/* Mark All Read */}
          {unreadSummary?.total > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF9F43] px-3.5 py-2 text-xs font-extrabold text-white shadow-sm shadow-orange-500/20 hover:bg-[#F38C2A] transition active:scale-95 cursor-pointer"
            >
              <Icon name="check" className="size-3.5" />
              <span>Mark All Read</span>
            </button>
          )}

          {/* Clear All Notifications */}
          {notificationsList?.length > 0 && (
            <button
              type="button"
              onClick={handleDismissAll}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-extrabold text-rose-700 shadow-2xs hover:bg-rose-100 transition active:scale-95 cursor-pointer"
              title="Clear all alerts"
            >
              <Icon name="trash" className="size-3.5" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </section>

      {/* 2. TOP 4 SEVERITY METRIC CARDS (INTERACTIVE FILTER PILLS) */}
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            key: "critical",
            title: "Critical Alerts",
            count: unreadSummary?.critical || 0,
            emoji: "🔴",
            bg: "bg-rose-50",
            border: "border-rose-200/80",
            textColor: "text-rose-600",
            activeClass: "ring-2 ring-rose-500 bg-rose-50/90",
          },
          {
            key: "warning",
            title: "Warnings",
            count: unreadSummary?.warning || 0,
            emoji: "🟡",
            bg: "bg-amber-50",
            border: "border-amber-200/80",
            textColor: "text-amber-600",
            activeClass: "ring-2 ring-amber-500 bg-amber-50/90",
          },
          {
            key: "info",
            title: "System Info",
            count: unreadSummary?.info || 0,
            emoji: "🔵",
            bg: "bg-blue-50",
            border: "border-blue-200/80",
            textColor: "text-blue-600",
            activeClass: "ring-2 ring-blue-500 bg-blue-50/90",
          },
          {
            key: "success",
            title: "Completed",
            count: unreadSummary?.success || 0,
            emoji: "🟢",
            bg: "bg-emerald-50",
            border: "border-emerald-200/80",
            textColor: "text-emerald-600",
            activeClass: "ring-2 ring-emerald-500 bg-emerald-50/90",
          },
        ].map((card) => {
          const isSelected = severityFilter === card.key;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => handleSeverityCardClick(card.key)}
              className={`rounded-2xl border p-5 text-left transition-all duration-200 shadow-xs cursor-pointer select-none bg-white hover:shadow-md ${
                isSelected ? card.activeClass : card.border
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{card.emoji}</span>
                  <span className="text-xs font-bold text-slate-600">
                    {card.title}
                  </span>
                </div>
                {isSelected && (
                  <span className="rounded-md bg-[#0B1E38] px-1.5 py-0.5 text-[9px] font-black uppercase text-white tracking-wider">
                    Filtered
                  </span>
                )}
              </div>
              <p className="mt-2 text-2xl font-black text-[#0B1E38] tracking-tight">
                {card.count}
              </p>
            </button>
          );
        })}
      </section>

      {/* 3. FILTER TABS & KEYWORD SEARCH */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: "All Alerts" },
            { id: "unread", label: "Unread" },
            { id: "read", label: "Read" },
            { id: "resolved", label: "Resolved" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleStatusTabChange(tab.id)}
              className={`rounded-xl px-3.5 py-2 text-xs font-extrabold transition cursor-pointer ${
                statusTab === tab.id
                  ? "bg-[#FF9F43] text-white shadow-sm shadow-orange-500/20"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2.5">
          {severityFilter && (
            <button
              type="button"
              onClick={() => setSeverityFilter("")}
              className="text-xs font-extrabold text-rose-600 hover:underline cursor-pointer"
            >
              Clear Severity
            </button>
          )}

          <div className="relative w-full sm:w-64">
            <Icon
              name="search"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search notifications..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#FF9F43] focus:bg-white focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {notificationsList?.length > 0 && (
            <button
              type="button"
              onClick={handleDismissAll}
              className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-2xs hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
              title="Dismiss all shown notifications"
            >
              <Icon name="trash" className="size-4" />
            </button>
          )}
        </div>
      </section>

      {/* 4. NOTIFICATIONS LIST CONTAINER */}
      <section className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16">
            <LoadingState label="Scanning system alerts & notifications..." />
          </div>
        ) : !notificationsList || notificationsList.length === 0 ? (
          <EmptyState
            icon="bell"
            title="No notifications found"
            description="You are all caught up! No active alerts or pending notifications right now."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {notificationsList.map((notification) => {
              const isUnread = notification.status === "unread";
              const isResolved = notification.status === "resolved";

              const severityBadge =
                notification.severity === "critical"
                  ? "bg-rose-100 text-rose-800 border-rose-200/60"
                  : notification.severity === "warning"
                  ? "bg-amber-100 text-amber-800 border-amber-200/60"
                  : notification.severity === "success"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200/60"
                  : "bg-blue-100 text-blue-800 border-blue-200/60";

              return (
                <div
                  key={notification.id}
                  className={`p-5 transition flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-slate-50/80 ${
                    isUnread ? "bg-[#FFF9F3]/60 border-l-4 border-l-[#FF9F43]" : ""
                  }`}
                >
                  {/* Left: Icon & Details */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white shadow-2xs border border-slate-200/80 text-sm mt-0.5">
                      {notification.severity === "critical"
                        ? "🔴"
                        : notification.severity === "warning"
                        ? "🟡"
                        : notification.severity === "success"
                        ? "🟢"
                        : "🔵"}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-xs font-black text-[#0B1E38]">
                          {notification.title}
                        </strong>

                        <span
                          className={`rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${severityBadge}`}
                        >
                          {notification.severity}
                        </span>

                        {isUnread && (
                          <span className="size-2 rounded-full bg-[#FF9F43] ring-4 ring-orange-100" />
                        )}
                      </div>

                      <p className="mt-1 text-xs text-slate-600 font-medium leading-relaxed">
                        {notification.message}
                      </p>

                      <div className="mt-2.5 flex items-center gap-3 text-[11px] font-semibold text-slate-400">
                        <span>{timeAgo(notification.created_at)}</span>
                        {notification.action_url && (
                          <Link
                            to={notification.action_url}
                            className="font-bold text-blue-600 hover:underline"
                          >
                            View related record →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    {!isResolved && can("notifications.resolve") && (
                      <button
                        type="button"
                        onClick={() => handleResolve(notification.id)}
                        className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs font-extrabold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                        title="Mark as Resolved"
                      >
                        Resolve
                      </button>
                    )}

                    {isUnread ? (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                        title="Mark as Read"
                      >
                        Mark Read
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleMarkAsUnread(notification.id)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-400 hover:bg-slate-50 transition cursor-pointer"
                        title="Mark as Unread"
                      >
                        Unread
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDismiss(notification.id)}
                      className="grid size-8 place-items-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                      title="Dismiss"
                    >
                      <Icon name="trash" className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 p-4 text-xs font-semibold text-slate-500">
            <span>
              Page {pagination.page} of {pagination.total_pages}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                ‹
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.total_pages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </section>

      {/* PREFERENCES DIALOG */}
      <NotificationPreferencesDialog
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
      />

      {/* ANNOUNCEMENT MODAL */}
      <AnnouncementModal
        isOpen={isAnnouncementOpen}
        onClose={() => setIsAnnouncementOpen(false)}
        onSubmit={async (payload) => {
          const res = await createAnnouncement(payload);
          loadData();
          return res;
        }}
      />
    </div>
  );
}
