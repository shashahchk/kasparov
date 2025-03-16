import { Board, Piece } from "../components/chessboard.js";

export function initBoard(): Board {
  const board: (Piece | null)[][] = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));

  const initPos: Record<Piece, Array<{ row: number; col: number }>> = {
    "w-pawn": Array(8)
      .fill(0)
      .map((_, i) => ({ row: 1, col: i })),
    "w-rook": [
      { row: 0, col: 0 },
      { row: 0, col: 7 },
    ],
    "w-knight": [
      { row: 0, col: 1 },
      { row: 0, col: 6 },
    ],
    "w-bishop": [
      { row: 0, col: 2 },
      { row: 0, col: 5 },
    ],
    "w-queen": [{ row: 0, col: 3 }],
    "w-king": [{ row: 0, col: 4 }],
    "b-pawn": Array(8)
      .fill(0)
      .map((_, i) => ({ row: 6, col: i })),
    "b-rook": [
      { row: 7, col: 0 },
      { row: 7, col: 7 },
    ],
    "b-knight": [
      { row: 7, col: 1 },
      { row: 7, col: 6 },
    ],
    "b-bishop": [
      { row: 7, col: 2 },
      { row: 7, col: 5 },
    ],
    "b-queen": [{ row: 7, col: 3 }],
    "b-king": [{ row: 7, col: 4 }],
  };

  // Place pieces on board
  Object.entries(initPos).forEach(([piece, positions]) => {
    positions.forEach(({ row, col }) => {
      board[row][col] = piece as Piece;
    });
  });

  return board;
}
