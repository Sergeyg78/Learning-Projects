import React, { useState, useEffect, useCallback, useRef } from 'react';

function GameUI({ game, onProofGenerated }) {
  const [gameState, setGameState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastUpdateRef = useRef(0);
  const animationRef = useRef(null);

  const updateGameState = useCallback(() => {
    if (game) {
      try {
        const state = game.getGameState();
        setGameState(state);
        setIsLoading(false);
      } catch (error) {
        console.error('Game state update error:', error);
      }
    }
  }, [game]);

  const handleMove = useCallback(async (moveType) => {
    if (!game || !gameState || gameState.gameOver) return;
    
    try {
      const result = await game.makeMove(moveType);
      if (result?.proof && onProofGenerated) {
        onProofGenerated(result.proof);
      }
      updateGameState();
    } catch (error) {
      console.error('Move error:', error);
    }
  }, [game, gameState, onProofGenerated, updateGameState]);

  // Game loop
  useEffect(() => {
    if (!game) return;

    const gameLoop = (timestamp) => {
      if (game && !game.gameOver) {
        const deltaTime = timestamp - lastUpdateRef.current;
        
        if (deltaTime >= 16) { // ~60 FPS
          game.makeMove('auto_drop', deltaTime).then((result) => {
            if (result?.proof && onProofGenerated) {
              onProofGenerated(result.proof);
            }
            updateGameState();
          }).catch(error => {
            console.error('Auto drop error:', error);
          });
          
          lastUpdateRef.current = timestamp;
        }
      }
      
      animationRef.current = requestAnimationFrame(gameLoop);
    };

    animationRef.current = requestAnimationFrame(gameLoop);
    updateGameState();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [game, onProofGenerated, updateGameState]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!game || !gameState || gameState.gameOver) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          handleMove('move_left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          handleMove('move_right');
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          handleMove('rotate');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          handleMove('soft_drop');
          break;
        case ' ':
          e.preventDefault();
          handleMove('hard_drop');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleMove, game, gameState]);

  if (isLoading || !gameState) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-400 mx-auto"></div>
          <div className="animate-pulse text-cyan-400 text-xl mt-4">Initializing game...</div>
        </div>
      </div>
    );
  }

  const renderBoard = () => {
    try {
      const board = JSON.parse(JSON.stringify(gameState.board || []));
      
      // Add current piece to board for rendering
      if (gameState.currentPiece) {
        const piece = gameState.currentPiece;
        for (let row = 0; row < piece.shape.length; row++) {
          for (let col = 0; col < piece.shape[row].length; col++) {
            if (piece.shape[row][col]) {
              const x = piece.x + col;
              const y = piece.y + row;
              if (y >= 0 && y < board.length && x >= 0 && x < board[0].length) {
                board[y][x] = piece.color;
              }
            }
          }
        }
      }

      return board.map((row, rowIndex) => (
        <div key={rowIndex} className="flex">
          {row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="w-6 h-6 border transition-all duration-100"
              style={{
                backgroundColor: cell || '#001122',
                borderColor: cell ? '#ffffff' : '#334455',
                boxShadow: cell ? '0 0 5px rgba(255,255,255,0.3)' : 'none'
              }}
            />
          ))}
        </div>
      ));
    } catch (error) {
      console.error('Board render error:', error);
      return <div className="text-red-400">Error rendering board</div>;
    }
  };

  const renderNextPiece = () => {
    try {
      if (!game?.nextPiece) return null;

      const nextShape = game.nextPiece.shape;
      const maxSize = 4;
      
      return (
        <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${maxSize}, minmax(0, 1fr))` }}>
          {Array(maxSize).fill().map((_, row) => 
            Array(maxSize).fill().map((_, col) => {
              const hasBlock = nextShape[row] && nextShape[row][col];
              return (
                <div
                  key={`${row}-${col}`}
                  className="w-4 h-4 border border-gray-700"
                  style={{
                    backgroundColor: hasBlock ? game.nextPiece.color : 'transparent',
                    borderColor: hasBlock ? '#ffffff' : '#444'
                  }}
                />
              );
            })
          )}
        </div>
      );
    } catch (error) {
      console.error('Next piece render error:', error);
      return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6">
      {/* Game Board */}
      <div className="flex flex-col items-center">
        <div className="game-board p-4 rounded-lg animate-tetris-glow mb-4">
          <div className="flex flex-col border-2 border-cyan-400 bg-gray-900 p-2 rounded">
            {renderBoard()}
          </div>
        </div>
        
        {/* Controls */}
        <div className="glass-morphism rounded-lg p-4 max-w-md">
          <h3 className="text-cyan-400 font-bold mb-3 text-center">Controls</h3>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div></div>
            <button
              onClick={() => handleMove('rotate')}
              disabled={gameState.gameOver}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded text-sm transition-colors"
            >
              ↻ Rotate
            </button>
            <div></div>
            
            <button
              onClick={() => handleMove('move_left')}
              disabled={gameState.gameOver}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded text-sm transition-colors"
            >
              ← Left
            </button>
            <button
              onClick={() => handleMove('soft_drop')}
              disabled={gameState.gameOver}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded text-sm transition-colors"
            >
              ↓ Drop
            </button>
            <button
              onClick={() => handleMove('move_right')}
              disabled={gameState.gameOver}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-2 rounded text-sm transition-colors"
            >
              Right →
            </button>
          </div>
          
          <button
            onClick={() => handleMove('hard_drop')}
            disabled={gameState.gameOver}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-bold transition-colors"
          >
            SPACE - Hard Drop
          </button>
          
          <div className="text-xs text-gray-400 mt-2 text-center">
            Use arrow keys (WASD) or buttons to play
          </div>
        </div>
      </div>

      {/* Game Info */}
      <div className="flex flex-col gap-4 min-w-[200px]">
        {/* Score Panel */}
        <div className="glass-morphism rounded-lg p-4">
          <h3 className="text-cyan-400 font-bold mb-3">Game Stats</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-300">Score:</span>
              <span className="text-yellow-400 font-mono">{(gameState.score || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Level:</span>
              <span className="text-green-400 font-mono">{gameState.level || 1}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Lines:</span>
              <span className="text-purple-400 font-mono">{gameState.lines || 0}</span>
            </div>
          </div>
        </div>

        {/* Next Piece */}
        <div className="glass-morphism rounded-lg p-4">
          <h3 className="text-cyan-400 font-bold mb-3">Next Piece</h3>
          <div className="flex justify-center">
            {renderNextPiece()}
          </div>
        </div>

        {/* Game Over */}
        {gameState.gameOver && (
          <div className="glass-morphism rounded-lg p-4 border-red-500 bg-red-900/20">
            <h3 className="text-red-400 font-bold mb-3 text-center">Game Over!</h3>
            <div className="text-center">
              <div className="text-gray-300 mb-2">Final Score: {(gameState.score || 0).toLocaleString()}</div>
              <button
                onClick={() => {
                  if (game) {
                    game.restart();
                    updateGameState();
                  }
                }}
                className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded font-bold transition-colors"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

window.GameUI = GameUI;