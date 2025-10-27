import React, { useState } from 'react';
import { useBooths } from '../hooks/useBooths';
import { BoothCard } from '../components/BoothCard';
import { Activity, AlertCircle, Wifi, WifiOff } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { booths, loading, error } = useBooths();
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  const regions = Array.from(new Set(booths.map((b) => b.region)));
  const filteredBooths =
    selectedRegion === 'all'
      ? booths
      : booths.filter((b) => b.region === selectedRegion);

  const onlineCount = booths.filter((b) => b.status === 'online').length;
  const offlineCount = booths.filter((b) => b.status === 'offline').length;
  const maintenanceCount = booths.filter(
    (b) => b.status === 'maintenance'
  ).length;

  const totalPhotos = booths.reduce((sum, b) => sum + b.photos_taken_total, 0);
  const totalSessions = booths.reduce((sum, b) => sum + b.sessions_count, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Photobooth Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage your photobooth network
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Booths</p>
                <p className="text-3xl font-bold text-gray-900">
                  {booths.length}
                </p>
              </div>
              <Activity className="text-blue-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Online</p>
                <p className="text-3xl font-bold text-green-600">{onlineCount}</p>
              </div>
              <Wifi className="text-green-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Offline</p>
                <p className="text-3xl font-bold text-red-600">{offlineCount}</p>
              </div>
              <WifiOff className="text-red-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Photos Taken</p>
                <p className="text-3xl font-bold text-gray-900">
                  {totalPhotos.toLocaleString()}
                </p>
              </div>
              <Activity className="text-purple-500" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sessions</p>
                <p className="text-3xl font-bold text-gray-900">
                  {totalSessions.toLocaleString()}
                </p>
              </div>
              <Activity className="text-orange-500" size={32} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              Filter by Region:
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Regions</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
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
        {loading && booths.length === 0 && (
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
                onClick={() => {
                  console.log('Navigate to booth:', booth.id);
                }}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredBooths.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 text-lg">No booths found</p>
            <p className="text-gray-500 text-sm mt-2">
              {booths.length === 0
                ? 'No booths registered yet'
                : 'No booths in the selected region'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
