/**
 * SithaMithuru Design System — Color Tokens
 *
 * Version: 2.0.0
 * Updated: Phase 1 — Guardian Mode Build
 *
 * Product Foundation mandates a calming healthcare green (#2E7D32) as the primary
 * color to reinforce trust, safety, and wellness associations for elderly users
 * and their guardians. The previous purple (#6C63FF) system has been fully replaced.
 *
 * All token names are preserved for backward compatibility.
 * No other files need to change — just import colors.primary.
 */

export const colors = {
  // ─── Primary Brand ──────────────────────────────────────────────────────────
  primary:           '#2E7D32', // Forest green — healthcare trust & safety
  primaryLight:      '#4CAF50', // Lighter green for hover/active states
  primaryDark:       '#1B5E20', // Deep green for text on light containers
  primaryContainer:  '#E8F5E9', // Soft green surface for cards & chips
  onPrimary:         '#FFFFFF', // White text on green backgrounds
  onPrimaryContainer:'#1B5E20', // Dark green text on green container

  // ─── Secondary ──────────────────────────────────────────────────────────────
  secondary:          '#546E7A', // Blue-grey for secondary actions
  secondaryLight:     '#78909C',
  secondaryContainer: '#ECEFF1',
  onSecondary:        '#FFFFFF',
  onSecondaryContainer:'#263238',

  // ─── Semantic — Success ─────────────────────────────────────────────────────
  // Used for "Taken", "Completed", "Online" states
  success:          '#2E7D32', // Aligned with primary for healthcare
  successDark:      '#1B5E20',
  successContainer: '#E8F5E9',
  onSuccess:        '#FFFFFF',

  // ─── Semantic — Warning ─────────────────────────────────────────────────────
  // Used for "Upcoming", "Pending", "Mild Risk" states
  warning:          '#F9A825', // Amber — visible without alarm
  warningDark:      '#F57F17',
  warningContainer: '#FFF8E1',
  onWarning:        '#FFFFFF',

  // ─── Semantic — Error / Emergency ───────────────────────────────────────────
  // STRICTLY reserved for active SOS triggers and missed critical medications
  error:          '#D32F2F', // Healthcare-grade red — serious & legible
  errorDark:      '#B71C1C',
  errorContainer: '#FFEBEE',
  onError:        '#FFFFFF',

  // ─── Semantic — Information ──────────────────────────────────────────────────
  info:          '#1565C0', // Blue for informational states (upcoming, rescheduled)
  infoDark:      '#0D47A1',
  infoContainer: '#E3F2FD',
  onInfo:        '#FFFFFF',

  // ─── Surface & Background ───────────────────────────────────────────────────
  background:     '#F8FAFC', // Light slate — calm, non-clinical background
  surface:        '#FFFFFF', // Pure white cards
  surfaceVariant: '#F0F4F8', // Slightly tinted surface for alternating rows
  outline:        '#CBD5E1', // Subtle borders between cards
  outlineVariant: '#E2E8F0', // Even lighter dividers within cards

  // ─── Text ───────────────────────────────────────────────────────────────────
  text: {
    primary:   '#1E293B', // Near-black — maximum readability for healthcare
    secondary: '#64748B', // Medium slate — captions, timestamps, sub-labels
    tertiary:  '#94A3B8', // Light — disabled hints and placeholder text
    disabled:  '#CBD5E1',
    inverse:   '#FFFFFF', // Text on dark/colored backgrounds
    link:      '#2E7D32', // Green links match primary brand
  },

  // ─── Status Category Colors ──────────────────────────────────────────────────
  // Used on timeline dots, activity icons, and notification chips
  category: {
    sos:      { bg: '#FFEBEE', accent: '#D32F2F' }, // Emergency — red
    medicine: { bg: '#E8F5E9', accent: '#2E7D32' }, // Medication — green
    tasks:    { bg: '#E3F2FD', accent: '#1565C0' }, // Tasks — blue
    mood:     { bg: '#FFF8E1', accent: '#F9A825' }, // Mood — amber
    journal:  { bg: '#FFF3E0', accent: '#E65100' }, // Journal — orange
    guardian: { bg: '#E8F5E9', accent: '#2E7D32' }, // Guardian actions — green
    sync:     { bg: '#F0F4F8', accent: '#94A3B8' }, // Sync events — grey
  },

  // ─── Risk Level Colors ───────────────────────────────────────────────────────
  // Used on health score cards and risk profile indicators
  risk: {
    low:    '#2E7D32', // Green — safe
    medium: '#F9A825', // Amber — caution
    high:   '#D32F2F', // Red — intervention needed
  },

  // ─── Navigation ─────────────────────────────────────────────────────────────
  navActive:   '#2E7D32', // Active tab icon and label
  navInactive: '#94A3B8', // Inactive tab icon and label
  navBg:       '#FFFFFF', // Bottom nav background

  // ─── Status Badges ──────────────────────────────────────────────────────────
  // For medication timeline, task list, and notification badges
  status: {
    taken:       { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' },
    upcoming:    { bg: '#FFF8E1', text: '#F9A825', border: '#FFE082' },
    missed:      { bg: '#FFEBEE', text: '#D32F2F', border: '#FFCDD2' },
    rescheduled: { bg: '#E3F2FD', text: '#1565C0', border: '#90CAF9' },
    completed:   { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' },
    pending:     { bg: '#FFF8E1', text: '#F9A825', border: '#FFE082' },
    resolved:    { bg: '#F0F4F8', text: '#546E7A', border: '#CFD8DC' },
  },
};

export default colors;
