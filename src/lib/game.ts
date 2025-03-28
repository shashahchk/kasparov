import { Board, Piece, Position } from "../components/chessboard.js";
import { Chess } from "chess.js";

export interface Move {
  from: string;
  to: string;
}

export type PGN = string;

export function getSquareString(row: number, col: number): string {
  return `${String.fromCharCode(97 + col)}${8 - row}`;
}

export function getMoveString(move: Move): string {
  return `${move.from}-${move.to}`;
}

export function initBoard(): PGN {
  const chess = new Chess();
  return chess.pgn();
}

export function getValidMoves(game: Chess, currSelectPiece: string): string[] {
  const moves = game.moves({ verbose: true });
  const validMoves = moves
    .filter((move) => move.from === currSelectPiece)
    .map((move) => {
      return move.to.toString();
    });

  return validMoves;
}

export function getHistory(game: Chess): Move[] {
  return game.history({ verbose: true }) as Move[];
}

export function navigateToMove(pgn: PGN, moveIndex: number): Chess {
  console.log("Navigate to move being called, index:", moveIndex);
  const game = new Chess();
  game.loadPgn(pgn);

  // Get full history with FEN information
  const history = game.history({ verbose: true });
  const totalMoves = history.length;

  // Handle edge cases
  if (moveIndex < 0 || history.length === 0) {
    return new Chess(); // Return a fresh board at starting position
  }

  if (moveIndex >= totalMoves) {
    return game; // Already at the latest position
  }

  // Create a new Chess instance for the target position
  const targetGame = new Chess();

  // For the initial position (before any moves)
  if (moveIndex === 0 && history.length > 0) {
    // Load the "before" FEN of the first move
    targetGame.load(history[0].before);
    return targetGame;
  }

  // For any other position, load the "after" FEN of the previous move
  if (moveIndex > 0) {
    // The "after" FEN of move index-1 is the state we want
    targetGame.load(history[moveIndex - 1].after);
    return targetGame;
  }

  // Fallback to the old method if FEN information is not available
  game.reset();
  for (let i = 0; i <= Math.min(moveIndex, history.length - 1); i++) {
    game.move(history[i]);
  }

  return game;
}
