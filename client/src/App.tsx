import React, { useState } from 'react';
import './index.css';
import { Dashboard } from './pages/Dashboard';
import { BoothDetail } from './pages/BoothDetail';

type Page = 'dashboard' | 'booth-detail';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedBoothId, setSelectedBoothId] = useState<string | undefined>();

  const handleSelectBooth = (boothId: string) => {
    setSelectedBoothId(boothId);
    setCurrentPage('booth-detail');
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
    setSelectedBoothId(undefined);
  };

  return (
    <div className="App flex h-screen bg-gray-50">
      {currentPage === 'dashboard' ? (
        <Dashboard onSelectBooth={handleSelectBooth} />
      ) : (
        <BoothDetail boothId={selectedBoothId} onBack={handleBackToDashboard} />
      )}
    </div>
  );
}

export default App;
