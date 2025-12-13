/**
 * Note visibility types
 */
export type NoteVisibility = 'public' | 'followers' | 'private'

/**
 * Icon type identifiers for visibility badges
 */
export type VisibilityIconType = 'globe' | 'users' | 'lock'

/**
 * Configuration for visibility badges
 */
export interface VisibilityConfig {
  icon: VisibilityIconType
  label: string
  badgeClass: string
  description: string
}

/**
 * Centralized visibility configuration
 * Replaces multiple switch statements that do the same lookup
 */
const VISIBILITY_CONFIG: Record<NoteVisibility, VisibilityConfig> = {
  public: {
    icon: 'globe',
    label: 'Public',
    badgeClass: 'badge-success',
    description: 'Visible to everyone'
  },
  followers: {
    icon: 'users',
    label: 'Followers',
    badgeClass: 'badge-info',
    description: 'Visible to followers only'
  },
  private: {
    icon: 'lock',
    label: 'Only me',
    badgeClass: 'badge-warning',
    description: 'Visible only to you'
  }
}

/**
 * Get full visibility configuration for a visibility type
 */
export function getVisibilityConfig(visibility: NoteVisibility): VisibilityConfig {
  return VISIBILITY_CONFIG[visibility]
}

/**
 * Get the icon type for a visibility setting
 */
export function getVisibilityIcon(visibility: NoteVisibility): VisibilityIconType {
  return VISIBILITY_CONFIG[visibility].icon
}

/**
 * Get the display label for a visibility setting
 */
export function getVisibilityLabel(visibility: NoteVisibility): string {
  return VISIBILITY_CONFIG[visibility].label
}

/**
 * Get the badge CSS class for a visibility setting
 */
export function getVisibilityBadgeClass(visibility: NoteVisibility): string {
  return VISIBILITY_CONFIG[visibility].badgeClass
}

/**
 * Get the description for a visibility setting
 */
export function getVisibilityDescription(visibility: NoteVisibility): string {
  return VISIBILITY_CONFIG[visibility].description
}

/**
 * All visibility options for dropdowns/selects
 */
export const VISIBILITY_OPTIONS: Array<{ value: NoteVisibility; label: string; description: string }> = [
  { value: 'public', ...VISIBILITY_CONFIG.public },
  { value: 'followers', ...VISIBILITY_CONFIG.followers },
  { value: 'private', ...VISIBILITY_CONFIG.private }
]
