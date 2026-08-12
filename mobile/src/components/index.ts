/**
 * SithaMithuru Design System — shared component barrel.
 *
 * Screens should import UI primitives from here rather than hand-rolling
 * their own headers/buttons/cards/state views:
 *
 *   import { ScreenHeader, Button, Card, EmptyState } from '../../components';
 */

// ─── Core design-system primitives ──────────────────────────────────────────
export { default as ScreenHeader } from './ScreenHeader';
export type { ScreenHeaderProps } from './ScreenHeader';

export { default as Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { default as Card } from './Card';
export type { CardProps } from './Card';

export { default as StatusBadge } from './StatusBadge';
export type { StatusBadgeProps, StatusKind } from './StatusBadge';

export { LoadingState, EmptyState, ErrorState } from './ScreenState';
export type { LoadingStateProps, EmptyStateProps, ErrorStateProps } from './ScreenState';

// ─── Existing shared components ─────────────────────────────────────────────
export { default as AppText } from './AppText';
export { default as AccessibleButton } from './AccessibleButton';
export { default as OfflineBanner } from './OfflineBanner';
export { default as SyncStatusBanner } from './SyncStatusBanner';
export { default as BottomNavBar } from './BottomNavBar';
export { default as GuardianBottomNav } from './GuardianBottomNav';
export { default as SkeletonCard, SkeletonList, SkeletonStatsGrid } from './SkeletonCard';
