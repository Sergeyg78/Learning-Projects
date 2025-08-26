import React, { useState, useEffect } from 'react';
const GameUI = window.GameUI;
const ProofLog = window.ProofLog;
const TetrisGame = window.TetrisGame;
const ProofSystem = window.ProofSystem;
function App() {
  const [game, setGame] = useState(null);
  const [proofSystem, setProofSystem] = useState(null);
  const [proofs, setProofs] = useState([]);
  const [activeTab, setActiveTab] = useState('game');

  useEffect(() => {
    const proofSys = new ProofSystem();
    const tetrisGame = new TetrisGame(proofSys);
    
    setProofSystem(proofSys);
    setGame(tetrisGame);
  }, []);

  const handleProofGenerated = (proof) => {
    setProofs(prev => [...prev, proof]);
  };

  const handleNewGame = () => {
    if (game) {
      game.restart();
      setProofs([]);
    }
  };

  if (!game || !proofSystem) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-400"></div>
        <p className="mt-4 text-cyan-400 text-lg">Loading Verifiable Tetris...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Verifiable Tetris
            </h1>
            <p className="text-gray-400 mt-1">
              Every move generates cryptographic proof for verification
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab('game')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'game'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              🎮 Game
            </button>
            
            <button
              onClick={() => setActiveTab('proofs')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'proofs'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              🔐 Proofs ({proofs.length})
            </button>
            
            <button
              onClick={handleNewGame}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              🔄 New Game
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        {activeTab === 'game' && (
          <GameUI 
            game={game} 
            onProofGenerated={handleProofGenerated}
          />
        )}
        
        {activeTab === 'proofs' && (
          <ProofLog 
            proofs={proofs} 
            proofSystem={proofSystem}
          />
        )}
      </div>
    </div>
  );
}

export default App;
window.App = App;