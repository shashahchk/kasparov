import { Devvit } from "@devvit/public-api";
import { Board } from "./chessboard.js";

export const VoteSummary = ({
  moves,
  currentBoard,
}: RedisVoteData): JSX.Element => {
  // Sort moves by vote count descending
  const sortedMoves = Object.entries(moves)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 5); // Show top 5 moves

  const maxVotes = Math.max(...Object.values(moves));

  return (
    <vstack 
      height="100%" 
      width="100%" 
      gap="medium" 
      padding="medium"
      backgroundColor="#FFFFFF0F"
      cornerRadius="large"
    >
      <hstack gap="small" alignment="middle center">
        <text size="xlarge" weight="bold">Top Moves</text>
        <text size="small" color="secondary">({Object.keys(moves).length} total)</text>
      </hstack>

      <vstack gap="small" width="100%">
        {sortedMoves.map(([move, count], index) => (
          <hstack 
            key={move} 
            gap="medium" 
            width="100%" 
            padding="small"
            backgroundColor={index === 0 ? "#FFD7000F" : undefined}
            cornerRadius="medium"
          >
            {/* Move rank and notation */}
            <hstack width="80px" alignment="start middle">
              <text size="small" color="secondary">#{index + 1}</text>
              <text weight="bold">{move}</text>
            </hstack>

            {/* Vote count and bar */}
            <hstack grow alignment="middle stretch" gap="small">
              <hstack 
                height="20px"
                backgroundColor="#FF4500"
                cornerRadius="small"
                width={`${(count / maxVotes) * 100}%`}
              />
              <text>{count} votes</text>
            </hstack>
          </hstack>
        ))}
      </vstack>

      {Object.keys(moves).length === 0 && (
        <vstack alignment="middle center" padding="large">
          <text color="secondary">No votes yet</text>
          <text size="small" color="secondary">Be the first to suggest a move!</text>
        </vstack>
      )}
    </vstack>
  );
};

export type RedisVoteData = {
  moves: {
    [moveString: string]: number; // voted moves, moveString -> vote count
  };
  currentBoard: Board;
};