import React, { useEffect, useRef, useState } from 'react';
import { Player, Location } from '../types';
import { loadGoogleMaps, formatDistance } from '../lib/maps';
import { Trophy, ArrowRight, Map as MapIcon, ArrowUpDown } from 'lucide-react';
import { motion } from 'motion/react';

interface ResultsProps {
  players: Player[];
  targetLocation: Location;
  round: number;
  totalRounds: number;
  onNext: () => void;
}

export default function Results({ players, targetLocation, round, totalRounds, onNext }: ResultsProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [sortBy, setSortBy] = useState<'distance' | 'score'>('distance');

  useEffect(() => {
    loadGoogleMaps().then(() => {
      const map = new google.maps.Map(mapRef.current!, {
        center: { lat: targetLocation.lat, lng: targetLocation.lng },
        zoom: 3,
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          {
            "featureType": "all",
            "elementType": "labels",
            "stylers": [{ "visibility": "on" }]
          }
        ]
      });

      // Target Marker
      new google.maps.Marker({
        position: { lat: targetLocation.lat, lng: targetLocation.lng },
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#000000',
          fillOpacity: 1,
          strokeWeight: 4,
          strokeColor: '#FFFFFF',
        },
        zIndex: 1000
      });

      // Player Markers and Lines
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: targetLocation.lat, lng: targetLocation.lng });

      players.forEach(player => {
        if (player.lastGuess) {
          const guessPos = { lat: player.lastGuess.lat, lng: player.lastGuess.lng };
          bounds.extend(guessPos);

          new google.maps.Marker({
            position: guessPos,
            map,
            icon: {
              path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 5,
              fillColor: player.color,
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#FFFFFF',
            },
            label: {
              text: player.name[0].toUpperCase(),
              color: '#FFFFFF',
              fontWeight: 'bold'
            }
          });

          new google.maps.Polyline({
            path: [
              { lat: targetLocation.lat, lng: targetLocation.lng },
              guessPos
            ],
            geodesic: false,
            strokeColor: player.color,
            strokeOpacity: 0.6,
            strokeWeight: 2,
            map
          });
        }
      });

      map.fitBounds(bounds, 50);
    });
  }, [targetLocation, players]);

  const sortedPlayers = [...players].sort((a, b) => {
    if (sortBy === 'distance') {
      return (a.lastGuess?.distance || Infinity) - (b.lastGuess?.distance || Infinity);
    } else {
      return b.score - a.score;
    }
  });

  return (
    <div className="h-screen flex flex-col bg-[#0F1113] text-[#E4E3E0] font-sans overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* Map Reveal */}
        <div className="flex-1 relative border-r-2 border-[#E4E3E0]/20">
          <div ref={mapRef} className="absolute inset-0" />
          <div className="absolute top-4 left-4 bg-[#121212] text-[#E4E3E0] px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-mono z-10 border border-[#E4E3E0]/20">
            Location Revealed
          </div>
        </div>

        {/* Scoreboard */}
        <div className="w-[450px] bg-[#121212] flex flex-col shrink-0 border-l-2 border-[#E4E3E0]/20">
          <div className="p-6 border-b-2 border-[#E4E3E0]/20">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <Trophy className="text-yellow-500" />
                <h2 className="text-2xl font-display uppercase tracking-tighter italic">Round {round} Results</h2>
              </div>
            </div>
            <button
              onClick={() => setSortBy(prev => prev === 'distance' ? 'score' : 'distance')}
              className="text-[10px] uppercase tracking-widest font-mono border border-[#E4E3E0]/30 px-3 py-1.5 hover:bg-white/5 transition-colors flex items-center gap-2 rounded-sm"
            >
              <ArrowUpDown size={12} />
              Sort by: {sortBy === 'distance' ? 'Closest' : 'Total Points'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E4E3E0]/20 bg-white/5">
                  <th className="p-4 text-[10px] uppercase tracking-widest font-mono opacity-50">Player</th>
                  <th className="p-4 text-[10px] uppercase tracking-widest font-mono opacity-50">Distance</th>
                  <th className="p-4 text-[10px] uppercase tracking-widest font-mono opacity-50 text-right">Points</th>
                </tr>
              </thead>
              <tbody>
                {sortedPlayers.map((player, i) => (
                  <tr key={player.id} className="border-b border-[#E4E3E0]/10 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs opacity-30">{i + 1}</span>
                        <div className="w-3 h-3 border border-[#E4E3E0]" style={{ backgroundColor: player.color }} />
                        <span className="font-display uppercase tracking-tight text-sm">{player.name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-xs">
                      {formatDistance(player.lastGuess?.distance || 0)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold font-mono">+{player.lastGuess?.points || 0}</span>
                        <span className="text-[10px] font-mono opacity-40">Total: {player.score}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t-2 border-[#E4E3E0]/20 bg-[#121212]">
            <button
              onClick={onNext}
              className="w-full bg-[#E4E3E0] text-[#0F1113] py-4 flex items-center justify-center gap-3 hover:bg-[#121212] hover:text-[#E4E3E0] border-2 border-[#E4E3E0] transition-all group font-display"
            >
              <span className="font-bold uppercase tracking-widest">
                {round < totalRounds ? 'Next Round' : 'Final Standings'}
              </span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
