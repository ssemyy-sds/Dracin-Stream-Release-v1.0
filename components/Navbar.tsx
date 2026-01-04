import React, { useState, useEffect } from 'react';
import { Search, Bell, Menu, X, PlayCircle, Star, TrendingUp, Clock, Globe } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsMobileMenuOpen(false);
    }
  };

  const menuItems = [
    { label: 'For You', path: '/category/foryou', icon: Star },
    { label: 'Trending', path: '/category/trending', icon: TrendingUp },
    { label: 'Latest', path: '/category/latest', icon: Clock },
    { label: 'VIP', path: '/category/vip', icon: PlayCircle },
    { label: 'Dub Indo', path: '/category/dubindo', icon: Globe },
  ];

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || isMobileMenuOpen ? 'bg-black/90 backdrop-blur-md shadow-lg' : 'bg-gradient-to-b from-black/80 to-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <PlayCircle className="h-8 w-8 text-brand-orange" />
            <span className="text-xl font-bold tracking-tight text-white">DRACIN</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-white' : 'text-gray-300 hover:text-white'}`}>Home</Link>
            <Link to="/category/trending" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Trending</Link>
            <Link to="/category/vip" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">VIP</Link>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <form onSubmit={handleSearch} className="relative group">
              <input 
                type="text" 
                placeholder="Titles, people, genres"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-black/50 border border-white/20 rounded-full py-1.5 pl-10 pr-4 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange w-0 group-hover:w-64 focus:w-64 transition-all duration-300"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </form>
            <Bell className="h-5 w-5 text-gray-300 hover:text-white cursor-pointer transition-colors" />
            <div className="h-8 w-8 rounded bg-brand-orange flex items-center justify-center font-bold text-white text-xs">
              JD
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
             <Search className="h-5 w-5 text-white" onClick={() => navigate('/search')} />
             <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-300 hover:text-white"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-black border-t border-white/10 absolute w-full min-h-screen">
          <div className="px-4 py-4 space-y-4">
             <form onSubmit={handleSearch} className="relative mb-6">
                <input 
                  type="text" 
                  placeholder="Search drama..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/10 border-transparent rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:bg-white/20 text-base"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </form>
            <div className="flex flex-col gap-2">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-base font-medium text-white">
                <span className="text-gray-400">Home</span>
              </Link>
              
              {menuItems.map((item) => (
                <Link 
                  key={item.label}
                  to={item.path} 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <item.icon className="h-5 w-5 text-brand-orange" />
                  <span className="text-base font-medium text-gray-200">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};