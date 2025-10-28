import React, { useState } from 'react';
import { useBooths } from '../hooks/useBooths';
import { BoothCard } from '../components/BoothCard';
import { Sidebar } from '../components/Sidebar';
import { Activity, AlertCircle, Wifi, WifiOff, TrendingUp } from 'lucide-react';

interface DashboardProps {
  onSelectBooth: (boothId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectBooth }) => {
  const { booths, loading, error } = useBooths();
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');

  // Filter booths based on selections
  const filteredBooths = booths.filter((booth) => {
    const regionMatch = selectedRegion === 'all' || booth.region === selectedRegion;
    // Extract client name from booth name (e.g., "Downtown - Wedding Co. #1" -> "Wedding Co.")
    const clientMatch = selectedClient === 'all' || booth.name.includes(selectedClient);
    return regionMatch && clientMatch;
  });

  // Calculate statistics
  const onlineCount = booths.filter((b) => b.status === 'online').length;
  const offlineCount = booths.filter((b) => b.status === 'offline').length;
  const maintenanceCount = booths.filter((b) => b.status === 'maintenance').length;

  const filteredOnlineCount = filteredBooths.filter((b) => b.status === 'online').length;
  const filteredOfflineCount = filteredBooths.filter((b) => b.status === 'offline').length;

  const totalPhotos = filteredBooths.reduce((sum, b) => sum + b.photos_taken_total, 0);
  const totalSessions = filteredBooths.reduce((sum, b) => sum + b.sessions_count, 0);
  const avgPhotosPerSession = totalSessions > 0 ? (totalPhotos / totalSessions).toFixed(1) : 0;

  return (
    <div className="flex w-full h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        booths={booths}
        selectedRegion={selectedRegion}
        selectedClient={selectedClient}
        onRegionChange={setSelectedRegion}
        onClientChange={setSelectedClient}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">
                  {filteredBooths.length} booth{filteredBooths.length !== 1 ? 's' : ''} •{' '}
                  {filteredOnlineCount} online
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-gray-700">Live</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto">
          <div className="px-8 py-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Total Booths"
                value={filteredBooths.length}
                icon={<Activity className="text-blue-500" size={24} />}
                color="bg-blue-50"
              />
              <StatCard
                label="Online"
                value={filteredOnlineCount}
                icon={<Wifi className="text-green-500" size={24} />}
                color="bg-green-50"
                change={filteredOnlineCount === filteredBooths.length ? 'All operational' : `${filteredOfflineCount} offline`}
              />
              <StatCard
                label="Photos Taken"
                value={totalPhotos.toLocaleString()}
                icon={<TrendingUp className="text-purple-500" size={24} />}
                color="bg-purple-50"
                change={`${avgPhotosPerSession} per session`}
              />
              <StatCard
                label="Sessions"
                value={totalSessions.toLocaleString()}
                icon={<Activity className="text-orange-500" size={24} />}
                color="bg-orange-50"
              />
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="text-red-600" size={20} />
                  <div>
                    <h3 className="font-semibold text-red-900">Error</h3>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && filteredBooths.length === 0 && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p className="mt-4 text-gray-600">Loading booths...</p>
              </div>
            )}

            {/* Booth Grid */}
            {!loading && filteredBooths.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBooths.map((booth) => (
                  <BoothCard
                    key={booth.id}
                    booth={booth}
                    onClick={() => onSelectBooth(booth.id)}
                  />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredBooths.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg">
                <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600 text-lg font-medium">No booths found</p>
                <p className="text-gray-500 text-sm mt-2">
                  {booths.length === 0
                    ? 'No booths registered yet'
                    : 'Try adjusting your filters'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  change?: string;
}

function StatCard({ label, value, icon, color, change }: StatCardProps) {
  return (
    <div className={`${color} rounded-lg p-6 border border-gray-200`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {change && <p className="text-xs text-gray-600 mt-2">{change}</p>}
        </div>
        <div className="text-gray-600">{icon}</div>
      </div>
    </div>
  );
}
