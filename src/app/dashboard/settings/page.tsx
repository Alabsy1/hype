import { DatabaseError } from "@/lib/server/errors/data-layer-error";
import { getHomepageFeaturedDepartment } from "@/lib/server/homepage";
import { listSettings } from "@/lib/server/repositories/settings.repository";

import ConfirmButton from "../_components/confirm-button";
import DbUnavailable, { EmptyState, SectionError } from "../_components/states";
import { deleteSettingAction, setHomepageFeaturedDepartmentAction, setSettingAction } from "./actions";
import SettingForm, { NewSettingForm } from "./setting-form";
import FeaturedDepartmentForm from "./featured-department-form";

export const metadata = {
  title: "Settings",
  description: "Manage Hype site settings.",
};

function prettyValue(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2) ?? "null";
  } catch {
    return String(value);
  }
}

async function loadSettings() {
  try {
    const [settings, featuredDepartment] = await Promise.all([
      listSettings(),
      getHomepageFeaturedDepartment(),
    ]);
    return { ok: true as const, settings, featuredDepartment };
  } catch (error) {
    if (error instanceof DatabaseError) return { ok: false as const, unavailable: true, message: "" };
    return {
      ok: false as const,
      unavailable: false,
      message: error instanceof Error ? error.message : "Settings could not be loaded.",
    };
  }
}

/**
 * Site settings manager over the SiteSetting key/value store. Only exposes
 * what the architecture supports — no fabricated business configuration.
 */
export default async function SettingsPage() {
  const loaded = await loadSettings();
  if (!loaded.ok) {
    return loaded.unavailable ? (
      <DbUnavailable section="Settings management" />
    ) : (
      <SectionError message={loaded.message} />
    );
  }
  const { settings, featuredDepartment } = loaded;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Small site-wide content values (JSON). {settings.length} settings stored.
        </p>
      </div>

      <section aria-label="Homepage featured department" className="flex flex-col gap-4 rounded-2xl border border-line bg-canvas p-5">
        <div>
          <h2 className="font-display text-xl text-ink">Homepage Featured Department</h2>
          <p className="mt-1 text-sm text-muted">
            Which department feeds the featured-products section on the public homepage.
          </p>
        </div>
        <FeaturedDepartmentForm current={featuredDepartment} action={setHomepageFeaturedDepartmentAction} />
      </section>

      {settings.length === 0 ? (
        <EmptyState title="No settings yet." hint="Create the first key/value pair below." />
      ) : (
        <ul className="flex flex-col gap-4">
          {settings.map((setting) => (
            <li key={setting.key} className="flex flex-col gap-3 rounded-2xl border border-line bg-canvas p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-sm font-semibold text-ink">{setting.key}</p>
                <form action={deleteSettingAction}>
                  <input type="hidden" name="key" value={setting.key} />
                  <ConfirmButton label="Delete" confirmLabel="Confirm delete" />
                </form>
              </div>
              <SettingForm
                settingKey={setting.key}
                initialValue={prettyValue(setting.value)}
                action={setSettingAction}
                submitLabel="Save setting"
              />
            </li>
          ))}
        </ul>
      )}

      <NewSettingForm action={setSettingAction} />
    </div>
  );
}
