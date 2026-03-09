import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import FormationPage from './pages/FormationPage';
import GalleryPage from './pages/GalleryPage';
import ConquestPage from './pages/ConquestPage';
import LandingPage from './pages/LandingPage';
import { GameProvider } from './context/GameContext';
import { generals } from './data/generals';

function Preloader({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const imagesToLoad = generals.map(g => g.imageUrl).filter(Boolean);
    // Add some background images if needed
    imagesToLoad.push(
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDkNQa8EA4dAw7TGFhsMgPCzIk2QH43fSv-mfw4bvbFfKhgBlt2rZKz8BCSpA95tswcFVzh3Ggsr0xTkCPlU_VIqjc9viso15DqL8_UKjbv05k_pq2J8RK8nI6TnQDRvi2Fpw3lSKBVhXscfTUXvh8eRuUcZ9E6HwAUZ05QaHaqMAn-mM6OQRahVU0iFU5h8j1lnFH2eOKcS1A-yzcemxffTao0MDUBggrlqU8-yTOXU6uHx-Yw4nd2pfchMZnbPILf5KsItYZBvA',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAKIFUEl0iKziOG2yQ9CEeaJqmB1umqAoLR_Cjt8-x5a1rt4qrpWxjij5rb9iaC4IT0JFAH9SVDJ6ZBi3ejMib-D6sHT9iD7_sYnvVLuU32K6DELni58nxSWK6yLAsqQPo4lrRYvpnQRXnbUW1zoVcUgZp5dCFi_UpAPfmOO9ygKVUElBxRvP8jGDAg9rK1J-m4UnCpsXHFn9NT-ULnP613M-UzSiPJsxitTnj99Cy2_whdwiDEVTALnwafe7j1N-U5nnLHMFoi1w'
    );

    let loadedCount = 0;
    const totalCount = imagesToLoad.length;

    if (totalCount === 0) {
      setLoading(false);
      return;
    }

    imagesToLoad.forEach(src => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedCount++;
        setProgress(Math.round((loadedCount / totalCount) * 100));
        if (loadedCount === totalCount) {
          setTimeout(() => setLoading(false), 500); // Small delay for smooth transition
        }
      };
      img.onerror = () => {
        // Even if one fails, continue loading others
        loadedCount++;
        setProgress(Math.round((loadedCount / totalCount) * 100));
        if (loadedCount === totalCount) {
          setTimeout(() => setLoading(false), 500);
        }
      };
    });
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center z-[100] text-white font-display">
        <div className="mb-8 relative">
          <div className="w-24 h-24 border-4 border-zinc-800 border-t-primary rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-gold font-bold">
            {progress}%
          </div>
        </div>
        <h2 className="text-2xl font-bold tracking-widest mb-4">正在加载游戏资源</h2>
        <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <GameProvider>
      <Preloader>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/formation" element={<FormationPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/conquest" element={<ConquestPage />} />
          </Routes>
        </Router>
      </Preloader>
    </GameProvider>
  );
}
