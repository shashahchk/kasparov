// Learn more at developers.reddit.com/docs
import { Context, Devvit, RedisClient, useState } from "@devvit/public-api";
import { Board, Chessboard, Position } from "./components/chessboard.js";
import { getMoveString, initBoard, Move } from "./lib/game.js";

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

function getKey(postId: string | undefined): string {
  return `kasparov_:${postId}`;
}

const App: Devvit.CustomPostComponent = ({ redis, reddit, postId }) => {
  // const [voteData, setVoteData] = useState(async () => {
  //   const state = await redis.get(getKey(postId));
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
    await redis.hIncrBy(getKey(postId), moveString, 1);
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
      <Chessboard
        board={board}
        curSelectedPos={curSelectedPos}
        handleSelectPos={setCurSelectedPos}
        handleMove={handleMove}
      />
      {/* <VoteSummary moves={mockMoves} currentBoard={board} /> */}
    </vstack>
  );
};

const UPDATE_BOARD_JOB = "updateBoard";
const DAILY_POST = "dailyPost";

Devvit.addSchedulerJob({
  name: DAILY_POST,
  onRun: async (event, context) => {
    const newBoard = initBoard();
    const postId = context.postId;
    const redis = context.redis;

    await redis.set(getKey(postId), JSON.stringify(newBoard));
  },
});

// TODO: Add api call
function getBoardAfterEngineTurn(board: Board): Board {
  return board;
}

async function getBoardForPost(
  postId: string,
  redis: RedisClient
): Promise<Board | undefined> {
  const board = await redis.get(getKey(postId));
  if (board) {
    return JSON.parse(board);
  } else {
    return undefined;
  }
}

Devvit.addSchedulerJob({
  name: UPDATE_BOARD_JOB,
  onRun: async (event, context) => {
    const { redis, postId } = context;

    if (!postId) {
      console.log("no post id");
      return;
    }

    const curBoard = await getBoardForPost(postId, context.redis);

    if (!curBoard) {
      console.log("no board found");
      return;
    }

    const newBoard = getBoardAfterEngineTurn(curBoard);

    await redis.set(getKey(postId), JSON.stringify(newBoard));
  },
});

Devvit.addTrigger({
  event: "AppInstall",
  onEvent: async (_, context) => {
    try {
      const jobId = await context.scheduler.runJob({
        cron: "0 12 * * *",
        name: DAILY_POST,
        data: {},
      });
      await context.redis.set("dailyPostJobId", jobId); // in case want to cancel
    } catch (e) {
      console.log("error was not able to schedule:", e);
      throw e;
    }
  },
});

Devvit.addTrigger({
  event: "PostCreate",
  onEvent: async (_, context) => {
    const userId = context.userId;
    if (userId !== "kasparov-app") {
      console.log("user is not kasparov. Actual user: ", userId);
      return;
    }

    try {
      const jobId = await context.scheduler.runJob({
        cron: "0 12 * * *",
        name: UPDATE_BOARD_JOB,
        data: {},
      });
      await context.redis.set("upateBoardJobId", jobId); // in case want to cancel
    } catch (e) {
      console.log("error was not able to schedule:", e);
      throw e;
    }
  },
});

// Add a post type definition
Devvit.addCustomPostType({
  name: "Experience Post",
  height: "regular",
  render: App,
});

export default Devvit;
