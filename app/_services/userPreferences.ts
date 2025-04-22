// User preferences service to manage dashboard settings
// This includes preferences for showing reminders, notifications, etc.

// Default user preferences
export interface UserPreferences {
  showDashboardReminders: boolean;
  showNotifications: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  showDashboardReminders: true,
  showNotifications: true,
};

// Storage key in localStorage
const STORAGE_KEY = 'billexpress_user_preferences';

/**
 * Get user preferences from localStorage or return defaults
 */
export function getUserPreferences(): UserPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }
  
  try {
    const storedPrefs = localStorage.getItem(STORAGE_KEY);
    if (!storedPrefs) {
      return DEFAULT_PREFERENCES;
    }
    
    return { 
      ...DEFAULT_PREFERENCES, 
      ...JSON.parse(storedPrefs) 
    };
  } catch (error) {
    console.error('Error loading user preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Update a specific user preference
 */
export function updateUserPreference<K extends keyof UserPreferences>(
  key: K, 
  value: UserPreferences[K]
): UserPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }
  
  try {
    const currentPrefs = getUserPreferences();
    const updatedPrefs = {
      ...currentPrefs,
      [key]: value
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPrefs));
    return updatedPrefs;
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Reset user preferences to defaults
 */
export function resetUserPreferences(): UserPreferences {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PREFERENCES));
  return DEFAULT_PREFERENCES;
} 