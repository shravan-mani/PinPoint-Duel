import React, { useState, useEffect } from 'react';
import { Player, GameState, Location } from './types';
import { getRandomCoordinates } from './locations';
import Lobby from './components/Lobby';
import Game from './components/Game';
import Results from './components/Results';
import { Trophy, RefreshCw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { loadGoogleMaps } from './lib/maps';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('LOBBY');
  const [players, setPlayers] = useState<Player[]>([]);
  const [rounds, setRounds] = useState(5);
  const [currentRound, setCurrentRound] = useState(1);
  const [targetLocation, setTargetLocation] = useState<Location | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [playerOrder, setPlayerOrder] = useState<string[]>([]);
  const [settings, setSettings] = useState({
    isInverted: true,
    useGeodesic: true,
    antiCheat: true
  });

  const startNewGame = (initialPlayers: Player[], totalRounds: number) => {
    setPlayers(initialPlayers);
    setRounds(totalRounds);
    setCurrentRound(1);
    const initialOrder = initialPlayers.map(p => p.id);
    setPlayerOrder(initialOrder);
    findRandomLocation(initialOrder);
  };

  const findRandomLocation = async (currentOrder: string[]) => {
    setIsLoadingLocation(true);
    try {
      await loadGoogleMaps();
      const sv = new google.maps.StreetViewService();
      
      let found = false;
      let attempts = 0;
      
      while (!found && attempts < 50) {
        attempts++;
        const coords = getRandomCoordinates();
        try {
          const result = await sv.getPanorama({
            location: coords,
            radius: 100000, // 100km radius for better hit rate
            source: google.maps.StreetViewSource.OUTDOOR
          });
          
          if (result.data.location?.latLng) {
            setTargetLocation({
              id: Math.random().toString(36).substr(2, 9),
              lat: result.data.location.latLng.lat(),
              lng: result.data.location.latLng.lng(),
              name: 'Unknown Location'
            });
            found = true;
          }
        } catch (e) {
          // No panorama found at this location, try again
        }
      }
      
      if (!found) {
        // Fallback to a safe location if too many attempts fail
        setTargetLocation({ id: 'fallback', lat: 48.8584, lng: 2.2945, name: 'Paris (Fallback)' });
      }
      
      setGameState('GUESSING');
    } catch (err) {
      console.error('Error finding location:', err);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleRoundComplete = (updatedPlayers: Player[]) => {
    setPlayers(updatedPlayers);
    setGameState('REVEAL');
  };

  const handleNext = () => {
    if (currentRound < rounds) {
      setCurrentRound(prev => prev + 1);
      
      // Rotate order: last person becomes first
      const newOrder = [...playerOrder];
      const last = newOrder.pop()!;
      newOrder.unshift(last);
      setPlayerOrder(newOrder);
      
      findRandomLocation(newOrder);
    } else {
      setGameState('LEADERBOARD');
    }
  };

  const resetGame = () => {
    setGameState('LOBBY');
    setPlayers([]);
    setTargetLocation(null);
    setPlayerOrder([]);
  };

  // Sort players based on current round order for the Game component
  const orderedPlayers = playerOrder.map(id => players.find(p => p.id === id)!).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#0F1113] text-[#E4E3E0]">
      <AnimatePresence mode="wait">
        {gameState === 'LOBBY' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Lobby onStart={startNewGame} />
          </motion.div>
        )}

        {isLoadingLocation && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0F1113]"
          >
            <Loader2 size={48} className="animate-spin mb-4 text-[#E4E3E0]" />
            <p className="font-mono uppercase tracking-widest text-sm text-[#E4E3E0]">Loading Map...</p>
          </motion.div>
        )}

        {gameState === 'GUESSING' && targetLocation && !isLoadingLocation && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Game
              players={orderedPlayers}
              targetLocation={targetLocation}
              round={currentRound}
              totalRounds={rounds}
              onRoundComplete={handleRoundComplete}
              settings={settings}
              onSettingsChange={setSettings}
            />
          </motion.div>
        )}

        {gameState === 'REVEAL' && targetLocation && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Results
              players={players}
              targetLocation={targetLocation}
              round={currentRound}
              totalRounds={rounds}
              onNext={handleNext}
              settings={settings}
            />
          </motion.div>
        )}

        {gameState === 'LEADERBOARD' && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center p-8"
          >
            <div className="w-full max-w-2xl border-2 border-[#E4E3E0] bg-[#121212] p-8 shadow-[8px_8px_0px_0px_rgba(228,227,224,0.1)]">
              <div className="flex items-center gap-4 mb-8 border-b-2 border-[#E4E3E0] pb-4">
                <Trophy size={32} className="text-yellow-500" />
                <h1 className="text-4xl font-display uppercase tracking-tighter italic">Final Standings</h1>
              </div>

              <div className="space-y-4 mb-8">
                {[...players].sort((a, b) => b.score - a.score).map((player, i) => (
                  <div key={player.id} className="flex items-center justify-between p-4 border-2 border-[#E4E3E0] bg-[#0F1113]">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-xl font-bold opacity-30">#{i + 1}</span>
                      <div className="w-4 h-4 border border-[#E4E3E0]" style={{ backgroundColor: player.color }} />
                      <span className="text-xl font-display uppercase tracking-tight">{player.name}</span>
                    </div>
                    <span className="text-2xl font-bold font-mono">{player.score}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={resetGame}
                className="w-full bg-[#E4E3E0] text-[#0F1113] py-4 flex items-center justify-center gap-3 hover:bg-[#121212] hover:text-[#E4E3E0] border-2 border-[#E4E3E0] transition-all group font-display"
              >
                <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                <span className="font-bold uppercase tracking-widest">New Game</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
