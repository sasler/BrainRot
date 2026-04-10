import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getGame, getGames } from "@/lib/games";

function kvAvailable() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function getRedis() {
  if (!kvAvailable()) return null;
  const { Redis } = await import("@upstash/redis");
  return new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  });
}

export async function GET(request: NextRequest) {
  const redis = await getRedis();
  if (!redis) return NextResponse.json({ votes: {} });

  try {
    const cookieStore = await cookies();
    const voterCookie = cookieStore.get("brainrot_voter");
    if (!voterCookie) return NextResponse.json({ votes: {} });

    const voterId = voterCookie.value;
    const { searchParams } = request.nextUrl;
    const gameId = searchParams.get("gameId");

    const games = gameId
      ? [getGame(gameId)].filter(Boolean)
      : getGames();

    const keys: string[] = [];
    const keyMap: string[] = [];

    for (const game of games) {
      if (!game) continue;
      for (const version of game.versions) {
        const k = `vote:${voterId}:${game.id}:${version.modelId}`;
        keys.push(k);
        keyMap.push(`${game.id}:${version.modelId}`);
      }
    }

    if (keys.length === 0) return NextResponse.json({ votes: {} });

    const pipeline = redis.pipeline();
    for (const key of keys) {
      pipeline.get(key);
    }
    const results = await pipeline.exec();

    const votes: Record<string, number> = {};
    for (let i = 0; i < keys.length; i++) {
      const stars = results[i] as number | null;
      if (stars !== null) {
        votes[keyMap[i]] = stars;
      }
    }

    return NextResponse.json({ votes });
  } catch {
    return NextResponse.json({ votes: {} });
  }
}
