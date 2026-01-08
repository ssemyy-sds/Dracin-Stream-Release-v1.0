
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './components/Home';
import { SearchPage } from './components/SearchPage';
import { WatchPage } from './components/WatchPage';
import { CategoryPage } from './components/CategoryPage';
import { DetailPage } from './components/DetailPage';
import { FavoritesPage } from './components/FavoritesPage';
import { TestHome } from './components/TestHome';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black text-white font-sans selection:bg-brand-orange selection:text-white">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/test-home" element={<TestHome />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/category/:type" element={<CategoryPage />} />
            <Route path="/watch/:id" element={<WatchPage />} />
            <Route path="/detail/:id" element={<DetailPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Simple Footer */}
        <footer className="bg-black py-12 px-4 border-t border-white/10 text-center">
          <p className="text-brand-orange font-bold text-lg mb-2">DRACIN</p>
          <p className="text-gray-500 text-sm">
            &copy; 2026 Dracin Stream by SDS-TECH. All rights reserved.
          </p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
