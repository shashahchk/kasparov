import { Devvit } from "@devvit/public-api";
import { getValidMoves } from "../lib/game.js";

const CHESS_PIECE_ICONS = {
  "b-rook": "♜",
  "b-bishop": "♝",
  "b-knight": "♞",
  "b-pawn": "♟",
  "b-queen": "♛",
  "b-king": "♚",
  "w-rook": "♖",
  "w-bishop": "♗",
  "w-knight": "♘",
  "w-pawn": "♙",
  "w-queen": "♕",
  "w-king": "♔",
};

export type Position = [number, number];

export type Piece =
  | "b-rook"
  | "b-bishop"
  | "b-knight"
  | "b-pawn"
  | "b-queen"
  | "b-king"
  | "w-rook"
  | "w-bishop"
  | "w-knight"
  | "w-pawn"
  | "w-queen"
  | "w-king";

export type PieceType =
  | "rook"
  | "bishop"
  | "knight"
  | "pawn"
  | "queen"
  | "king";

export type Board = (Piece | null)[][];

interface ChessboardProps {
  board: Board;
  curSelectedPos: Position | null;
  setCurSelectedPos: (pos: Position | null) => void;
}

export const Chessboard = ({
  board,
  curSelectedPos,
  setCurSelectedPos,
}: ChessboardProps): JSX.Element => {
  const rows = 8;
  const cols = 8;

  console.log("rendering chessboard");
  return (
    <vstack padding="medium" gap="none">
      {Array(rows)
        .fill(0)
        .map((_, rowIndex) => (
          <hstack key={`row-${rowIndex}`} gap="none">
            {Array(cols)
              .fill(0)
              .map((_, colIndex) => {
                const isLight = (rowIndex + colIndex) % 2 === 0;
                const piece = board[rowIndex][colIndex];

                return (
                  <vstack
                    key={`cell-${rowIndex}-${colIndex}`}
                    width="40px"
                    height="40px"
                    backgroundColor={isLight ? "#F0D9B5" : "#B58863"}
                    alignment="center middle"
                    onPress={
                      piece
                        ? () => setCurSelectedPos([rowIndex, colIndex])
                        : undefined
                    }
                  >
                    {piece &&
                      (curSelectedPos &&
                      rowIndex === curSelectedPos[0] &&
                      colIndex === curSelectedPos[1] ? (
                        <vstack
                          width="100%"
                          height="100%"
                          backgroundColor="#00FF00"
                          alignment="center middle"
                        >
                          <text size={"xxlarge"} weight="bold">
                            {CHESS_PIECE_ICONS[piece]}
                          </text>
                        </vstack>
                      ) : (
                        <text size={"xxlarge"} weight="bold">
                          {CHESS_PIECE_ICONS[piece]}
                        </text>
                      ))}
                    {curSelectedPos &&
                      getValidMoves(board, curSelectedPos).filter(
                        (validPos) =>
                          validPos[0] === rowIndex && validPos[1] === colIndex
                      ).length > 0 && (
                        <vstack
                          width="60%"
                          height="60%"
                          cornerRadius="full"
                          backgroundColor="#00FF00"
                          alignment="center middle"
                        />
                      )}
                  </vstack>
                );
              })}
          </hstack>
        ))}
    </vstack>
  );
};
