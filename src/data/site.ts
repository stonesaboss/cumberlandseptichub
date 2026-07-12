// Central site configuration for Cumberland Septic Hub.
// Replace the tracking phone placeholder before launch — see README.

export const SITE_NAME = 'Cumberland Septic Hub';
export const SITE_TAGLINE = 'Septic Pumping, Repair & Installation';
export const REGION = 'Upper Cumberland, Tennessee';

// TRACKING PHONE PLACEHOLDER — replace with the real tracking number.
export const PHONE_DISPLAY = '(931) 555-0123';
export const PHONE_TEL = '+19315550123';

export const UTILITY_BAR_TEXT = 'Serving Cookeville, Crossville & Upper Cumberland';

export interface NavLink {
  label: string;
  href: string;
}

export const SERVICES_DROPDOWN: NavLink[] = [
  { label: 'Septic Pumping', href: '/septic-pumping-cookeville-tn/' },
  { label: 'Septic Tank Cleaning', href: '/septic-tank-cleaning-cookeville-tn/' },
  { label: 'Septic Repair', href: '/septic-repair-cookeville-tn/' },
  { label: 'Drain-Field Repair', href: '/drain-field-repair-cookeville-tn/' },
  { label: 'Septic Installation', href: '/septic-installation-cookeville-tn/' },
  { label: 'Septic Inspections', href: '/septic-inspection-cookeville-tn/' },
  { label: 'Emergency Service Requests', href: '/emergency-septic-service-cookeville-tn/' },
  { label: 'Septic Tank Locating', href: '/septic-tank-locating-cookeville-tn/' },
  { label: 'Commercial Grease-Trap Pumping', href: '/grease-trap-pumping-cookeville-tn/' },
];

export const AREAS_DROPDOWN: NavLink[] = [
  { label: 'Cookeville', href: '/septic-pumping-cookeville-tn/' },
  { label: 'Crossville', href: '/septic-pumping-crossville-tn/' },
  { label: 'Sparta', href: '/septic-services-sparta-tn/' },
  { label: 'Livingston', href: '/septic-services-livingston-tn/' },
  { label: 'Smithville', href: '/septic-services-smithville-tn/' },
  { label: 'Upper Cumberland Service Area', href: '/service-area/' },
];

export const FOOTER_DISCLOSURE =
  'Cumberland Septic Hub is an independent referral service and does not directly perform septic pumping, repair, inspection or installation unless expressly stated. Service requests may be shared with independent local providers. Provider availability, qualifications, licensing, insurance, pricing, scheduling, warranties and service terms are determined by the provider.';

export const FORM_DISCLOSURE =
  'Your request may be shared with an independent local septic provider.';

export const REFERRAL_PROCESS_DISCLOSURE =
  'Cumberland Septic Hub is an independent referral service that helps connect property owners with local septic service providers. Cumberland Septic Hub does not directly perform septic work unless expressly stated. Provider availability, qualifications, licensing, insurance, inspections, pricing, scheduling and service terms are determined independently by the provider.';

export const SERVICE_NEEDED_OPTIONS = [
  'Septic Pumping',
  'Septic Tank Cleaning',
  'Septic Repair',
  'Drain-Field Repair',
  'Septic Installation',
  'Replacement Septic System',
  'Septic Inspection',
  'Emergency Service Request',
  'Septic Tank Locating',
  'Commercial Septic Service',
  'Grease-Trap Pumping',
  'Not Sure',
] as const;

export const SYMPTOM_OPTIONS = [
  'No Current Problem — Routine Service',
  'Sewage Backup',
  'Slow Drains',
  'Gurgling Drains',
  'Septic Odor',
  'Wet or Green Drain-Field Area',
  'Tank or System Alarm',
  'Overflow Near Tank',
  'Recurring Backup',
  'Suspected Leak',
  'Installation Request',
  'Inspection Request',
  'Other',
  'Not Sure',
] as const;

export const TANK_LOCATION_OPTIONS = [
  'Yes',
  'Approximate Location Only',
  'No',
  'Not Sure',
] as const;

export const LAST_PUMPED_OPTIONS = [
  'Less Than 1 Year Ago',
  '1–3 Years Ago',
  '3–5 Years Ago',
  'More Than 5 Years Ago',
  'Never / New Property',
  'Unknown',
] as const;

export const CONTACT_TIME_OPTIONS = [
  'Anytime',
  'Morning',
  'Afternoon',
  'Evening',
] as const;

export interface Faq {
  question: string;
  answer: string;
}
