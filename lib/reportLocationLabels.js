// Report-only display names for each location. These are separate from the
// `locations` table names used elsewhere in the app (dropdowns, Van Locations
// tab) - this mapping only affects the CSV export and the Reports summary view.
export const REPORT_LOCATION_LABELS = {
  AH: 'Main Warehouse',
  SD: 'San Diego Showroom',
  NC: 'Nor Cal Storage',
};

export function reportLocationLabel(prefix) {
  return REPORT_LOCATION_LABELS[prefix] || prefix;
}
