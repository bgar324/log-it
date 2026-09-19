// Shared edge/fill/focus behavior. Callers retain their current layout and density.
// Literal hairlines work outside dashboard/split scopes, including portals.
const fieldHairline =
  "border-[color:color-mix(in_srgb,var(--text)_12%,transparent)]";
const fieldFocus =
  "outline-none focus:border-[color:color-mix(in_srgb,var(--text)_24%,transparent)] focus:shadow-[0_0_0_3px_var(--focus-ring)]";

export const fieldBoxed = `app-field-box border ${fieldHairline} bg-[var(--field-bg)] text-[var(--text)] ${fieldFocus}`;

// A ring would redraw the box intentionally removed from identity fields.
export const fieldUnderline = `app-field-line border-0 border-b ${fieldHairline} bg-transparent text-[var(--text)] outline-none focus:border-[color:var(--text)]`;
