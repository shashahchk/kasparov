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

function getMoveKey(moveString: string): string {
  return `move:${moveString}`;
}

function isMoveKey(moveKey: string): boolean {
  return moveKey.slice(0, 5) === "move:";
}

function getMoveFromKey(moveKey: string): string {
  if (moveKey.slice(0, 5) !== "move:") {
    throw new Error("Invalid move key");
  }

  const moveString = moveKey.slice(5);
  return moveString;
}

function getBoardKey(): string {
  return "kasparov_board";
}

const getMoveTable = async (redis: RedisClient, postId: string | undefined) => {
  let moves = await redis.hGetAll(getKey(postId));
  // return map with values casted to integers
  return Object.fromEntries(
    Object.entries(moves)
      .filter(([key, value]) => isMoveKey(key))
      .map(([key, value]) => [getMoveFromKey(key), parseInt(value)])
  );
};

const getTopMove = async (
  redis: RedisClient,
  postId: string | undefined
): Promise<[string, string] | undefined> => {
  const moveTable = await getMoveTable(redis, postId);
  const sortedMoves = Object.entries(moveTable).sort((a, b) => b[1] - a[1]);
  let topMove = sortedMoves[0] ? sortedMoves[0][0] : null;

  if (topMove) {
    let [from, to] = topMove.split("-");

    return [from, to];
  }
};

const App: Devvit.CustomPostComponent = ({ redis, reddit, postId }) => {
  const [voteTable, setVoteTable] = useState<Record<string, number>>(async () =>
    getMoveTable(redis, postId)
  );

  const [game, setGame] = useState<PGN>(
    async () => await getBoardForPost(postId, redis)
  );
  const [curSelectedPos, setCurSelectedPos] = useState<string | null>(null);
  const [move, setMove] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);

  // Add state for tracking the last voted move and showing confirmation
  const [lastVotedMove, setLastVotedMove] = useState<string | null>(null);
  const [showVoteConfirmation, setShowVoteConfirmation] =
    useState<boolean>(false);

  // Add state to track the from and to positions of the last voted move
  const [votedFromSquare, setVotedFromSquare] = useState<string | null>(null);
  const [votedToSquare, setVotedToSquare] = useState<string | null>(null);

  const [timeLeft, setTimeLeft] = useState<number>(60); // 5 minutes in seconds
  const [moveIndex, setMoveIndex] = useState<number>(0);
  const [subredditName, setSubredditName] = useState<string>(
    async () => await reddit.getCurrentSubredditName()
  );

  // Fetch subreddit name
  const gameObject = new Chess();
  let isLoaded = gameObject.loadPgn(game);

  // Get move history to display in sidebar
  const moveHistory = gameObject.history({ verbose: true });

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
    await redis.hIncrBy(getKey(postId), getMoveKey(moveString), 1);
    setCurSelectedPos(null);
    setValidMoves([]);
    setVoteTable({
      ...voteTable,
      [moveString]: voteTable[moveString] ? voteTable[moveString] + 1 : 1,
    });

    // Set the last voted move and show confirmation
    setLastVotedMove(moveString);
    // Store the from and to positions for highlighting
    setVotedFromSquare(curSelectedPos);
    setVotedToSquare(newPos);
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

  // Move history sidebar component - improved design
  const MoveHistorySidebar = () => {
    return (
      <vstack
        backgroundColor="#252526"
        width="150px"
        height="100%"
        padding="none"
      >
        <vstack
          backgroundColor="#3C3C3D"
          padding="small"
          width="100%"
          alignment="middle center"
        >
          <text size="small" weight="bold" color="white" alignment="center">
            Move History
          </text>
        </vstack>

        <vstack gap="xsmall" padding="small" height="100%">
          {moveHistory.length === 0 ? (
            <text color="#A0A0A0" alignment="center" size="xsmall">
              No moves yet
            </text>
          ) : (
            moveHistory.map((move, index) => {
              const isBot = index % 2 === 1; // Odd moves are bot moves
              const moveNumber = Math.floor(index / 2) + 1;
              const moveNotation = `${move.from}-${move.to}`;

              return (
                <vstack
                  key={`move-${index}`}
                  backgroundColor={
                    index === moveIndex ? "rgba(255, 99, 71, 0.2)" : undefined
                  }
                  cornerRadius="small"
                  padding="small"
                  onPress={() => setMoveIndex(index)}
                >
                  <text size="xsmall" color={isBot ? "#FF9966" : "#88CCFF"}>
                    {moveNumber}. {isBot ? "Bot" : `r/${subredditName}`}
                  </text>
                  <text
                    size="xsmall"
                    color="white"
                    weight={index === moveIndex ? "bold" : "regular"}
                  >
                    {moveNotation}
                  </text>
                </vstack>
              );
            })
          )}
        </vstack>
      </vstack>
    );
  };

  // Right sidebar for timer and voting - enhanced design
  const VotingSidebar = () => {
    return (
      <vstack
        backgroundColor="#252526"
        width="180px"
        height="100%"
        padding="none"
      >
        <vstack
          backgroundColor="#3C3C3D"
          padding="small"
          width="100%"
          alignment="middle center"
        >
          <text size="small" weight="bold" color="white" alignment="center">
            Vote to Play
          </text>
        </vstack>

        <vstack padding="small" gap="medium" width="100%">
          {/* Timer */}
          <vstack
            backgroundColor={
              timeLeft < 60 ? "rgba(255, 99, 71, 0.15)" : "#333334"
            }
            cornerRadius="medium"
            padding="small"
            alignment="middle center"
            width="100%"
            border="thin"
            borderColor={timeLeft < 60 ? "rgba(255, 99, 71, 0.5)" : "#444444"}
          >
            <text size="small" color="#A0A0A0">
              Next Move In
            </text>
            <text
              size="large"
              weight="bold"
              color={timeLeft < 60 ? "#FF6347" : "white"}
            >
              {formatTime(timeLeft)}
            </text>
          </vstack>

          {/* Voting Section */}
          <vstack width="100%" gap="small">
            <text size="small" weight="bold" color="#88CCFF">
              Vote for the next move
            </text>

            {/* Vote confirmation message */}
            {showVoteConfirmation && lastVotedMove && (
              <vstack
                backgroundColor="rgba(50, 205, 50, 0.15)"
                cornerRadius="medium"
                padding="small"
                width="100%"
                alignment="middle center"
                gap="small"
                border="thin"
                borderColor="rgba(50, 205, 50, 0.5)"
              >
                <text color="#32CD32" weight="bold" size="small">
                  Vote submitted!
                </text>
                <text color="white" size="small">
                  {lastVotedMove}
                </text>
              </vstack>
            )}

            {/* Display your vote */}
            {lastVotedMove && !showVoteConfirmation && (
              <vstack
                backgroundColor="rgba(255, 99, 71, 0.15)"
                cornerRadius="small"
                padding="small"
                width="100%"
                gap="xsmall"
                border="thin"
                borderColor="rgba(255, 99, 71, 0.5)"
              >
                <text size="xsmall" color="#A0A0A0">
                  Your vote:
                </text>
                <text color="white" weight="bold" size="small">
                  {lastVotedMove}
                </text>
              </vstack>
            )}

            {/* Top Voted Moves */}
            <vstack gap="small" width="100%">
              <text weight="bold" color="#88CCFF" size="small">
                Top Voted Moves
              </text>

              <vstack gap="xsmall" width="100%">
                {Object.entries(voteTable)
                  .sort(([_, a], [__, b]) => b - a)
                  .slice(0, 5)
                  .map(([move, votes], index) => (
                    <hstack
                      key={move}
                      gap="xsmall"
                      backgroundColor={
                        index === 0 ? "rgba(255, 99, 71, 0.15)" : "#333334"
                      }
                      cornerRadius="small"
                      padding="small"
                      width="100%"
                      alignment="start center"
                      border="thin"
                      borderColor={
                        index === 0 ? "rgba(255, 99, 71, 0.5)" : "#444444"
                      }
                    >
                      <text color="white" size="small">
                        {move}
                      </text>
                      <spacer />
                      <text
                        color={index === 0 ? "#FF9966" : "#A0A0A0"}
                        weight={index === 0 ? "bold" : "regular"}
                        size="xsmall"
                      >
                        {votes}
                      </text>
                    </hstack>
                  ))}
              </vstack>
            </vstack>
          </vstack>
        </vstack>
      </vstack>
    );
  };

  return (
    <vstack width="100%" height="100%">
      {/* Title Bar - Fixed at top with improved styling */}
      <vstack
        backgroundColor="#1E1E1E"
        padding="small"
        width="100%"
        alignment="middle center"
        border="thin"
        borderColor="#444444"
      >
        <text size="large" weight="bold" color="#FF9966" alignment="center">
          ♚ Kasparov vs r/{subredditName} ♔
        </text>
        <text color="#88CCFF" alignment="center" size="small">
          Community chess where you vote on the next move!
        </text>
      </vstack>

      {/* Three-column layout: History | Chessboard | Voting */}
      <hstack width="100%" height="100%" gap="none">
        {/* Left Sidebar - Move History */}
        <MoveHistorySidebar />

        {/* Center - Chessboard */}
        <vstack grow alignment="middle center" backgroundColor="#2D2D30">
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
            onNavigate={setMoveIndex}
            votedFromSquare={votedFromSquare}
            votedToSquare={votedToSquare}
          />
        </vstack>

        {/* Right Sidebar - Timer and Voting */}
        <VotingSidebar />
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

function getBoardAfterEngineTurn(chess: Chess): Chess {
  let fen = chess.fen();
  let BOT_LEVEL = 3;
  let botMove = aiMove(fen, BOT_LEVEL);

  let from = Object.keys(botMove)[0];
  let to = botMove[from];
  console.log("Bot move: ", from, to);

  chess.move({ from: from.toLowerCase(), to: to.toLowerCase() });
  return chess;
}

async function getBoardForPost(
  postId: string | undefined,
  redis: RedisClient
): Promise<string> {
  const boardPGN = await redis.hGet(getKey(postId), getBoardKey());
  if (boardPGN) {
    return boardPGN;
  } else {
    return initBoard();
  }
}

Devvit.addSchedulerJob({
  name: UPDATE_BOARD_JOB,
  onRun: async (event, context) => {
    console.log("Board Job Running");
    console.log(context);
    console.log(event);
    const { redis } = context;
    const { postId } = event.data;
    if (!postId) {
      console.log("no post id");
      return;
    }

    const curBoard = await getBoardForPost(postId, context.redis);
    const topMove = await getTopMove(redis, postId);
    console.log("Top voted move: ", topMove);

    let chess = new Chess();
    console.log("Current board: ", curBoard);
    chess.loadPgn(curBoard);
    console.log("Loaded current board");

    if (topMove) {
      let [from, to] = topMove;
      console.log("Move generated by users: ", from, to);
      chess.move({ from: from, to: to });
    } else {
      console.log("No top move found, using random legal move");
      const legalMoves = chess.moves({ verbose: true });
      if (legalMoves.length > 0) {
        const randomMove =
          legalMoves[Math.floor(Math.random() * legalMoves.length)];
        chess.move(randomMove);
      } else {
        console.log("No legal moves available");
      }
    }

    const newBoard = getBoardAfterEngineTurn(chess);
    await redis.del(getKey(postId));
    await redis.hSet(getKey(postId), { [getBoardKey()]: newBoard.pgn() });
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
  onEvent: async (object, context) => {
    console.log("post created");
    const userId = context.userId;
    if (userId !== "kasparov-app") {
      console.log("user is not kasparov. Actual user: ", userId);
      // return;
    }

    try {
      console.log(object.post?.id);
      const jobId = await context.scheduler.runJob({
        cron: "* * * * *",
        name: UPDATE_BOARD_JOB,
        data: { postId: object.post?.id || "" },
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
