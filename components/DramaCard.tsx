
import React from 'react';
import { Drama } from '../types';
import { Play, Star, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DramaCardProps {
    drama: Drama;
}

export const DramaCard: React.FC<DramaCardProps> = ({ drama }) => {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(`/detail/${drama.bookId}`)}
            className="group relative cursor-pointer"
        >
            {/* Poster Container */}
            <div className="aspect-[2/3] rounded-2xl overflow-hidden relative shadow-2xl transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-brand-orange/20">
                <img
                    src={drama.cover}
                    alt={drama.bookName}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                />

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                    <div className="bg-brand-orange rounded-full p-4 shadow-xl shadow-brand-orange/40">
                        <Play className="h-6 w-6 text-white fill-current" />
                    </div>
                </div>

                {/* Floating Badges */}
                <div className="absolute top-3 right-3 z-10">
                    <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] text-brand-orange font-black flex items-center gap-1 border border-white/10">
                        <Star className="h-3 w-3 fill-current" />
                        {drama.rating}
                    </div>
                </div>

                <div className="absolute bottom-3 left-3 z-10 flex gap-2">
                    <div className="bg-brand-orange text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg">
                        EP {drama.latestEpisode}
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="mt-4">
                <h4 className="text-white font-bold text-sm md:text-base line-clamp-1 group-hover:text-brand-orange transition-colors duration-200">
                    {drama.bookName}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-gray-500 text-[11px] font-medium">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {drama.year}</span>
                    <span className="w-1 h-1 bg-gray-700 rounded-full" />
                    <span className="truncate">{drama.genres[0] || 'Drama'}</span>
                </div>
            </div>
        </div>
    );
};
