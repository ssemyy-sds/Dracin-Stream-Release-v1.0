
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, X, Heart, Laptop, Gift, Play, ChevronRight, History } from 'lucide-react';
import { Button } from './ui/Button';
import { useFavorites } from '../hooks/useFavorites';
import { DonationModal } from './DonationModal';

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showFavoritesDropdown, setShowFavoritesDropdown] = useState(false);
  const [isDonationOpen, setIsDonationOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { favorites, removeFromFavorites, count: favoritesCount } = useFavorites();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowFavoritesDropdown(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowFavoritesDropdown(!showFavoritesDropdown);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Trending', path: '/category/trending' },
    { name: 'Latest', path: '/category/latest' },
    { name: 'Vip', path: '/category/vip' },
    { name: 'Test Home', path: '/test-home' },
  ];

  const FavoritesDropdown = () => (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 max-h-[70vh] bg-black/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
        <h3 className="text-white font-bold flex items-center gap-2">
          <Heart className="h-4 w-4 text-red-500 fill-current" />
          Watchlist
        </h3>
        <span className="bg-brand-orange text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
          {favoritesCount}
        </span>
      </div>

      <div className="overflow-y-auto max-h-[50vh] custom-scrollbar">
        {favoritesCount === 0 ? (
          <div className="p-8 text-center">
            <div className="bg-white/5 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <Heart className="h-6 w-6 text-gray-600" />
            </div>
            <p className="text-gray-400 text-sm">Watchlist kamu kosong</p>
            <button
              onClick={() => { setShowFavoritesDropdown(false); navigate('/'); }}
              className="text-brand-orange text-xs mt-2 font-semibold hover:underline"
            >
              Cari drama seru
            </button>
          </div>
        ) : (
          <div className="p-2">
            {favorites.slice(0, 10).map((drama) => (
              <div
                key={drama.bookId}
                onClick={() => {
                  setShowFavoritesDropdown(false);
                  navigate(`/detail/${drama.bookId}`);
                }}
                className="flex gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer group relative"
              >
                <div className="flex-shrink-0 w-12 aspect-[2/3] rounded overflow-hidden">
                  <img src={drama.cover} alt={drama.bookName} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <h4 className="text-white text-sm font-medium truncate group-hover:text-brand-orange transition-colors">
                    {drama.bookName}
                  </h4>
                  <p className="text-gray-500 text-[10px] mt-1 flex items-center gap-1">
                    <History className="h-3 w-3" />
                    Tersimpan
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromFavorites(drama.bookId);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            {favoritesCount > 10 && (
              <button
                onClick={() => { setShowFavoritesDropdown(false); navigate('/favorites'); }}
                className="w-full py-3 text-center text-xs text-gray-400 hover:text-white transition-colors border-t border-white/5 mt-2"
              >
                Lihat semua {favoritesCount} drama <ChevronRight className="inline h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {favoritesCount > 0 && (
        <div className="p-3 bg-white/5 border-t border-white/10">
          <Button
            size="sm"
            className="w-full gap-2 text-xs font-bold rounded-lg"
            onClick={() => { setShowFavoritesDropdown(false); navigate('/favorites'); }}
          >
            Buka Watchlist <Play className="h-3 w-3 fill-current" />
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/80 backdrop-blur-xl border-b border-white/10 py-3' : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent py-5'
          }`}
      >
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <h1
              onClick={() => navigate('/')}
              className="text-2xl font-black tracking-tighter text-brand-orange cursor-pointer flex items-center gap-2 group"
            >
              <div className="bg-brand-orange text-black p-1 rounded group-hover:rotate-12 transition-transform">
                <Play className="h-5 w-5 fill-current" />
              </div>
              <span className="bg-gradient-to-r from-brand-orange to-orange-400 bg-clip-text text-transparent">
                DRACIN
              </span>
            </h1>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className={`text-sm font-medium transition-all hover:text-brand-orange relative group ${location.pathname === link.path ? 'text-brand-orange' : 'text-gray-300'
                    }`}
                >
                  {link.name}
                  {location.pathname === link.path && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-brand-orange rounded-full animate-in fade-in zoom-in duration-300" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Donation - Desktop Only */}
            <button
              onClick={() => setIsDonationOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-brand-orange/10 border border-brand-orange/20 rounded-full text-brand-orange text-xs font-bold hover:bg-brand-orange hover:text-white transition-all active:scale-95"
            >
              <Gift className="h-3.5 w-3.5" />
              Donasi
            </button>

            <button
              onClick={() => navigate('/search')}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Watchlist with Dropdown */}
            <div className="relative">
              <button
                onClick={handleFavoriteClick}
                className={`p-2 rounded-full transition-all flex items-center gap-1 group ${showFavoritesDropdown ? 'bg-brand-orange text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
              >
                <div className="relative">
                  <Heart className={`h-5 w-5 transition-transform group-hover:scale-110 ${favoritesCount > 0 ? 'fill-current text-red-500' : ''}`} />
                  {favoritesCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-brand-orange text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-black animate-in zoom-in">
                      {favoritesCount > 9 ? '9+' : favoritesCount}
                    </span>
                  )}
                </div>
              </button>

              {showFavoritesDropdown && <FavoritesDropdown />}
            </div>

            <button
              onClick={() => setShowMobileMenu(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Button
              className="hidden sm:flex rounded-full gap-2 px-6 font-bold shadow-lg shadow-brand-orange/20 active:scale-95 transition-transform"
              onClick={() => navigate('/category/vip')}
            >
              Daftar VIP
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-[100] bg-black p-6 flex flex-col animate-in slide-in-from-right duration-300">
          <div className="flex justify-between items-center mb-12">
            <h1 className="text-2xl font-black text-brand-orange">DRACIN</h1>
            <button onClick={() => setShowMobileMenu(false)} className="p-2 text-gray-400 hover:text-white bg-white/10 rounded-full">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex flex-col gap-6">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => {
                  navigate(link.path);
                  setShowMobileMenu(false);
                }}
                className={`text-2xl font-bold flex items-center justify-between group ${location.pathname === link.path ? 'text-brand-orange' : 'text-gray-100'
                  }`}
              >
                {link.name}
                <ChevronRight className={`h-6 w-6 transition-transform group-hover:translate-x-2 ${location.pathname === link.path ? 'text-brand-orange' : 'text-gray-600'}`} />
              </button>
            ))}
          </div>

          <div className="mt-auto pt-10 border-t border-white/10 space-y-4">
            <Button
              variant="secondary"
              className="w-full py-4 rounded-xl font-bold border-brand-orange/20 text-brand-orange gap-2"
              onClick={() => { setIsDonationOpen(true); setShowMobileMenu(false); }}
            >
              <Gift className="h-5 w-5" /> Donasi Project
            </Button>
            <Button className="w-full py-4 rounded-xl font-bold shadow-xl shadow-brand-orange/20">
              Daftar / Login
            </Button>
          </div>
        </div>
      )}

      <DonationModal isOpen={isDonationOpen} onClose={() => setIsDonationOpen(false)} />
    </>
  );
};
