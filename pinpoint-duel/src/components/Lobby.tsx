import React, { useState } from 'react';
import { Player, PLAYER_COLORS } from '../types';
import { Users, Plus, Play, X } from 'lucide-react';
import { motion } from 'motion/react';

interface LobbyProps {
  onStart: (players: Player[], rounds: number) => void;
}

export default function Lobby({ onStart }: LobbyProps) {
  const [playerNames, setPlayerNames] = useState<string[]>(['Player 1', 'Player 2']);
  const [rounds, setRounds] = useState(5);

  const addPlayer = () => {
    if (playerNames.length < 8) {
      setPlayerNames([...playerNames, `Player ${playerNames.length + 1}`]);
    }
  };

  const removePlayer = (index: number) => {
    if (playerNames.length > 1) {
      setPlayerNames(playerNames.filter((_, i) => i !== index));
    }
  };

  const updateName = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handleStart = () => {
    const players: Player[] = playerNames.map((name, i) => ({
      id: `p${i}`,
      name: name || `Player ${i + 1}`,
      color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      score: 0,
    }));
    onStart(players, rounds);
  };

  return (
    <div className="min-h-screen bg-[#0F1113] text-[#E4E3E0] font-sans p-8 flex flex-col items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl border-2 border-[#E4E3E0] bg-[#121212] p-8 shadow-[8px_8px_0px_0px_rgba(228,227,224,0.1)]"
      >
        <div className="flex items-center gap-4 mb-8 border-b-2 border-[#E4E3E0] pb-4">
          <Users size={32} />
          <h1 className="text-4xl font-display uppercase tracking-tighter italic">Pinpoint Duel</h1>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-xs uppercase tracking-widest opacity-50 mb-4 font-mono">01. Configure Players</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {playerNames.map((name, i) => (
                <div key={i} className="flex items-center gap-2 group">
                  <div 
                    className="w-4 h-4 shrink-0 border border-[#E4E3E0]" 
                    style={{ backgroundColor: PLAYER_COLORS[i % PLAYER_COLORS.length] }}
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => updateName(i, e.target.value)}
                    className="flex-1 border-b border-dashed border-[#E4E3E0] bg-transparent px-2 py-1 focus:outline-none focus:border-solid font-display"
                    placeholder={`Player ${i + 1}`}
                  />
                  <button 
                    onClick={() => removePlayer(i)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              {playerNames.length < 8 && (
                <button 
                  onClick={addPlayer}
                  className="flex items-center gap-2 text-sm opacity-50 hover:opacity-100 transition-opacity py-2 border-b border-dashed border-transparent hover:border-[#E4E3E0] font-display"
                >
                  <Plus size={16} /> Add Player
                </button>
              )}
            </div>
          </section>

          <section className="pt-4 border-t border-[#E4E3E0]">
            <h2 className="text-xs uppercase tracking-widest opacity-50 mb-4 font-mono">02. Game Settings</h2>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium font-display">Rounds:</label>
              <input 
                type="number" 
                min={1} 
                max={20} 
                value={rounds} 
                onChange={(e) => setRounds(parseInt(e.target.value) || 1)}
                className="w-20 border-2 border-[#E4E3E0] bg-transparent px-3 py-1 font-mono text-center"
              />
            </div>
          </section>

          <button
            onClick={handleStart}
            disabled={playerNames.length === 0}
            className="w-full mt-8 bg-[#E4E3E0] text-[#0F1113] py-4 flex items-center justify-center gap-3 hover:bg-[#121212] hover:text-[#E4E3E0] border-2 border-[#E4E3E0] transition-all group disabled:opacity-50 disabled:cursor-not-allowed font-display"
          >
            <Play size={20} className="group-hover:scale-110 transition-transform" />
            <span className="font-bold uppercase tracking-widest">Start Duel</span>
          </button>
        </div>
      </motion.div>
      
      <p className="mt-8 text-[10px] uppercase tracking-[0.2em] opacity-40 font-mono">
        Location Discovery Challenge // Local Multi-Device 1-8P
      </p>
    </div>
  );
}
