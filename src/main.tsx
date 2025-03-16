// Learn more at developers.reddit.com/docs
import { Devvit, useState } from "@devvit/public-api";
import { Board, Chessboard, Position } from "./components/chessboard.js";
import { getMoveString, initBoard, Move } from "./lib/game.js";
import { VoteSummary } from "./components/VoteSummary.js";

Devvit.configure({
  redis: true,
  redditAPI: true,
});

// Add a menu item to the subreddit menu for instantiating the new experience post
Devvit.addMenuItem({
  label: "Add my post",
  location: "subreddit",
  forUserType: "moderator",
  onPress: async (_event, context) => {
    const { reddit, ui } = context;
    ui.showToast(
      "Submitting your post - upon completion you'll navigate there."
    );

    const subreddit = await reddit.getCurrentSubreddit();
    const post = await reddit.submitPost({
      title: "My devvit post",
      subredditName: subreddit.name,
      // The preview appears while the post loads
      preview: (
        <vstack height="100%" width="100%" alignment="middle center">
          <text size="large">Loading ...</text>
        </vstack>
      ),
    });
    ui.navigateTo(post);
  },
});

const App: Devvit.CustomPostComponent = ({ redis, reddit, postId }) => {
  const key = (postId: string | undefined): string => {
    return `kasparov_:${postId}`;
  };
  // const [voteData, setVoteData] = useState(async () => {
  //   const state = await redis.get(key(postId));
  //   console.log("vote data: ", state);
  //   return null;
  // });

  const [board, setBoard] = useState<Board>(initBoard()); // TODO: load from cache and update board on a schedule
  const [curSelectedPos, setCurSelectedPos] = useState<Position | null>(null);
  const [move, setMove] = useState<string | null>(null);

  const handleMove = async (newPos: Position | null) => {
    if (curSelectedPos == null || newPos == null) return;

    const moveString = getMoveString({ from: curSelectedPos, to: newPos });

    setMove(moveString);
    await redis.hIncrBy(key(postId), moveString, 1);
    console.log("handled move successfully");
  };

  const mockMoves = {
    "a1-a2": 10,
    "a1-a3": 5,
    "b1-b2": 3,
    "b1-b3": 1,
    "c1-c2": 2,
    "c1-c3": 1,
    "d1-d2": 1,
    "d1-d3": 1,
    "e1-e2": 1,
    "e1-e3": 1,
    "f1-f2": 1,
    "f1-f3": 1,
    "g1-g2": 1,
    "g1-g3": 1,
    "h1-h2": 1,
  }; // TODO: Parse from loaded redis state

  return (
    <vstack height="100%" width="100%" gap="medium" alignment="center middle">
      {/* <Chessboard */}
      {/* //   board={board}
      //   curSelectedPos={curSelectedPos}
      //   handleSelectPos={setCurSelectedPos}
      //   handleMove={handleMove}
      // /> */}
      <VoteSummary moves={mockMoves} currentBoard={board} />
    </vstack>
  );
};

// Add a post type definition
Devvit.addCustomPostType({
  name: "Experience Post",
  height: "regular",
  render: App,
});

export default Devvit;
