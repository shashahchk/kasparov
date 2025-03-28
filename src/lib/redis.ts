import { RedisClient } from "@devvit/public-api";

export async function getTime(
  redis: RedisClient,
  postId: string | undefined
): Promise<string | undefined> {
  const time = await redis.get(getTimeKey(postId));
  console.log(time);
  if (time) {
    return time;
  }
}
export function getTimeKey(postId: string | undefined): string {
  return `kasparov_time:${postId}`;
}

export function getKey(postId: string | undefined): string {
  return `kasparov_:${postId}`;
}

export function getMoveKey(moveString: string): string {
  return `move:${moveString}`;
}

export function isMoveKey(moveKey: string): boolean {
  return moveKey.slice(0, 5) === "move:";
}

export function getMoveFromKey(moveKey: string): string {
  if (moveKey.slice(0, 5) !== "move:") {
    throw new Error("Invalid move key");
  }

  const moveString = moveKey.slice(5);
  return moveString;
}

export function getBoardKey(): string {
  return "kasparov_board";
}

export const getMoveTable = async (
  redis: RedisClient,
  postId: string | undefined
) => {
  let moves = await redis.hGetAll(getKey(postId));
  // return map with values casted to integers
  return Object.fromEntries(
    Object.entries(moves)
      .filter(([key, value]) => isMoveKey(key))
      .map(([key, value]) => [getMoveFromKey(key), parseInt(value)])
  );
};

export const getTopMove = async (
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
