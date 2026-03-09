import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FormationPage from './pages/FormationPage';
import GalleryPage from './pages/GalleryPage';
import ConquestPage from './pages/ConquestPage';
import LandingPage from './pages/LandingPage';
import { GameProvider } from './context/GameContext';

export default function App() {
  return (
    <GameProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/formation" element={<FormationPage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/conquest" element={<ConquestPage />} />
        </Routes>
      </Router>
    </GameProvider>
  );
}
