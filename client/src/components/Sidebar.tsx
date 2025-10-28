import React from 'react';
import { Booth } from '../types/booth';
import { Menu, Grid, MapPin, Building2, Search } from 'lucide-react';

interface SidebarProps {
  booths: Booth[];
  selectedRegion: string;
  selectedClient: string;
  onRegionChange: (region: string) => void;
  onClientChange: (client: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  booths,
  selectedRegion,
  selectedClient,
  onRegionChange,
  onClientChange,
}) => {
  // Extract unique regions
  const regions = Array.from(
    new Set(booths.map((b) => b.region))
  ).sort();

  // Extract unique clients from booth names
  const clientSet = new Set<string>();
  booths.forEach((booth) => {
    // Extract client name from booth name (e.g., "Downtown - Wedding Co. #1" -> "Wedding Co.")
    const match = booth.name.match(/- (.+) #/);
    if (match) {
      clientSet.add(match[1]);
    }
  });
  const clients = Array.from(clientSet).sort();

  // Calculate counts
  const getRegionCount = (region: string) =>
    booths.filter((b) => b.region === region).length;

  const getClientCount = (client: string) =>
    booths.filter((b) => b.name.includes(client)).length;

  const getRegionOnlineCount = (region: string) =>
    booths.filter((b) => b.region === region && b.status === 'online').length;

  const getClientOnlineCount = (client: string) =>
    booths.filter((b) => b.name.includes(client) && b.status === 'online').length;

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Grid className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">PhotoBooth</h2>
            <p className="text-xs text-gray-500">Control Center</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Locations Section */}
        <div className="px-4 py-6 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="text-gray-600" size={18} />
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Locations
            </h3>
          </div>

          <button
            onClick={() => onRegionChange('all')}
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors ${
              selectedRegion === 'all'
                ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm">All Locations</span>
              <span className="text-xs font-medium bg-gray-200 px-2 py-1 rounded">
                {booths.length}
              </span>
            </div>
          </button>

          {regions.map((region) => (
            <button
              key={region}
              onClick={() => onRegionChange(region)}
              className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors ${
                selectedRegion === region
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">{region}</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-green-600">
                    {getRegionOnlineCount(region)}
                  </span>
                  <span className="text-xs text-gray-500">/{getRegionCount(region)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Clients Section */}
        <div className="px-4 py-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="text-gray-600" size={18} />
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Clients
            </h3>
          </div>

          <button
            onClick={() => onClientChange('all')}
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors ${
              selectedClient === 'all'
                ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm">All Clients</span>
              <span className="text-xs font-medium bg-gray-200 px-2 py-1 rounded">
                {clients.length}
              </span>
            </div>
          </button>

          {clients.map((client) => (
            <button
              key={client}
              onClick={() => onClientChange(client)}
              className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors ${
                selectedClient === client
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm truncate">{client}</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-green-600">
                    {getClientOnlineCount(client)}
                  </span>
                  <span className="text-xs text-gray-500">/{getClientCount(client)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="text-center text-xs text-gray-500">
          <p className="font-medium text-gray-700 mb-1">
            {booths.filter((b) => b.status === 'online').length}/
            {booths.length} Online
          </p>
          <p>Last updated: Just now</p>
        </div>
      </div>
    </div>
  );
};
