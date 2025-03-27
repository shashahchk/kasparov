// Learn more at developers.reddit.com/docs
import {
  Context,
  Devvit,
  RedisClient,
  useInterval,
  useState,
  useAsync,
} from "@devvit/public-api";
import { Board, Chessboard, Position } from "./components/chessboard.js";
import {
  PGN,
  getMoveString,
  initBoard,
  Move,
  getValidMoves,
} from "./lib/game.js";
import { Chess } from "chess.js";
import { Game, move, status, moves, aiMove, getFen } from "js-chess-engine";

// const gameClient = chess.create();

// let aiMove = game.aiMove();

// console.log(aiMove);

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
  const getMoveTable = async () => {
    let moves = await redis.hGetAll(getKey(postId));
    // return map with values casted to integers
    return Object.fromEntries(
      Object.entries(moves).map(([key, value]) => [key, parseInt(value)])
    );
  };

  const [voteTable, setVoteTable] = useState<Record<string, number>>(async () =>
    getMoveTable()
  );

  const [game, setGame] = useState<PGN>(initBoard());
  const [curSelectedPos, setCurSelectedPos] = useState<string | null>(null);
  const [move, setMove] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);

  // Add state for tracking the last voted move and showing confirmation
  const [lastVotedMove, setLastVotedMove] = useState<string | null>(null);
  const [showVoteConfirmation, setShowVoteConfirmation] =
    useState<boolean>(false);

  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes in seconds
  const [moveIndex, setMoveIndex] = useState<number>(15);

  const gameObject = new Chess();
  let isLoaded = gameObject.loadPgn(game);

  let timer =
    // Mock timer countdown
    useInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

  timer.start();

  const handleMove = async (newPos: string | null) => {
    if (curSelectedPos == null || newPos == null) return;
    const moveString = getMoveString({ from: curSelectedPos, to: newPos });
    setMove(moveString);
    await redis.hIncrBy(getKey(postId), moveString, 1);
    setCurSelectedPos(null);
    setValidMoves([]);
    setVoteTable({
      ...voteTable,
      [moveString]: voteTable[moveString] ? voteTable[moveString] + 1 : 1,
    });

    // Set the last voted move and show confirmation
    setLastVotedMove(moveString);
    setShowVoteConfirmation(true);

    // Hide confirmation after 3 seconds
    setTimeout(() => {
      setShowVoteConfirmation(false);
    }, 3000);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <vstack padding="medium" width="100%" height="100%">
      <text alignment="center middle">Kasparov vs Redditors</text>

      <hstack grow gap="medium" alignment="middle center">
        {/* Game Area - Using fixed widths for predictable layout */}
        <hstack alignment="middle center" gap="medium">
          <vstack padding="medium" grow alignment="middle center">
            <Chessboard
              game={gameObject}
              curSelectedPos={curSelectedPos}
              handleSelectPos={(pos) => {
                console.log(pos);
                setCurSelectedPos(pos);
                if (pos) {
                  setValidMoves(getValidMoves(gameObject, pos));
                } else {
                  setValidMoves([]);
                }
              }}
              handleMove={handleMove}
              validMoves={validMoves}
              currentMoveIndex={moveIndex}
              totalMoves={gameObject.history().length}
              onNavigate={(moveIndex) => {
                setMoveIndex(moveIndex);
              }}
            />
          </vstack>

          {/* Right Info Panel - Fixed width */}
          <vstack
            backgroundColor="#1A1A1B"
            cornerRadius="medium"
            padding="medium"
            width="200px"
            gap="small"
          >
            {/* Header */}
            <text size="small" color="#888888">
              Vote for the next move!
            </text>

            {/* Vote confirmation message - Integrated into side panel */}
            {showVoteConfirmation && (
              <vstack
                backgroundColor="rgba(0, 255, 0, 0.1)"
                cornerRadius="medium"
                padding="medium"
                width="100%"
                alignment="middle center"
                gap="small"
              >
                <text color="#00FF00" weight="bold">
                  Vote submitted!
                </text>
                <text color="white">{lastVotedMove}</text>
              </vstack>
            )}

            <text weight="bold" color="white">
              Top Voted Moves
            </text>

            {/* Display last voted move if exists and confirmation is not showing */}
            {lastVotedMove && !showVoteConfirmation && (
              <vstack
                backgroundColor="#FF45001A"
                cornerRadius="small"
                padding="small"
                width="100%"
                gap="small"
              >
                <text size="small" color="#888888">
                  Your vote:
                </text>
                <text color="white" weight="bold">
                  {lastVotedMove}
                </text>
              </vstack>
            )}

            {Object.entries(voteTable)
              .sort(([_, a], [__, b]) => b - a)
              .slice(0, 5)
              .map(([move, votes], index) => (
                <hstack
                  key={move}
                  gap="small"
                  backgroundColor={index === 0 ? "#FF45001A" : undefined}
                  cornerRadius="small"
                  padding="small"
                  width="100%"
                >
                  <text color="white">{move}</text>
                  <text color="#888888">{votes}</text>
                </hstack>
              ))}
            {/* Timer */}
            <hstack
              backgroundColor={timeLeft < 60 ? "#FF45001A" : "#1A1A1B"}
              cornerRadius="medium"
              padding="small"
              alignment="middle center"
              width="100%"
            >
              <text size="large" weight="bold" color="white">
                Next Move In: {formatTime(timeLeft)}
              </text>
            </hstack>
          </vstack>
        </hstack>
      </hstack>
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
  height: "tall",
  render: App,
});

export default Devvit;
