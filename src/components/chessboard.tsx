import { Devvit } from "@devvit/public-api";

export const Chessboard = (): JSX.Element => {
  return (
    <vstack padding="medium">
      <hstack gap="small">
        <vstack gap="small">
          <hstack gap="small">
            <text>♜</text>
            <text>♞</text>
            <text>♝</text>
            <text>♛</text>
            <text>♚</text>
            <text>♝</text>
            <text>♞</text>
            <text>♜</text>
          </hstack>
        </vstack>
      </hstack>
    </vstack>
  );
};
