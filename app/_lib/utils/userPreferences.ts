// Tipos para las preferencias de usuario
export interface UserPreferences {
  reminders: {
    showDueReminders: boolean;  // Mostrar recordatorios vencidos en el dashboard
    showUpcomingReminders: boolean;  // Mostrar recordatorios próximos en el dashboard
  };
  // Aquí se pueden agregar más categorías de preferencias en el futuro
}

// Preferencias por defecto
export const DEFAULT_PREFERENCES: UserPreferences = {
  reminders: {
    showDueReminders: true,
    showUpcomingReminders: true
  }
};

// Clave para almacenar las preferencias en localStorage
const USER_PREFERENCES_KEY = 'billexpress-user-preferences';

/**
 * Obtiene las preferencias del usuario, mezcladas con las predeterminadas.
 * @param userId ID del usuario para personalizar la clave de almacenamiento
 * @returns Las preferencias del usuario
 */
export const getUserPreferences = (userId?: string): UserPreferences => {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;

  try {
    const storageKey = userId ? `${USER_PREFERENCES_KEY}-${userId}` : USER_PREFERENCES_KEY;
    const savedPreferences = localStorage.getItem(storageKey);
    
    if (!savedPreferences) {
      return DEFAULT_PREFERENCES;
    }
    
    const parsedPreferences = JSON.parse(savedPreferences);
    
    // Mezclar con preferencias predeterminadas para asegurar que todas las propiedades existen
    return {
      ...DEFAULT_PREFERENCES,
      ...parsedPreferences,
      // Asegurarse que la sección de recordatorios siempre tenga todas las propiedades necesarias
      reminders: {
        ...DEFAULT_PREFERENCES.reminders,
        ...(parsedPreferences.reminders || {})
      }
    };
  } catch (error) {
    console.error('Error al cargar preferencias de usuario:', error);
    return DEFAULT_PREFERENCES;
  }
};

/**
 * Actualiza las preferencias del usuario
 * @param preferences Preferencias actualizadas a guardar
 * @param userId ID del usuario para personalizar la clave de almacenamiento
 */
export const saveUserPreferences = (preferences: UserPreferences, userId?: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const storageKey = userId ? `${USER_PREFERENCES_KEY}-${userId}` : USER_PREFERENCES_KEY;
    
    // Obtener las preferencias actuales y mezclarlas con las nuevas
    const currentPreferences = getUserPreferences(userId);
    const updatedPreferences = {
      ...currentPreferences,
      ...preferences,
      // Asegurar que los recordatorios se actualicen correctamente
      reminders: {
        ...currentPreferences.reminders,
        ...(preferences.reminders || {})
      }
    };
    
    localStorage.setItem(storageKey, JSON.stringify(updatedPreferences));
  } catch (error) {
    console.error('Error al guardar preferencias de usuario:', error);
  }
};

/**
 * Actualiza una sola preferencia dentro de una categoría
 * @param category Categoría de la preferencia ('reminders', etc.)
 * @param key Clave de la preferencia
 * @param value Nuevo valor
 * @param userId ID del usuario
 */
export const updateSinglePreference = <T extends keyof UserPreferences, K extends keyof UserPreferences[T]>(
  category: T,
  key: K,
  value: UserPreferences[T][K],
  userId?: string
): void => {
  const currentPreferences = getUserPreferences(userId);
  
  // Crear un objeto con la estructura anidada correcta para esta preferencia específica
  const updatedCategory = {
    ...currentPreferences[category],
    [key]: value
  };
  
  // Crear el objeto completo de preferencias con la categoría actualizada
  const updatedPreferences = {
    ...currentPreferences,
    [category]: updatedCategory
  };
  
  saveUserPreferences(updatedPreferences, userId);
}; 