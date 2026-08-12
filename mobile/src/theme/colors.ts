/**
 * SithaMithuru Design System — Color Tokens
 *
 * Version: 4.0.0 — "Blue & White"
 * Updated: Phase 3 — Design System & Full UI/UX Transformation
 *
 * Replaces the v3.0.0 marigold/teal "Sithumina" palette per explicit user
 * direction: a clean blue-and-white identity — trustworthy, medical-grade
 * legible, calm. All token names are preserved for backward compatibility —
 * every screen that already imports `colors` picks up the new palette
 * automatically. Screens that still hardcode a local color copy instead of
 * importing this file need to be migrated onto these tokens to pick up the
 * palette at all.
 */

export const colors = {
  // ─── Primary Brand ──────────────────────────────────────────────────────────
  primary:           '#1466C2', // Strong trustworthy blue
  primaryLight:      '#4A8FDE', // Lighter blue for hover/active states
  primaryDark:       '#0D4A94', // Deep blue for text on light containers
  primaryContainer:  '#E1EDFB', // Soft blue surface for cards & chips
  onPrimary:         '#FFFFFF', // White text on blue backgrounds
  onPrimaryContainer:'#0D4A94', // Dark blue text on blue container

  // ─── Secondary ──────────────────────────────────────────────────────────────
  secondary:          '#33608A', // Steel blue — secondary/guardian actions
  secondaryLight:     '#5C86AD',
  secondaryContainer: '#E3EBF2',
  onSecondary:        '#FFFFFF',
  onSecondaryContainer:'#1D3A56',

  // ─── Semantic — Success ─────────────────────────────────────────────────────
  // Used for "Taken", "Completed", "Online" states
  success:          '#1E8E5A', // Green — distinct from primary blue
  successDark:      '#146640',
  successContainer: '#E1F3EA',
  onSuccess:        '#FFFFFF',

  // ─── Semantic — Warning ─────────────────────────────────────────────────────
  // Used for "Upcoming", "Pending", "Mild Risk" states
  warning:          '#C98A1B', // Amber-gold — visible without alarm
  warningDark:      '#8F6212',
  warningContainer: '#FBF0DC',
  onWarning:        '#FFFFFF',

  // ─── Semantic — Error / Emergency ───────────────────────────────────────────
  // STRICTLY reserved for active SOS triggers and missed critical medications
  error:          '#E1523D', // Coral-red — legible, less clinical than pure red
  errorDark:      '#A83A2A',
  errorContainer: '#FBE2DE',
  onError:        '#FFFFFF',

  // ─── Semantic — Information ──────────────────────────────────────────────────
  info:          '#1D6FE0', // Bright blue for informational states (upcoming, rescheduled)
  infoDark:      '#124B9C',
  infoContainer: '#E3EDFC',
  onInfo:        '#FFFFFF',

  // ─── Surface & Background ───────────────────────────────────────────────────
  background:     '#F5F8FC', // Subtle blue-white — calm, non-clinical background
  surface:        '#FFFFFF', // Pure white cards
  surfaceVariant: '#EAF1F9', // Light blue-grey tint for alternating rows
  outline:        '#D3E0EC', // Subtle blue-grey border between cards
  outlineVariant: '#E7EEF5', // Even lighter dividers within cards

  // ─── Text ───────────────────────────────────────────────────────────────────
  text: {
    primary:   '#16283D', // Deep navy-charcoal — maximum readability
    secondary: '#5A7185', // Muted steel-blue — captions, timestamps, sub-labels
    tertiary:  '#93A6B7', // Light blue-grey — disabled hints and placeholder text
    disabled:  '#C3D0DA',
    inverse:   '#FFFFFF', // Text on dark/colored backgrounds
    link:      '#1466C2', // Primary blue links
  },

  // ─── Status Category Colors ──────────────────────────────────────────────────
  // Used on timeline dots, activity icons, and notification chips
  category: {
    sos:      { bg: '#FBE2DE', accent: '#E1523D' }, // Emergency — coral-red
    medicine: { bg: '#E1EDFB', accent: '#1466C2' }, // Medication — primary blue
    tasks:    { bg: '#E3EBF2', accent: '#33608A' }, // Tasks — steel blue
    mood:     { bg: '#FBF0DC', accent: '#C98A1B' }, // Mood — amber-gold
    journal:  { bg: '#EAE6F5', accent: '#6E5AA8' }, // Journal — soft violet (reflection)
    guardian: { bg: '#E3EBF2', accent: '#33608A' }, // Guardian actions — steel blue
    sync:     { bg: '#EAF1F9', accent: '#93A6B7' }, // Sync events — blue-grey
  },

  // ─── Risk Level Colors ───────────────────────────────────────────────────────
  // Used on health score cards and risk profile indicators
  risk: {
    low:    '#1E8E5A', // Green — safe
    medium: '#C98A1B', // Amber-gold — caution
    high:   '#E1523D', // Coral-red — intervention needed
  },

  // ─── Navigation ─────────────────────────────────────────────────────────────
  navActive:   '#1466C2', // Active tab icon and label
  navInactive: '#93A6B7', // Inactive tab icon and label
  navBg:       '#FFFFFF', // Bottom nav background

  // ─── Status Badges ──────────────────────────────────────────────────────────
  // For medication timeline, task list, and notification badges
  status: {
    taken:       { bg: '#E1F3EA', text: '#146640', border: '#B7DFC9' },
    upcoming:    { bg: '#FBF0DC', text: '#8F6212', border: '#EFD8A0' },
    missed:      { bg: '#FBE2DE', text: '#A83A2A', border: '#F1BEB4' },
    rescheduled: { bg: '#E3EDFC', text: '#124B9C', border: '#B9D3F5' },
    completed:   { bg: '#E1F3EA', text: '#146640', border: '#B7DFC9' },
    pending:     { bg: '#FBF0DC', text: '#8F6212', border: '#EFD8A0' },
    resolved:    { bg: '#EAF1F9', text: '#5A7185', border: '#D3E0EC' },
  },

  // ─── Backward-Compatibility & Direct Conveniences ─────────────────────────────
  textPrimary:    '#16283D',
  textSecondary:  '#5A7185',
  textMuted:      '#93A6B7',
  textDisabled:   '#C3D0DA',
  textInverse:    '#FFFFFF',
  card:           '#FFFFFF',
  bg:             '#F5F8FC',
  border:         '#D3E0EC',
  borderLight:    '#E7EEF5',
  emergency:      '#E1523D',
  emergencyLight: '#FBE2DE',
  warningLight:   '#FBF0DC',
  infoLight:      '#E3EDFC',
  skeleton:       '#EAF1F9',
};

export default colors;
