
import { Drama } from '../types';

const FAVORITES_KEY = 'dracin_favorites';

export interface FavoriteItem {
    bookId: string;
    bookName: string;
    cover: string;
    addedAt: number; // timestamp
}

// Get all favorites from localStorage
export const getFavorites = (): FavoriteItem[] => {
    try {
        const stored = localStorage.getItem(FAVORITES_KEY);
        if (!stored) return [];
        return JSON.parse(stored);
    } catch (error) {
        console.error('[Favorites] Error reading favorites:', error);
        return [];
    }
};

// Check if a drama is in favorites
export const isFavorite = (bookId: string): boolean => {
    const favorites = getFavorites();
    return favorites.some(fav => fav.bookId === bookId);
};

// Add a drama to favorites
export const addFavorite = (drama: Drama | FavoriteItem): boolean => {
    try {
        const favorites = getFavorites();

        // Check if already exists
        if (favorites.some(fav => fav.bookId === drama.bookId)) {
            return false; // Already in favorites
        }

        const newFavorite: FavoriteItem = {
            bookId: drama.bookId,
            bookName: drama.bookName,
            cover: drama.cover,
            addedAt: Date.now()
        };

        favorites.unshift(newFavorite); // Add to beginning
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));

        // Dispatch custom event for cross-component reactivity
        window.dispatchEvent(new CustomEvent('favoritesChanged', {
            detail: { action: 'add', bookId: drama.bookId }
        }));

        return true;
    } catch (error) {
        console.error('[Favorites] Error adding favorite:', error);
        return false;
    }
};

// Remove a drama from favorites
export const removeFavorite = (bookId: string): boolean => {
    try {
        const favorites = getFavorites();
        const filtered = favorites.filter(fav => fav.bookId !== bookId);

        if (filtered.length === favorites.length) {
            return false; // Was not in favorites
        }

        localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));

        // Dispatch custom event for cross-component reactivity
        window.dispatchEvent(new CustomEvent('favoritesChanged', {
            detail: { action: 'remove', bookId }
        }));

        return true;
    } catch (error) {
        console.error('[Favorites] Error removing favorite:', error);
        return false;
    }
};

// Toggle favorite status
export const toggleFavorite = (drama: Drama | FavoriteItem): boolean => {
    if (isFavorite(drama.bookId)) {
        removeFavorite(drama.bookId);
        return false; // Now not favorite
    } else {
        addFavorite(drama);
        return true; // Now is favorite
    }
};

// Get favorites count
export const getFavoritesCount = (): number => {
    return getFavorites().length;
};

// Clear all favorites
export const clearFavorites = (): void => {
    localStorage.removeItem(FAVORITES_KEY);
    window.dispatchEvent(new CustomEvent('favoritesChanged', {
        detail: { action: 'clear' }
    }));
};

// Custom hook for favorites (to be used in React components)
export const favoritesService = {
    getFavorites,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    getFavoritesCount,
    clearFavorites
};
