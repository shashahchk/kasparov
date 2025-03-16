import { Devvit } from "@devvit/public-api";
import { Board } from "./chessboard.js";

export const VoteSummary = ({
  moves,
  currentBoard,
}: RedisVoteData): JSX.Element => {
  return (
    <vstack height="100%" width="100%" gap="small" alignment="center middle">
      <text size="large">Vote Summary</text>
      {Object.entries(moves).map(([move, count]) => (
        <hstack key={move} gap="small">
          <text>{move}</text>
          <text>{count}</text>
        </hstack>
      ))}
    </vstack>
  );
};

export type RedisVoteData = {
  moves: {
    [moveString: string]: number; // voted moves, moveString -> vote count
  };
  currentBoard: Board;
};
