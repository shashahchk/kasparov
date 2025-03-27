import { Devvit } from "@devvit/public-api";
import { Chess, Piece as LibraryPiece } from "chess.js";
import { navigateToMove } from "../lib/game.js";

const CHESS_PIECE_ICONS = {
  "b-r": "♜",
  "b-b": "♝",
  "b-n": "♞",
  "b-p": "♙",
  "b-q": "♛",
  "b-k": "♚",
  "w-r": "♖",
  "w-b": "♗",
  "w-n": "♘",
  "w-p": "♙",
  "w-q": "♕",
  "w-k": "♔",
};

const CHESS_PIECE_URLS = {
  "b-rook": "https://i.redd.it/ktvw42mag5wd1.png",
  "b-bishop": "https://i.redd.it/kldf1a5ag5wd1.png",
  "b-queen": "https://i.redd.it/wa8mkrbag5wd1.png",
  "b-king": "https://i.redd.it/4usdcobag5wd1.png",
  "w-bishop": "https://i.redd.it/q3awlbnag5wd1.png",
};

export type Position = [number, number];

export type Piece =
  | "b-r"
  | "b-b"
  | "b-n" // n for knight (love chess.com)
  | "b-p"
  | "b-q"
  | "b-k"
  | "w-r"
  | "w-b"
  | "w-k"
  | "w-p"
  | "w-q"
  | "w-k";

export type PieceType = "r" | "b" | "k" | "p" | "q" | "k";

interface ChessboardProps {
  game: Chess;
  curSelectedPos: string | null;
  handleSelectPos: (pos: string | null) => void;
  handleMove: (pos: string | null) => void;
  validMoves: string[];
  currentMoveIndex: number;
  totalMoves: number;
  onNavigate: (moveIndex: number) => void;
  votedFromSquare: string | null;
  votedToSquare: string | null;
}

function convertIndicesToChessNotation([row, col]: Position): string {
  return `${String.fromCharCode(97 + col)}${8 - row}`;
}

export const stringifyPiece = (piece: LibraryPiece | null): Piece | null => {
  if (piece === null) return null;
  let result = `${piece.color === "w" ? "w" : "b"}-${piece.type}` as Piece;
  return result;
};

export const Chessboard = ({
  game,
  curSelectedPos,
  handleSelectPos,
  handleMove,
  validMoves,
  currentMoveIndex,
  totalMoves,
  onNavigate,
  votedFromSquare,
  votedToSquare,
}: ChessboardProps): JSX.Element => {
  const rows = 8;
  const cols = 8;

  let board =
    currentMoveIndex < totalMoves
      ? navigateToMove(game.pgn(), currentMoveIndex).board()
      : game.board();

  return (
    <vstack padding="medium" gap="medium" alignment="middle center">
      <vstack
        padding="xsmall"
        gap="none"
        alignment="middle center"
        cornerRadius="small"
        border="thin"
        borderColor="#555555"
      >
        {Array(rows)
          .fill(0)
          .map((_, rowIndex) => (
            <hstack key={`row-${rowIndex}`} gap="none">
              {Array(cols)
                .fill(0)
                .map((_, colIndex) => {
                  const isLight = (rowIndex + colIndex) % 2 === 0;
                  const piece = board[rowIndex][colIndex];
                  let pieceIndex = stringifyPiece(piece);
                  let pieceIsWhite = piece ? piece.color === "w" : false;

                  let squareInChessNotation = convertIndicesToChessNotation([
                    rowIndex,
                    colIndex,
                  ]);

                  // Check if this square is part of the voted move
                  const isVotedFromSquare =
                    votedFromSquare === squareInChessNotation;
                  const isVotedToSquare =
                    votedToSquare === squareInChessNotation;
                  const isVotedSquare = isVotedFromSquare || isVotedToSquare;

                  return (
                    <vstack
                      key={`cell-${rowIndex}-${colIndex}`}
                      width="42px"
                      height="42px"
                      backgroundColor={
                        isVotedSquare
                          ? isLight
                            ? "rgba(255, 153, 102, 0.5)"
                            : "rgba(204, 102, 0, 0.5)"
                          : isLight
                          ? "#E8D5AC"
                          : "#B58863"
                      }
                      alignment="center middle"
                      onPress={
                        piece
                          ? () => handleSelectPos(squareInChessNotation)
                          : undefined
                      }
                    >
                      {pieceIndex &&
                        (curSelectedPos &&
                        squareInChessNotation == curSelectedPos ? (
                          <vstack
                            width="100%"
                            height="100%"
                            backgroundColor="rgba(135, 206, 250, 0.4)"
                            alignment="center middle"
                          >
                            <text
                              size={"xlarge"}
                              color={pieceIsWhite ? "white" : "black"}
                              weight="bold"
                            >
                              {CHESS_PIECE_ICONS[pieceIndex]}
                            </text>
                          </vstack>
                        ) : (
                          <vstack
                            width="100%"
                            height="100%"
                            alignment="center middle"
                            backgroundColor={
                              isVotedSquare
                                ? isVotedFromSquare
                                  ? "rgba(255, 153, 102, 0.3)"
                                  : "rgba(255, 153, 102, 0.6)"
                                : "transparent"
                            }
                          >
                            <text
                              size={"xlarge"}
                              color={pieceIsWhite ? "white" : "black"}
                              weight="bold"
                            >
                              {CHESS_PIECE_ICONS[pieceIndex]}
                            </text>
                          </vstack>
                        ))}
                      {curSelectedPos &&
                        validMoves.filter(
                          (validPos) => validPos == squareInChessNotation
                        ).length > 0 && (
                          <vstack
                            width="60%"
                            height="60%"
                            cornerRadius="full"
                            backgroundColor="rgba(76, 175, 80, 0.5)"
                            alignment="center middle"
                            onPress={() => handleMove(squareInChessNotation)}
                          />
                        )}
                    </vstack>
                  );
                })}
            </hstack>
          ))}
      </vstack>

      <hstack
        gap="small"
        alignment="center middle"
        backgroundColor="#333334"
        padding="small"
        cornerRadius="medium"
        border="thin"
        borderColor="#444444"
      >
        <button
          onPress={() => onNavigate(0)}
          disabled={currentMoveIndex <= 0}
          appearance="bordered"
        >
          {"<<"}
        </button>
        <button
          onPress={() => onNavigate(currentMoveIndex - 1)}
          disabled={currentMoveIndex <= 0}
          appearance="bordered"
        >
          {"<"}
        </button>

        <text
          size="small"
          color="white"
        >{`Move ${currentMoveIndex} of ${totalMoves}`}</text>

        <button
          onPress={() => onNavigate(currentMoveIndex + 1)}
          disabled={currentMoveIndex >= totalMoves}
          appearance="bordered"
        >
          {">"}
        </button>
        <button
          onPress={() => onNavigate(totalMoves)}
          disabled={currentMoveIndex >= totalMoves}
          appearance="bordered"
        >
          {">>"}
        </button>
      </hstack>
    </vstack>
  );
};
