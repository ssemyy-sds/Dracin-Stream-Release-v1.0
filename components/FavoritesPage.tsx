
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';
import { DramaCard } from './DramaCard';
import { Heart, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from './ui/Button';
import { Drama } from '../types';

export const FavoritesPage: React.FC = () => {
    const navigate = useNavigate();
    const { favorites, isLoading, removeFromFavorites } = useFavorites();

    const handleRemove = (e: React.MouseEvent, bookId: string) => {
        e.stopPropagation();
        removeFromFavorites(bookId);
    };

    // Convert FavoriteItem to Drama for DramaCard
    const favoritesAsDrama: Drama[] = favorites.map(fav => ({
        bookId: fav.bookId,
        bookName: fav.bookName,
        cover: fav.cover,
        introduction: '',
        rating: 0,
        genres: ['Drama'],
        status: 'Ongoing' as const,
        year: new Date().getFullYear(),
        latestEpisode: 0
    }));

    if (isLoading) {
        return (
            <div className="min-h-screen bg-brand-black pt-24 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-black pt-24 px-4 md:px-12 pb-12">
            {/* Header */}
            <div className="mb-8 border-b border-gray-800 pb-4">
                <div className="flex items-center gap-4 mb-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-400" />
                    </button>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Heart className="h-8 w-8 text-red-500 fill-current" />
                        Watchlist Saya
                    </h1>
                </div>
                <p className="text-gray-400 mt-2 text-sm ml-14">
                    {favorites.length > 0
                        ? `${favorites.length} drama tersimpan`
                        : 'Belum ada drama yang disimpan'
                    }
                </p>
            </div>

            {/* Content */}
            {favorites.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                    {favoritesAsDrama.map((drama) => (
                        <div key={drama.bookId} className="relative group">
                            <DramaCard drama={drama} />

                            {/* Remove Button Overlay */}
                            <button
                                onClick={(e) => handleRemove(e, drama.bookId)}
                                className="absolute top-2 right-2 z-20 p-2 bg-red-500/90 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-75 group-hover:scale-100 shadow-lg"
                                title="Hapus dari Watchlist"
                            >
                                <Trash2 className="h-4 w-4 text-white" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-white/5 rounded-full mb-6">
                        <Heart className="h-10 w-10 text-gray-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-2">Watchlist Kosong</h2>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                        Tambahkan drama ke watchlist dengan menekan ikon ❤️ di halaman detail atau saat menonton.
                    </p>
                    <Button onClick={() => navigate('/')} className="gap-2">
                        Jelajahi Drama
                    </Button>
                </div>
            )}
        </div>
    );
};
