// Tetris game logic with proof generation
class TetrisGame {
  constructor(proofSystem) {
    this.proofSystem = proofSystem;
    this.boardWidth = 10;
    this.boardHeight = 20;
    this.board = this.createEmptyBoard();
    this.currentPiece = null;
    this.nextPiece = null;
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.gameOver = false;
    this.dropTime = 0;
    this.dropInterval = 1000; // 1 second
    this.lastMoveTime = 0;
    this.moveDelay = 100; // Prevent too rapid moves
    
    this.pieces = [
      { // I piece
        shape: [[1,1,1,1]],
        color: '#00ffff'
      },
      { // O piece
        shape: [[1,1],[1,1]],
        color: '#ffff00'
      },
      { // T piece
        shape: [[0,1,0],[1,1,1]],
        color: '#800080'
      },
      { // S piece
        shape: [[0,1,1],[1,1,0]],
        color: '#00ff00'
      },
      { // Z piece
        shape: [[1,1,0],[0,1,1]],
        color: '#ff0000'
      },
      { // J piece
        shape: [[1,0,0],[1,1,1]],
        color: '#0000ff'
      },
      { // L piece
        shape: [[0,0,1],[1,1,1]],
        color: '#ffa500'
      }
    ];

    this.init();
  }

  createEmptyBoard() {
    return Array(this.boardHeight).fill().map(() => Array(this.boardWidth).fill(0));
  }

  init() {
    this.currentPiece = this.createNewPiece();
    this.nextPiece = this.createNewPiece();
    this.gameOver = false;
  }

  createNewPiece() {
    const pieceIndex = Math.floor(Math.random() * this.pieces.length);
    const piece = JSON.parse(JSON.stringify(this.pieces[pieceIndex]));
    
    return {
      shape: piece.shape,
      color: piece.color,
      x: Math.floor(this.boardWidth / 2) - Math.floor(piece.shape[0].length / 2),
      y: 0
    };
  }

  getGameState() {
    return {
      board: JSON.parse(JSON.stringify(this.board)),
      currentPiece: this.currentPiece ? JSON.parse(JSON.stringify(this.currentPiece)) : null,
      score: this.score,
      level: this.level,
      lines: this.lines,
      gameOver: this.gameOver
    };
  }

  async makeMove(moveType, deltaTime = 0) {
    if (this.gameOver) return { success: false, proof: null };

    const now = Date.now();
    if (moveType !== 'auto_drop' && now - this.lastMoveTime < this.moveDelay) {
      return { success: false, proof: null };
    }

    const gameStateBefore = this.getGameState();
    let moveSuccess = false;

    try {
      switch (moveType) {
        case 'move_left':
          moveSuccess = this.movePiece(-1, 0);
          this.lastMoveTime = now;
          break;
        case 'move_right':
          moveSuccess = this.movePiece(1, 0);
          this.lastMoveTime = now;
          break;
        case 'rotate':
          moveSuccess = this.rotatePiece();
          this.lastMoveTime = now;
          break;
        case 'soft_drop':
          moveSuccess = this.movePiece(0, 1);
          this.lastMoveTime = now;
          break;
        case 'hard_drop':
          moveSuccess = this.hardDrop();
          this.lastMoveTime = now;
          break;
        case 'auto_drop':
          moveSuccess = this.update(deltaTime);
          break;
      }

      if (moveSuccess || moveType === 'auto_drop') {
        const gameStateAfter = this.getGameState();
        const proof = await this.proofSystem.createMoveProof(
          moveType,
          gameStateBefore,
          gameStateAfter,
          now
        );
        
        return { success: moveSuccess, proof };
      }
    } catch (error) {
      console.error('Move error:', error);
    }

    return { success: false, proof: null };
  }

  movePiece(dx, dy) {
    if (!this.currentPiece) return false;

    const newX = this.currentPiece.x + dx;
    const newY = this.currentPiece.y + dy;

    if (this.isValidPosition(this.currentPiece.shape, newX, newY)) {
      this.currentPiece.x = newX;
      this.currentPiece.y = newY;
      return true;
    }

    return false;
  }

  rotatePiece() {
    if (!this.currentPiece) return false;

    const rotatedShape = this.rotateMatrix(this.currentPiece.shape);
    
    if (this.isValidPosition(rotatedShape, this.currentPiece.x, this.currentPiece.y)) {
      this.currentPiece.shape = rotatedShape;
      return true;
    }

    return false;
  }

  rotateMatrix(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = Array(cols).fill().map(() => Array(rows).fill(0));

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        rotated[j][rows - 1 - i] = matrix[i][j];
      }
    }

    return rotated;
  }

  hardDrop() {
    if (!this.currentPiece) return false;

    let dropped = false;
    while (this.movePiece(0, 1)) {
      dropped = true;
      this.score += 1; // Bonus for hard drop
    }

    if (dropped || !this.isValidPosition(this.currentPiece.shape, this.currentPiece.x, this.currentPiece.y + 1)) {
      this.placePiece();
      return true;
    }

    return false;
  }

  isValidPosition(shape, x, y) {
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const newX = x + col;
          const newY = y + row;

          if (newX < 0 || newX >= this.boardWidth || 
              newY >= this.boardHeight ||
              (newY >= 0 && this.board[newY] && this.board[newY][newX])) {
            return false;
          }
        }
      }
    }
    return true;
  }

  placePiece() {
    if (!this.currentPiece) return;

    for (let row = 0; row < this.currentPiece.shape.length; row++) {
      for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
        if (this.currentPiece.shape[row][col]) {
          const x = this.currentPiece.x + col;
          const y = this.currentPiece.y + row;
          
          if (y >= 0 && this.board[y]) {
            this.board[y][x] = this.currentPiece.color;
          }
        }
      }
    }

    this.clearLines();
    this.currentPiece = this.nextPiece;
    this.nextPiece = this.createNewPiece();

    if (!this.isValidPosition(this.currentPiece.shape, this.currentPiece.x, this.currentPiece.y)) {
      this.gameOver = true;
    }
  }

  clearLines() {
    let linesCleared = 0;
    
    for (let row = this.boardHeight - 1; row >= 0; row--) {
      if (this.board[row].every(cell => cell !== 0)) {
        this.board.splice(row, 1);
        this.board.unshift(Array(this.boardWidth).fill(0));
        linesCleared++;
        row++; // Check the same row again
      }
    }

    if (linesCleared > 0) {
      this.lines += linesCleared;
      const lineBonus = [0, 100, 300, 500, 800][linesCleared] || 100;
      this.score += lineBonus * this.level;
      this.level = Math.floor(this.lines / 10) + 1;
      this.dropInterval = Math.max(50, 1000 - (this.level - 1) * 50);
    }
  }

  update(deltaTime) {
    if (this.gameOver || !this.currentPiece) return false;

    this.dropTime += deltaTime;
    
    if (this.dropTime >= this.dropInterval) {
      this.dropTime = 0;
      
      if (!this.movePiece(0, 1)) {
        this.placePiece();
      }
      
      return true;
    }
    
    return false;
  }

  restart() {
    this.board = this.createEmptyBoard();
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.gameOver = false;
    this.dropTime = 0;
    this.dropInterval = 1000;
    this.lastMoveTime = 0;
    this.proofSystem.clearHistory();
    this.init();
  }
}

window.TetrisGame = TetrisGame;