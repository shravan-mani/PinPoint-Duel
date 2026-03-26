import React, { useEffect, useRef, useState } from 'react';
import { Player, Location } from '../types';
import { loadGoogleMaps, calculatePoints } from '../lib/maps';
import { Navigation, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GameProps {
  players: Player[];
  targetLocation: Location;
  round: number;
  totalRounds: number;
  onRoundComplete: (updatedPlayers: Player[]) => void;
}

export default function Game({ players, targetLocation, round, totalRounds, onRoundComplete }: GameProps) {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [guesses, setGuesses] = useState<{ lat: number; lng: number; playerId: string }[]>([]);
  const [tempGuess, setTempGuess] = useState<{ lat: number; lng: number } | null>(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [nextPlayer, setNextPlayer] = useState<Player | null>(players[0]);
  const [isInverted, setIsInverted] = useState(true);

  const streetViewRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const tempMarkerRef = useRef<google.maps.Marker | null>(null);
  const currentPlayerIndexRef = useRef(currentPlayerIndex);

  useEffect(() => {
    currentPlayerIndexRef.current = currentPlayerIndex;
  }, [currentPlayerIndex]);

  useEffect(() => {
    setNextPlayer(players[0]);
    setIsTransitioning(true);

    loadGoogleMaps().then(() => {
      setIsApiLoaded(true);
      setTimeout(() => {
        setIsTransitioning(false);
        setTimeout(() => setNextPlayer(null), 500);
      }, 1500);
    }).catch(err => {
      console.error('Failed to load Google Maps API:', err);
      setApiError('Google Maps API Key missing or invalid. Please check your .env file.');
      setIsTransitioning(false);
    });
  }, [targetLocation, players]);

  useEffect(() => {
    if (!isApiLoaded || !streetViewRef.current || !mapRef.current) return;

    new google.maps.StreetViewPanorama(streetViewRef.current, {
      position: { lat: targetLocation.lat, lng: targetLocation.lng },
      addressControl: false,
      showRoadLabels: false,
      zoomControl: true,
      panControl: true,
      enableCloseButton: false,
    });

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 20, lng: 0 },
      zoom: 2,
      disableDefaultUI: true,
      zoomControl: true,
      styles: [{ featureType: "all", elementType: "labels", stylers: [{ visibility: "off" }] }]
    });

    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setTempGuess({ lat, lng });
        
        if (!tempMarkerRef.current) {
          tempMarkerRef.current = new google.maps.Marker({ map });
        }
        tempMarkerRef.current.setPosition({ lat, lng });
        
        const player = players[currentPlayerIndexRef.current];
        tempMarkerRef.current.setOptions({
          icon: {
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 5,
            fillColor: player?.color || '#FFFFFF',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#FFFFFF',
          },
          label: {
            text: player?.name[0].toUpperCase() || '?',
            color: '#FFFFFF',
            fontWeight: 'bold'
          }
        });
      }
    });

    googleMapRef.current = map;
  }, [isApiLoaded, targetLocation]);

  const submitGuess = () => {
    if (!tempGuess) return;

    const newGuess = { ...tempGuess, playerId: players[currentPlayerIndex].id };
    const updatedGuesses = [...guesses, newGuess];
    setGuesses(updatedGuesses);

    setTempGuess(null);
    if (tempMarkerRef.current) {
      tempMarkerRef.current.setMap(null);
      tempMarkerRef.current = null;
    }

    if (currentPlayerIndex < players.length - 1) {
      setNextPlayer(players[currentPlayerIndex + 1]);
      setIsTransitioning(true);
      
      setTimeout(() => {
        if (googleMapRef.current) {
          googleMapRef.current.setCenter({ lat: 20, lng: 0 });
          googleMapRef.current.setZoom(2);
        }
        setCurrentPlayerIndex(prev => prev + 1);
        
        setTimeout(() => {
          setIsTransitioning(false);
          setTimeout(() => setNextPlayer(null), 500);
        }, 800);
      }, 600);
    } else {
      const updatedPlayers = players.map(player => {
        const guess = updatedGuesses.find(g => g.playerId === player.id);
        if (!guess) return player;

        const distance = google.maps.geometry.spherical.computeDistanceBetween(
          new google.maps.LatLng(guess.lat, guess.lng),
          new google.maps.LatLng(targetLocation.lat, targetLocation.lng)
        );

        const points = calculatePoints(distance);

        return {
          ...player,
          score: player.score + points,
          lastGuess: { lat: guess.lat, lng: guess.lng, distance, points }
        };
      });

      onRoundComplete(updatedPlayers);
    }
  };

  if (apiError) {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center p-8">
        <div className="max-w-md w-full border-2 border-red-600 bg-white p-8 shadow-[8px_8px_0px_0px_rgba(220,38,38,1)]">
          <div className="flex items-center gap-4 text-red-600 mb-4">
            <AlertTriangle size={32} />
            <h2 className="text-2xl font-bold uppercase tracking-tighter">API Error</h2>
          </div>
          <p className="text-sm font-mono opacity-70 mb-6">{apiError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0F1113] text-[#E4E3E0] font-sans overflow-hidden relative">
      {!isApiLoaded ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-[10px] uppercase tracking-[0.5em] font-mono opacity-40 animate-pulse">
            Initializing...
          </div>
        </div>
      ) : (
        <>
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <motion.div
              key={players[currentPlayerIndex].id}
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-[#121212] text-white px-10 py-3 border-2 shadow-[8px_8px_0px_0px_rgba(228,227,224,0.1)] flex flex-col items-center"
              style={{ borderColor: players[currentPlayerIndex].color }}
            >
              <span 
                className="text-[10px] uppercase tracking-[0.3em] font-mono opacity-60 mb-1"
                style={{ color: players[currentPlayerIndex].color }}
              >
                Currently Guessing
              </span>
              <div className="flex items-center gap-4">
                <div className="w-3 h-3" style={{ backgroundColor: players[currentPlayerIndex].color }} />
                <h2 className="text-3xl font-display uppercase tracking-tighter italic">
                  {players[currentPlayerIndex].name}
                </h2>
              </div>
            </motion.div>
          </div>

          <div className="h-16 border-b-2 border-[#E4E3E0]/20 bg-[#121212] flex items-center justify-between px-6 shrink-0 z-40">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsInverted(!isInverted)}
                className="w-8 h-8 flex items-center justify-center border border-[#E4E3E0]/20 hover:bg-[#E4E3E0] hover:text-[#0F1113] transition-colors text-[10px] font-mono"
                title="Toggle Inversion"
              >
                {isInverted ? 'INV' : 'NRM'}
              </button>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest opacity-50 font-mono leading-none">Round</span>
                <span className="text-xl font-bold font-mono">{round} / {totalRounds}</span>
              </div>
              <div className="h-8 w-[1px] bg-[#E4E3E0] opacity-20" />
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 border border-[#E4E3E0]" 
                  style={{ backgroundColor: players[currentPlayerIndex].color }}
                />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest opacity-50 font-mono leading-none">Current Turn</span>
                  <span 
                    className="text-xl font-display uppercase tracking-tighter italic"
                    style={{ color: players[currentPlayerIndex].color }}
                  >
                    {players[currentPlayerIndex].name}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={submitGuess}
              disabled={!tempGuess}
              className="bg-[#E4E3E0] text-[#0F1113] px-8 py-2 flex items-center gap-2 hover:bg-[#121212] hover:text-[#E4E3E0] border-2 border-[#E4E3E0] transition-all disabled:opacity-30 disabled:cursor-not-allowed group font-display"
            >
              <Navigation size={18} className="group-hover:rotate-45 transition-transform" />
              <span className="font-bold uppercase tracking-widest text-sm">Lock Pin</span>
            </button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 relative border-r-2 border-[#E4E3E0]/20">
              <div ref={streetViewRef} className={`absolute inset-0 ${isInverted ? 'invert' : ''}`} />
              <div className="absolute top-4 left-4 bg-[#121212] text-[#E4E3E0] px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-mono z-10 border border-[#E4E3E0]/20">
                Guess Location
              </div>
            </div>

            <div 
              className="w-[400px] relative bg-[#121212] flex flex-col shrink-0 border-l-2"
              style={{ borderColor: players[currentPlayerIndex].color }}
            >
              <div ref={mapRef} className="flex-1" />
              
              <div className="p-4 border-t-2 border-[#E4E3E0]/20 bg-[#121212]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase tracking-widest opacity-50 font-mono">Players</span>
                  <span className="text-[10px] font-mono">{guesses.length} Pin{guesses.length !== 1 ? 's' : ''} Placed</span>
                </div>
                <div className="space-y-1">
                  {players.map((p, i) => (
                    <div key={p.id} className={`flex items-center justify-between text-xs font-mono py-1 border-b border-dashed border-[#E4E3E0]/10 ${i === currentPlayerIndex ? 'bg-white/5 px-2 -mx-2' : 'opacity-40'}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2" style={{ backgroundColor: p.color }} />
                        <span className="font-display">{p.name}</span>
                      </div>
                      {guesses.find(g => g.playerId === p.id) ? (
                        <CheckCircle2 size={12} className="text-green-500" />
                      ) : (
                        <span>WAITING</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-center"
            >
              <span className="text-[10px] uppercase tracking-[0.5em] font-mono opacity-40 mb-6 block">
                {guesses.length === 0 ? 'Get Ready' : 'Next Player'}
              </span>
              <h2 
                className="text-7xl font-display uppercase tracking-tighter italic"
                style={{ color: nextPlayer?.color }}
              >
                {nextPlayer?.name}
              </h2>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
