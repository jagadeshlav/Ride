
import React, { useState, useEffect, useCallback } from 'react';
import MapComponent from './components/MapComponent';
import RiderCard from './components/RiderCard';
import { Rider, RiderStatus, Trip, ChatMessage } from './types';
import { getRideAdvice, getQuickStatusUpdate } from './services/geminiService';

const INITIAL_CENTER: [number, number] = [17.4483, 78.3915];

const MOCK_RIDERS: Rider[] = [
  { id: '1', name: 'Arjun', color: '#3b82f6', status: RiderStatus.RIDING, location: { lat: 17.4483, lng: 78.3915, timestamp: Date.now(), speed: 45 } },
  { id: '2', name: 'Vamsi', color: '#ef4444', status: RiderStatus.RIDING, location: { lat: 17.4400, lng: 78.4000, timestamp: Date.now(), speed: 38 } },
];

const App: React.FC = () => {
  const [isJoined, setIsJoined] = useState(false);
  const [joinMode, setJoinMode] = useState<'create' | 'join'>('join');
  const [userName, setUserName] = useState('');
  const [tripCode, setTripCode] = useState('RIDE-786');
  const [showMocks, setShowMocks] = useState(true);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [tripStatus, setTripStatus] = useState<string>('Ready for adventure...');
  const [mapCenter, setMapCenter] = useState<[number, number]>(INITIAL_CENTER);
  const [isInvited, setIsInvited] = useState(false);
  
  const [destination, setDestination] = useState('Srisailam Dam');
  const [isEditingDest, setIsEditingDest] = useState(false);
  const [tempDest, setTempDest] = useState(destination);

  // Parse URL for invite codes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setTripCode(code.toUpperCase());
      setJoinMode('join');
      setIsInvited(true);
    }
  }, []);

  const activeRiders = showMocks ? [...riders, ...MOCK_RIDERS] : riders;

  const currentTrip: Trip = {
    id: tripCode,
    name: `Ride to ${destination}`,
    destination: destination,
    riders: activeRiders,
    startTime: Date.now(),
  };

  const askAi = useCallback(async (prompt: string) => {
    setAiLoading(true);
    try {
      const answer = await getRideAdvice(currentTrip, prompt);
      const newMsg: ChatMessage = {
        id: Date.now().toString(),
        senderId: 'ai',
        senderName: 'RideSync AI',
        text: String(answer),
        timestamp: Date.now(),
        isAi: true,
      };
      setMessages(prev => [newMsg, ...prev].slice(0, 5));
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  }, [currentTrip]);

  const getSummary = useCallback(async () => {
    if (activeRiders.length === 0) return;
    setAiLoading(true);
    try {
      const summary = await getQuickStatusUpdate(currentTrip);
      setTripStatus(String(summary));
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  }, [currentTrip, activeRiders.length]);

  useEffect(() => {
    if (isJoined) {
      setTimeout(() => {
        getSummary();
        askAi(`Mawa, give us a quick route briefing for our trip to ${destination}.`);
      }, 1000);
    }
  }, [isJoined]);

  // Handle Current User's Real Location
  useEffect(() => {
    if (!isJoined) return;

    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed } = pos.coords;
          setRiders(prev => {
            const exists = prev.some(r => r.id === 'me');
            if (exists) {
              return prev.map(r => r.id === 'me' ? {
                ...r,
                location: { lat: latitude, lng: longitude, speed: (speed || 0) * 3.6, timestamp: Date.now() }
              } : r);
            } else {
              return [{
                id: 'me',
                name: userName || 'Me',
                color: '#ec4899',
                isMe: true,
                status: RiderStatus.RIDING,
                location: { lat: latitude, lng: longitude, speed: (speed || 0) * 3.6, timestamp: Date.now() }
              }];
            }
          });
          if (riders.length === 0) setMapCenter([latitude, longitude]);
        },
        (err) => {
           alert("Mawa! Please enable Location/GPS to show up on the map.");
           console.warn("Geolocation error:", err);
        },
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isJoined, userName]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim() && tripCode.trim()) {
      setIsJoined(true);
    }
  };

  const shareInviteLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('code', tripCode);
    navigator.clipboard.writeText(url.toString());
    alert("Magic Invite Link copied! WhatsApp it to your friends. They just need to click it and enter their name.");
  };

  if (!isJoined) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#020617] p-4 overflow-auto z-[9999]">
        <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-600/30">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">RideSync</h1>
            {isInvited ? (
              <p className="text-indigo-400 text-sm font-bold bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 animate-bounce">
                Mawa! You are invited to Trip {tripCode}
              </p>
            ) : (
              <p className="text-slate-400 text-sm italic">Connect with your biking gang.</p>
            )}
          </div>

          <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 mb-6">
            <button 
              onClick={() => setJoinMode('join')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${joinMode === 'join' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Join Trip
            </button>
            <button 
              onClick={() => { setJoinMode('create'); setTripCode(`RIDE-${Math.floor(Math.random()*900)+100}`); setIsInvited(false); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${joinMode === 'create' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Create New
            </button>
          </div>
          
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Your Name</label>
              <input 
                type="text" 
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ex: Bunny"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Trip Code</label>
              <input 
                type="text" 
                value={tripCode}
                onChange={(e) => setTripCode(e.target.value.toUpperCase())}
                placeholder="Ex: RIDE-786"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono tracking-widest"
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all mt-4 uppercase tracking-widest text-sm"
            >
              Let's Go!
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-[#020617] text-slate-100 overflow-hidden">
      <aside className="w-full md:w-80 flex flex-col border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900 z-50 overflow-hidden shrink-0">
        <div className="p-6 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-bold tracking-tight">RideSync</h2>
          </div>

          <div className="mb-6 p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20">
             <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">GANG CODE</h3>
                <span className="text-[9px] text-indigo-400/60 font-bold uppercase">Public</span>
             </div>
             <div className="flex items-center justify-between">
                <span className="text-lg font-mono font-bold text-white tracking-wider">{tripCode}</span>
                <button 
                  onClick={shareInviteLink}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition-all shadow-lg shadow-indigo-600/10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                  </svg>
                  INVITE
                </button>
             </div>
          </div>
          
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-700/30 mb-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Destination</h3>
              {!isEditingDest ? (
                <button 
                  onClick={() => { setIsEditingDest(true); setTempDest(destination); }}
                  className="text-[9px] text-slate-500 hover:text-indigo-400 transition-colors uppercase font-bold"
                >
                  Edit
                </button>
              ) : (
                <button 
                  onClick={() => { setDestination(tempDest); setIsEditingDest(false); askAi(`We updated destination to ${tempDest}. Suggestions?`); }}
                  className="text-[9px] text-green-500 hover:text-green-400 transition-colors uppercase font-bold"
                >
                  Save
                </button>
              )}
            </div>
            {isEditingDest ? (
              <input 
                autoFocus
                type="text"
                value={tempDest}
                onChange={(e) => setTempDest(e.target.value)}
                // Fix: An expression of type 'void' cannot be tested for truthiness.
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setDestination(tempDest);
                    setIsEditingDest(false);
                  }
                }}
                className="w-full bg-slate-900 border-b border-indigo-500 text-sm font-bold text-white focus:outline-none py-1"
              />
            ) : (
              <p className="text-sm font-bold text-slate-100">{destination}</p>
            )}
          </div>

          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Squad ({activeRiders.length})</h3>
            <button 
              onClick={() => setShowMocks(!showMocks)}
              className={`text-[9px] font-bold px-2 py-0.5 rounded border transition-colors ${showMocks ? 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
            >
              {showMocks ? 'MOCKS ON' : 'REAL ONLY'}
            </button>
          </div>
          
          <div className="space-y-2 overflow-y-auto max-h-[160px] md:max-h-[200px] pr-1 scrollbar-hide">
            {activeRiders.map(rider => (
              <RiderCard key={rider.id} rider={rider} />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
           <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ride Assistant</h3>
              <button onClick={getSummary} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider disabled:opacity-50">
                {aiLoading ? '...' : 'Refresh'}
              </button>
           </div>
           
           <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] italic text-slate-400 leading-relaxed min-h-[60px] flex items-center relative overflow-hidden">
             {aiLoading && <div className="absolute inset-0 bg-indigo-500/5 animate-pulse"></div>}
             {tripStatus}
           </div>

           <div className="grid grid-cols-1 gap-2 shrink-0">
              <button 
                onClick={() => askAi(`Mawa, find the best road highlights on our route to ${destination}.`)}
                className="w-full p-3 text-left rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/30 text-xs flex items-center gap-2 transition-all"
              >
                <span className="text-indigo-400">🏍️</span> Best Route
              </button>
              <button 
                onClick={() => askAi(`Mawa, find a great dhaba or food point near our route to ${destination}.`)}
                className="w-full p-3 text-left rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/30 text-xs flex items-center gap-2 transition-all"
              >
                <span className="text-indigo-400">🍛</span> Food Stops
              </button>
           </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50 shrink-0 mt-auto">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center font-bold text-white shadow-lg shadow-pink-600/20">
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white truncate max-w-[120px]">{userName || 'User'}</p>
                <p className="text-[10px] text-green-500 uppercase tracking-widest font-bold">You are Live</p>
              </div>
              <button onClick={() => setIsJoined(false)} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
              </button>
           </div>
        </div>
      </aside>

      <main className="flex-1 relative bg-slate-950 overflow-hidden">
        <MapComponent riders={activeRiders} center={mapCenter} />
        
        <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none flex flex-col items-center md:items-end">
           <div className="w-full md:w-[350px] space-y-3 pointer-events-auto max-h-[70vh] overflow-y-auto scrollbar-hide">
             {messages.map(msg => (
                <div key={msg.id} className="p-4 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 border backdrop-blur-xl bg-slate-900/95 border-indigo-500/20 shadow-indigo-500/10">
                   <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white bg-indigo-600">AI</div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">{msg.senderName}</span>
                      </div>
                      <button onClick={() => setMessages(prev => prev.filter(m => m.id !== msg.id))} className="text-slate-500 hover:text-slate-300 p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                      </button>
                   </div>
                   <p className="text-sm text-slate-200 leading-relaxed font-medium">{String(msg.text)}</p>
                </div>
             ))}
           </div>
        </div>

        <div className="absolute bottom-6 left-6 flex flex-col gap-3 z-[1000]">
           <button className="w-14 h-14 rounded-2xl bg-red-600 text-white shadow-xl shadow-red-600/20 flex items-center justify-center hover:bg-red-500 active:scale-95 transition-all group border border-red-500/20" onClick={() => alert("SOS Alert sent to the squad!")}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
           </button>
        </div>

        <div className="absolute bottom-6 right-6 z-[1000]">
           <button 
            className="px-5 py-3 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 font-bold text-xs flex items-center gap-2 hover:bg-indigo-500 active:scale-95 transition-all border border-indigo-500/20"
            onClick={() => {
              const myRider = riders.find(r => r.id === 'me');
              if (myRider) setMapCenter([myRider.location.lat, myRider.location.lng]);
            }}
           >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Find Me
           </button>
        </div>
      </main>
    </div>
  );
};

export default App;
