import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  getSettings,
  removeShopLogo,
  updateSettings,
  uploadShopLogo,
} from "../api/settingsApi";
import useAlert from "../hooks/useAlert";
import useAuth from "../hooks/useAuth";
import useConfirmation from "../hooks/useConfirmation";
import usePermissions from "../hooks/usePermissions";
import normalizeApiError from "../utils/normalizeApiError";
import PageErrorState from "../components/feedback/PageErrorState";
import LoadingState from "../components/LoadingState";
import Icon from "../components/Icon";
import LogoUploader from "../components/settings/LogoUploader";
import SettingsNavigation from "../components/settings/SettingsNavigation";
import SettingsSaveBar from "../components/settings/SettingsSaveBar";
import SettingsSectionForm from "../components/settings/SettingsSectionForm";
import UserProfileSettings from "../components/settings/UserProfileSettings";
import { settingsSections } from "../components/settings/settingsConfig";
import useSettings from "../hooks/useSettings";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function SettingsPage() {
  const { refreshSettings } = useSettings();
  const { user } = useAuth();
  const { can } = usePermissions();
  const isSuperAdmin = user?.role === "admin" || can("settings.manage");

  const visibleSections = useMemo(() => {
    if (isSuperAdmin) return settingsSections;
    return settingsSections.filter((s) => s.allUsers);
  }, [isSuperAdmin]);

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");

  // Determine active tab from URL or fallback
  const active = useMemo(() => {
    const matched = visibleSections.find((s) => s.key === tabParam);
    if (matched) return matched.key;
    return visibleSections[0]?.key || "profile";
  }, [tabParam, visibleSections]);

  const [settings, setSettings] = useState(null);
  const [original, setOriginal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const alert = useAlert();
  const confirm = useConfirmation();
  const [pageError, setPageError] = useState(null);
  const [formError, setFormError] = useState(null);
  const [errors, setErrors] = useState({});

  const section = useMemo(
    () => settingsSections.find((item) => item.key === active),
    [active]
  );

  const dirty = useMemo(() => {
    if (active === "profile" || !settings || !original) return false;
    if (!settings[active] || !original[active]) return false;
    return JSON.stringify(settings[active]) !== JSON.stringify(original[active]);
  }, [active, settings, original]);

  async function load() {
    setLoading(true);
    setPageError(null);
    try {
      const data = await getSettings();
      setSettings(data);
      setOriginal(clone(data));
    } catch (error) {
      const normalized = normalizeApiError(error);
      setPageError(normalized);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = "Settings | Dreams POS";
    load();
  }, []);

  useEffect(() => {
    const warn = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function select(next) {
    if (next === active) return;

    if (dirty) {
      const confirmed = await confirm({
        title: "Unsaved Changes",
        description: "You have unsaved changes in this section. Discard edits?",
        confirmText: "Discard Edits",
        tone: "warning",
      });
      if (!confirmed) return;

      // Revert edits for current section
      if (settings && original && settings[active]) {
        setSettings((current) => ({
          ...current,
          [active]: clone(original[active]),
        }));
      }
    }

    setErrors({});
    setFormError(null);
    setSearchParams({ tab: next }, { replace: true });
  }

  function change(key, value) {
    setSettings((current) => {
      const currentGroup = current?.[active] || {};
      return {
        ...current,
        [active]: { ...currentGroup, [key]: value },
      };
    });
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function submit(event) {
    if (event) event.preventDefault();
    if (!dirty || active === "profile" || busy) return;

    setBusy(true);
    setFormError(null);
    setErrors({});
    try {
      const payload = settings[active];
      const response = await updateSettings(active, payload);
      const fresh = await getSettings();
      setSettings(fresh);
      setOriginal(clone(fresh));
      await refreshSettings();
      alert.success(response.message || "Settings updated successfully.");
    } catch (error) {
      const normalized = normalizeApiError(error);
      if (normalized.status === 422 && normalized.errors) {
        setErrors(normalized.errors);
      } else {
        setFormError(normalized.message);
      }
      alert.error(normalized.message);
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!dirty || active === "profile") return;
    const confirmed = await confirm({
      title: "Reset Section?",
      description: "Discard unsaved edits in this section?",
      confirmText: "Discard",
      tone: "neutral",
    });
    if (!confirmed) return;
    setSettings((current) => ({
      ...current,
      [active]: clone(original[active]),
    }));
    setErrors({});
    setFormError(null);
  }

  async function upload(file) {
    setBusy(true);
    try {
      const response = await uploadShopLogo(file);
      const fresh = await getSettings();
      setSettings(fresh);
      setOriginal(clone(fresh));
      await refreshSettings();
      alert.success(response.message || "Logo uploaded successfully.");
    } catch (error) {
      const normalized = normalizeApiError(error);
      alert.error(normalized.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    const confirmed = await confirm({
      title: "Remove shop logo?",
      description: "Receipts will fall back to using your shop name.",
      confirmText: "Remove Logo",
      tone: "danger",
    });
    if (!confirmed) return;
    setBusy(true);
    try {
      const response = await removeShopLogo();
      const fresh = await getSettings();
      setSettings(fresh);
      setOriginal(clone(fresh));
      await refreshSettings();
      alert.success(response.message || "Logo removed successfully.");
    } catch (error) {
      const normalized = normalizeApiError(error);
      alert.error(normalized.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading)
    return (
      <div className="py-16">
        <LoadingState label="Loading settings..." />
      </div>
    );
  if (pageError) return <PageErrorState error={pageError} onRetry={load} />;
  if (!settings)
    return (
      <PageErrorState
        error={{ message: "Settings data is unavailable." }}
        onRetry={load}
      />
    );

  return (
    <div className="space-y-6 pb-8">
      {/* 1. TOP HEADER & BREADCRUMB + REFRESH */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0B1E38] tracking-tight">
            Settings & Profile
          </h1>
          <nav className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
            <Link to={can("dashboard.view") ? "/dashboard" : "/pos"} className="hover:text-slate-700 transition">
              {can("dashboard.view") ? "Dashboard" : "POS Workspace"}
            </Link>
            <span>›</span>
            <span className="text-slate-600 font-bold">
              {section?.label || "Settings"}
            </span>
          </nav>
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          disabled={busy}
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-extrabold text-slate-700 shadow-2xs hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
        >
          <Icon
            name="refresh"
            className={`size-3.5 ${busy ? "animate-spin text-[#FF9F43]" : ""}`}
          />
          <span>Refresh</span>
        </button>
      </section>

      {/* Form Error Banner */}
      {formError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
          {formError}
        </div>
      )}

      {/* 2. 2-COLUMN SETTINGS LAYOUT */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main Section */}
        <main className="min-w-0">
          {active === "profile" ? (
            <UserProfileSettings />
          ) : (
            <form onSubmit={submit}>
              {active === "shop" && (
                <LogoUploader
                  shop={settings.shop || {}}
                  isBusy={busy}
                  onUpload={upload}
                  onRemove={remove}
                />
              )}

              <SettingsSectionForm
                section={section}
                values={settings[active] || {}}
                errors={errors}
                onChange={change}
                disabled={busy}
              />

              <SettingsSaveBar
                dirty={dirty}
                busy={busy}
                onSave={submit}
                onReset={reset}
              />
            </form>
          )}
        </main>

        {/* Navigation Column */}
        <aside className="w-full lg:sticky lg:top-24">
          <SettingsNavigation
            sections={visibleSections}
            active={active}
            onSelect={select}
            dirty={dirty ? active : null}
          />
        </aside>
      </div>
    </div>
  );
}

export default SettingsPage;
