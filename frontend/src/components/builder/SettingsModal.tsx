"use client";

import { Modal } from "@/components/ui/Modal";
import { CheckIcon } from "@/components/ui/icons";

const PRESET_COLORS = [
  "#0d0d0d",
  "#2b6cb0",
  "#7c3aed",
  "#0f9d58",
  "#dc2626",
  "#ea580c",
  "#db2777",
  "#0891b2",
];

const PRESET_BACKGROUNDS = ["#ffffff", "#faf7f2", "#f4f7fb", "#f6f4fb", "#0d0d0d"];

export interface SettingsFields {
  welcome_title?: string | null;
  welcome_description?: string | null;
  thank_you_message?: string | null;
  theme_color?: string | null;
  theme_background?: string | null;
}

export function SettingsModal({
  open,
  onClose,
  formTitle,
  settings,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  formTitle: string;
  settings: SettingsFields;
  onChange: (patch: SettingsFields) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Form settings" width={480}>
      <div className="space-y-6">
        <section>
          <h3 className="text-xs font-semibold text-ink-soft uppercase tracking-wide mb-3">Welcome screen</h3>
          <label className="text-xs text-ink-soft block mb-1">Title</label>
          <input
            value={settings.welcome_title ?? ""}
            onChange={(e) => onChange({ welcome_title: e.target.value })}
            placeholder={formTitle}
            className="w-full border border-border rounded-lg px-3.5 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink"
          />
          <label className="text-xs text-ink-soft block mb-1">Description</label>
          <textarea
            value={settings.welcome_description ?? ""}
            onChange={(e) => onChange({ welcome_description: e.target.value })}
            placeholder="A short line shown before respondents start"
            rows={2}
            className="w-full border border-border rounded-lg px-3.5 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink"
          />
        </section>

        <section>
          <h3 className="text-xs font-semibold text-ink-soft uppercase tracking-wide mb-3">Ending screen</h3>
          <label className="text-xs text-ink-soft block mb-1">Thank-you message</label>
          <textarea
            value={settings.thank_you_message ?? ""}
            onChange={(e) => onChange({ thank_you_message: e.target.value })}
            placeholder="Thanks for completing this form!"
            rows={2}
            className="w-full border border-border rounded-lg px-3.5 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink"
          />
        </section>

        <section>
          <h3 className="text-xs font-semibold text-ink-soft uppercase tracking-wide mb-3">Theme color</h3>
          <div className="flex flex-wrap items-center gap-2.5">
            {PRESET_COLORS.map((color) => {
              const selected = (settings.theme_color ?? "#0d0d0d").toLowerCase() === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => onChange({ theme_color: color })}
                  className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ring-offset-2 transition-shadow"
                  style={{ background: color, boxShadow: selected ? `0 0 0 2px white, 0 0 0 4px ${color}` : "none" }}
                  aria-label={color}
                >
                  {selected && <CheckIcon width={14} height={14} className="text-white" />}
                </button>
              );
            })}
            <input
              type="color"
              value={settings.theme_color ?? "#0d0d0d"}
              onChange={(e) => onChange({ theme_color: e.target.value })}
              className="w-8 h-8 rounded-full cursor-pointer border border-border overflow-hidden p-0"
              aria-label="Custom color"
            />
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold text-ink-soft uppercase tracking-wide mb-3">Background</h3>
          <div className="flex flex-wrap items-center gap-2.5">
            {PRESET_BACKGROUNDS.map((color) => {
              const selected = (settings.theme_background ?? "#ffffff").toLowerCase() === color;
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => onChange({ theme_background: color })}
                  className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer border border-border"
                  style={{ background: color, boxShadow: selected ? `0 0 0 2px white, 0 0 0 4px ${settings.theme_color ?? "#0d0d0d"}` : "none" }}
                  aria-label={color}
                >
                  {/* Contrasts against this swatch's own literal color, not the app theme -
                      text-ink would flip to near-white in dark mode and vanish here. */}
                  {selected && (
                    <CheckIcon
                      width={14}
                      height={14}
                      className={color === "#0d0d0d" ? "text-white" : "text-[#191919]"}
                    />
                  )}
                </button>
              );
            })}
            <input
              type="color"
              value={settings.theme_background ?? "#ffffff"}
              onChange={(e) => onChange({ theme_background: e.target.value })}
              className="w-8 h-8 rounded-full cursor-pointer border border-border overflow-hidden p-0"
              aria-label="Custom background"
            />
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold text-ink-soft uppercase tracking-wide mb-3">Coming soon</h3>
          <div className="border border-dashed border-border rounded-lg px-3.5 py-3 bg-surface/40 space-y-2">
            <p className="text-sm text-ink">Integrations / webhooks</p>
            <p className="text-sm text-ink">Team collaboration & sharing</p>
            <p className="text-sm text-ink">Payment/file-upload question types</p>
            <p className="text-sm text-ink">Real creator authentication (default logged-in creator for now)</p>
          </div>
        </section>
      </div>
    </Modal>
  );
}
