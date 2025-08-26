// Proof system for verifiable Tetris moves
class ProofSystem {
  constructor() {
    this.moveHistory = [];
    this.gameState = null;
  }

  // Generate SHA-256 hash using Web Crypto API
  async generateHash(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Create a proof for a move
  async createMoveProof(moveType, gameStateBefore, gameStateAfter, timestamp) {
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
  }

  // Serialize game state for hashing
  serializeGameState(gameState) {
    return {
      board: gameState.board,
      currentPiece: gameState.currentPiece,
      score: gameState.score,
      level: gameState.level,
      lines: gameState.lines
    };
  }

  // Verify a move proof
  async verifyMoveProof(proof) {
    const { hash, ...moveData } = proof;
    const recalculatedHash = await this.generateHash(moveData);
    return hash === recalculatedHash;
  }

  // Verify entire game history
  async verifyGameHistory() {
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