import { Board, Piece, Position } from "../components/chessboard.js";

export interface Move {
  from: Position;
  to: Position;
}

export function getMoveString(move: Move): string {
  const [fromRow, fromCol] = move.from;
  const [toRow, toCol] = move.to;
  return `${fromCol}${fromRow}-${toCol}${toRow}`;
}

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

export function getValidMoves(board: Board, selectedPos: Position): Position[] {
  const piece = board[selectedPos[0]][selectedPos[1]];
  if (piece == null) return [];

  const [_, pieceType] = piece.split("-");
  switch (pieceType) {
    case "pawn":
      return getValidPawnMoves(board, selectedPos);
    case "rook":
      return getValidRookMoves(board, selectedPos);
    case "bishop":
      return getValidBishopMoves(board, selectedPos);
    case "knight":
      return getValidKnightMoves(board, selectedPos);
    case "queen":
      return getValidQueenMoves(board, selectedPos);
    case "king":
      return getValidKingMoves(board, selectedPos);
    default:
      return [];
  }
}

function getValidKnightMoves(board: Board, selectedPos: Position): Position[] {
  const moves = [
    [2, 1],
    [2, -1],
    [-2, 1],
    [-2, -1],
    [1, 2],
    [1, -2],
    [-1, 2],
    [-1, -2],
  ];

  const validMoves: Position[] = moves
    .map(([row, col]): Position => [selectedPos[0] + row, selectedPos[1] + col])
    .filter(([row, col]) => row >= 0 && row < 8 && col >= 0 && col < 8)
    .filter(([row, col]) => {
      const piece = board[row][col];
      return piece == null;
    });

  return validMoves;
}

function getValidPawnMoves(board: Board, selectedPos: Position): Position[] {
  const moves = [[-1, 0]];

  const validMoves = moves
    .map(([row, col]): Position => [selectedPos[0] + row, selectedPos[1] + col])
    .filter(([row, col]) => row >= 0 && row < 8 && col >= 0 && col < 8)
    .filter(([row, col]) => {
      const piece = board[row][col];
      return piece == null;
    });

  return validMoves;
}

function getValidKingMoves(board: Board, selectedPos: Position): Position[] {
  const moves = [
    [1, 1],
    [1, 0],
    [1, -1],
    [0, 1],
    [0, -1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
  ];

  const validMoves: Position[] = moves
    .map(([row, col]): Position => [selectedPos[0] + row, selectedPos[1] + col])
    .filter(([row, col]) => row >= 0 && row < 8 && col >= 0 && col < 8)
    .filter(([row, col]) => {
      const piece = board[row][col];
      return piece == null;
    });

  return validMoves;
}

function getValidRookMoves(board: Board, selectedPos: Position): Position[] {
  const moves = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  const validMoves: Position[] = moves
    .map(([row, col]): Position => [selectedPos[0] + row, selectedPos[1] + col])
    .filter(([row, col]) => row >= 0 && row < 8 && col >= 0 && col < 8)
    .filter(([row, col]) => {
      const piece = board[row][col];
      return piece == null;
    });

  return validMoves;
}

function getValidBishopMoves(board: Board, selectedPos: Position): Position[] {
  const moves = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];

  const validMoves: Position[] = moves
    .map(([row, col]): Position => [selectedPos[0] + row, selectedPos[1] + col])
    .filter(([row, col]) => row >= 0 && row < 8 && col >= 0 && col < 8)
    .filter(([row, col]) => {
      const piece = board[row][col];
      return piece == null;
    });

  return validMoves;
}

function getValidQueenMoves(board: Board, selectedPos: Position): Position[] {
  const moves = [
    [1, 1],
    [1, 0],
    [1, -1],
    [0, 1],
    [0, -1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
  ];

  const validMoves: Position[] = moves
    .map(([row, col]): Position => [selectedPos[0] + row, selectedPos[1] + col])
    .filter(([row, col]) => row >= 0 && row < 8 && col >= 0 && col < 8)
    .filter(([row, col]) => {
      const piece = board[row][col];
      return piece == null;
    });

  return validMoves;
}
