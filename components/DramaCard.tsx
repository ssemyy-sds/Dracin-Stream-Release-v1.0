
import React, { useState } from 'react';
import { Drama } from '../types';
import { Play, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DramaCardProps {
  drama: Drama;
  featured?: boolean;
}

export const DramaCard: React.FC<DramaCardProps> = ({ drama, featured = false }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div 
      className={`relative group cursor-pointer transition-all duration-300 ${featured ? 'md:col-span-2 md:row-span-2' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(`/watch/${drama.id}`)}
    >
      <div className={`relative overflow-hidden rounded-md bg-brand-gray aspect-[2/3] ${featured ? 'md:aspect-video' : ''}`}>
        {/* Optimized Skeleton Loader */}
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-gray-800 flex items-center justify-center z-10">
            <ImageIcon className="h-8 w-8 text-gray-700" />
          </div>
        )}
        
        <img 
          src={featured && drama.poster ? drama.poster : drama.thumbnail} 
          alt={drama.title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'} ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Hover Action */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-brand-orange/90 rounded-full p-4 transform scale-0 group-hover:scale-100 transition-transform duration-300 shadow-lg">
            <Play className="h-6 w-6 text-white fill-current" />
          </div>
        </div>

        {/* Content Info */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
          <h3 className="text-white font-semibold truncate text-sm md:text-base drop-shadow-md">{drama.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-300 text-xs border border-gray-500 px-1 rounded">{drama.year}</span>
            <span className="text-gray-300 text-xs truncate max-w-[100px]">{drama.genres[0]}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
