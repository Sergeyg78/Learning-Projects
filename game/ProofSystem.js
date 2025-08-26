// Proof system for verifiable Tetris moves
class ProofSystem {
  constructor() {
    this.moveHistory = [];
    this.gameState = null;
  }

  // Generate SHA-256 hash using Web Crypto API
  async generateHash(data) {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(JSON.stringify(data));
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Hash generation error:', error);
      // Fallback to simple hash
      return this.simpleHash(JSON.stringify(data));
    }
  }

  // Simple fallback hash function
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  // Create a proof for a move
  async createMoveProof(moveType, gameStateBefore, gameStateAfter, timestamp) {
    try {
      const moveData = {
        moveType,
        timestamp,
        gameStateBefore: this.serializeGameState(gameStateBefore),
        gameStateAfter: this.serializeGameState(gameStateAfter),
        moveIndex: this.moveHistory.length
      };

      // Add previous move hash for chaining
      if (this.moveHistory.length > 0) {
        moveData.previousMoveHash = this.moveHistory[this.moveHistory.length - 1].hash;
      }

      const hash = await this.generateHash(moveData);
      
      const proof = {
        ...moveData,
        hash,
        valid: true
      };

      this.moveHistory.push(proof);
      return proof;
    } catch (error) {
      console.error('Proof creation error:', error);
      return null;
    }
  }

  // Serialize game state for hashing
  serializeGameState(gameState) {
    if (!gameState) return null;
    
    return {
      board: gameState.board || [],
      currentPiece: gameState.currentPiece || null,
      score: gameState.score || 0,
      level: gameState.level || 1,
      lines: gameState.lines || 0,
      gameOver: gameState.gameOver || false
    };
  }

  // Verify a move proof
  async verifyMoveProof(proof) {
    try {
      if (!proof || !proof.hash) return false;
      
      const { hash, ...moveData } = proof;
      const recalculatedHash = await this.generateHash(moveData);
      return hash === recalculatedHash;
    } catch (error) {
      console.error('Proof verification error:', error);
      return false;
    }
  }

  // Verify entire game history
  async verifyGameHistory() {
    try {
      for (let i = 0; i < this.moveHistory.length; i++) {
        const proof = this.moveHistory[i];
        const isValid = await this.verifyMoveProof(proof);
        
        if (!isValid) {
          return { valid: false, invalidMoveIndex: i };
        }

        // Check chain integrity
        if (i > 0) {
          const previousHash = this.moveHistory[i - 1].hash;
          if (proof.previousMoveHash !== previousHash) {
            return { valid: false, invalidMoveIndex: i, reason: 'Chain broken' };
          }
        }
      }
      
      return { valid: true };
    } catch (error) {
      console.error('History verification error:', error);
      return { valid: false, error: error.message };
    }
  }

  // Get move history
  getMoveHistory() {
    return this.moveHistory;
  }

  // Clear history (for new game)
  clearHistory() {
    this.moveHistory = [];
  }

  // Export game proof as JSON
  exportProof() {
    return JSON.stringify(this.moveHistory, null, 2);
  }
}

window.ProofSystem = ProofSystem;