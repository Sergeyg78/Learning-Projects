import React, { useState } from 'react';

function ProofLog({ proofs, proofSystem }) {
  const [selectedProof, setSelectedProof] = useState(null);
  const [verificationResults, setVerificationResults] = useState({});
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyProof = async (proof, index) => {
    setIsVerifying(true);
    try {
      const isValid = await proofSystem.verifyMoveProof(proof);
      setVerificationResults(prev => ({
        ...prev,
        [index]: isValid
      }));
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationResults(prev => ({
        ...prev,
        [index]: false
      }));
    }
    setIsVerifying(false);
  };

  const verifyAllProofs = async () => {
    setIsVerifying(true);
    try {
      const result = await proofSystem.verifyGameHistory();
      
      if (result.valid) {
        const allValid = {};
        proofs.forEach((_, index) => {
          allValid[index] = true;
        });
        setVerificationResults(allValid);
      } else {
        const results = {};
        proofs.forEach((_, index) => {
          results[index] = index < result.invalidMoveIndex;
        });
        setVerificationResults(results);
      }
    } catch (error) {
      console.error('Verification error:', error);
    }
    setIsVerifying(false);
  };

  const exportProofs = () => {
    const proofData = proofSystem.exportProof();
    const blob = new Blob([proofData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tetris-proofs-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getMoveTypeDisplay = (moveType) => {
    const moveTypes = {
      'move_left': '← Left',
      'move_right': '→ Right',
      'rotate': '↻ Rotate',
      'soft_drop': '↓ Soft Drop',
      'hard_drop': '⇓ Hard Drop',
      'auto_drop': '⏱ Auto Drop'
    };
    return moveTypes[moveType] || moveType;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-morphism rounded-lg p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-cyan-400 mb-1">Move Proofs</h2>
            <p className="text-gray-400 text-sm">
              Cryptographic verification of each game move
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={verifyAllProofs}
              disabled={isVerifying || proofs.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-medium transition-colors flex items-center gap-2"
            >
              {isVerifying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Verifying...
                </>
              ) : (
                '✓ Verify All'
              )}
            </button>
            
            <button
              onClick={exportProofs}
              disabled={proofs.length === 0}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-medium transition-colors"
            >
              📁 Export
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-morphism rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400">{proofs.length}</div>
          <div className="text-gray-400 text-sm">Total Moves</div>
        </div>
        
        <div className="glass-morphism rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            {Object.values(verificationResults).filter(Boolean).length}
          </div>
          <div className="text-gray-400 text-sm">Verified</div>
        </div>
        
        <div className="glass-morphism rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {proofs.length - Object.keys(verificationResults).length}
          </div>
          <div className="text-gray-400 text-sm">Pending</div>
        </div>
      </div>

      {/* Proof List */}
      <div className="glass-morphism rounded-lg">
        <div className="p-4 border-b border-gray-600">
          <h3 className="text-lg font-semibold text-cyan-400">Move History</h3>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {proofs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-4xl mb-2">🎮</div>
              <p>No moves recorded yet</p>
              <p className="text-sm">Start playing to generate proofs!</p>
            </div>
          ) : (
            <div className="proof-log">
              {proofs.map((proof, index) => (
                <div
                  key={index}
                  className={`border-b border-gray-700 p-3 hover:bg-gray-800/50 transition-colors cursor-pointer ${
                    selectedProof === index ? 'bg-gray-800/70' : ''
                  }`}
                  onClick={() => setSelectedProof(selectedProof === index ? null : index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-sm w-8">#{index + 1}</span>
                      <span className="font-medium text-white">
                        {getMoveTypeDisplay(proof.moveType)}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {formatTimestamp(proof.timestamp)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {verificationResults[index] === true && (
                        <span className="text-green-400 text-sm">✓ Valid</span>
                      )}
                      {verificationResults[index] === false && (
                        <span className="text-red-400 text-sm">✗ Invalid</span>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          verifyProof(proof, index);
                        }}
                        disabled={isVerifying}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-2 py-1 rounded text-xs transition-colors"
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                  
                  {selectedProof === index && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-400 mb-1">Hash:</div>
                          <div className="font-mono text-xs bg-gray-800 p-2 rounded break-all">
                            {proof.hash}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-gray-400 mb-1">Move Index:</div>
                          <div className="text-white">{proof.moveIndex}</div>
                          
                          {proof.previousMoveHash && (
                            <>
                              <div className="text-gray-400 mb-1 mt-2">Previous Hash:</div>
                              <div className="font-mono text-xs bg-gray-800 p-2 rounded break-all">
                                {proof.previousMoveHash.slice(0, 32)}...
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <div className="text-gray-400 mb-1">Score Change:</div>
                        <div className="text-white">
                          {proof.gameStateBefore.score} → {proof.gameStateAfter.score}
                          {proof.gameStateAfter.score > proof.gameStateBefore.score && (
                            <span className="text-green-400 ml-2">
                              (+{proof.gameStateAfter.score - proof.gameStateBefore.score})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

window.ProofLog = ProofLog;