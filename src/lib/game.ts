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
  for (let i = 0; i < 15; i++) {
    chess.move(chess.moves()[Math.floor(Math.random() * chess.moves().length)]);
  }
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
  const game = new Chess();
  game.loadPgn(pgn);

  if (moveIndex < 0) {
    return game;
  }

  const history = game.history({ verbose: true });
  // Reset to starting position
  game.reset();

  // Replay moves up to the selected index
  for (let i = 0; i <= Math.min(moveIndex, history.length - 1); i++) {
    game.move(history[i]);
  }

  return game;
}
