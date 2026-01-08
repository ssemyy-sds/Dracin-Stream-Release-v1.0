
import { useState, useEffect, useCallback } from 'react';
import { FavoriteItem, favoritesService } from '../services/favorites';
import { Drama } from '../types';

export const useFavorites = () => {
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load favorites on mount
    const loadFavorites = useCallback(() => {
        setFavorites(favoritesService.getFavorites());
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadFavorites();

        // Listen for changes from other components
        const handleChange = () => {
            loadFavorites();
        };

        window.addEventListener('favoritesChanged', handleChange);
        return () => window.removeEventListener('favoritesChanged', handleChange);
    }, [loadFavorites]);

    // Check if a drama is favorite
    const checkIsFavorite = useCallback((bookId: string): boolean => {
        return favorites.some(fav => fav.bookId === bookId);
    }, [favorites]);

    // Toggle favorite
    const toggleFavorite = useCallback((drama: Drama | FavoriteItem): boolean => {
        const result = favoritesService.toggleFavorite(drama);
        loadFavorites(); // Refresh state
        return result;
    }, [loadFavorites]);

    // Add to favorites
    const addToFavorites = useCallback((drama: Drama | FavoriteItem): boolean => {
        const result = favoritesService.addFavorite(drama);
        loadFavorites();
        return result;
    }, [loadFavorites]);

    // Remove from favorites
    const removeFromFavorites = useCallback((bookId: string): boolean => {
        const result = favoritesService.removeFavorite(bookId);
        loadFavorites();
        return result;
    }, [loadFavorites]);

    return {
        favorites,
        isLoading,
        count: favorites.length,
        checkIsFavorite,
        toggleFavorite,
        addToFavorites,
        removeFromFavorites,
        refresh: loadFavorites
    };
};

// Simple hook just for checking favorite status of a single item
export const useIsFavorite = (bookId: string) => {
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        setIsFavorite(favoritesService.isFavorite(bookId));

        const handleChange = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (!detail || detail.bookId === bookId || detail.action === 'clear') {
                setIsFavorite(favoritesService.isFavorite(bookId));
            }
        };

        window.addEventListener('favoritesChanged', handleChange);
        return () => window.removeEventListener('favoritesChanged', handleChange);
    }, [bookId]);

    const toggle = useCallback((drama: Drama | FavoriteItem) => {
        const result = favoritesService.toggleFavorite(drama);
        setIsFavorite(result);
        return result;
    }, []);

    return { isFavorite, toggle };
};
