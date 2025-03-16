import { Devvit } from "@devvit/public-api";

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

export type Board = (Piece | null)[][];

export const Chessboard = ({ board }: { board: Board }): JSX.Element => {
  const rows = 8;
  const cols = 8;

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
                console.log("piece: ", piece);

                return (
                  <vstack
                    key={`cell-${rowIndex}-${colIndex}`}
                    width="40px"
                    height="40px"
                    backgroundColor={isLight ? "#F0D9B5" : "#B58863"}
                    alignment="center middle"
                  >
                    {piece && (
                      <text size={"xxlarge"} weight="bold">
                        {CHESS_PIECE_ICONS[piece]}
                      </text>
                    )}
                  </vstack>
                );
              })}
          </hstack>
        ))}
    </vstack>
  );
};
