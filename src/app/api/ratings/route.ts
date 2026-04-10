import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getGame, getGames } from "@/lib/games";

function kvAvailable() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function getKV() {
  if (!kvAvailable()) return null;
  const { kv } = await import("@vercel/kv");
  return kv;
}

async function getOrCreateVoterId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get("brainrot_voter");
  if (existing) return existing.value;

  const id = crypto.randomUUID();
  cookieStore.set("brainrot_voter", id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return id;
}

export async function GET(request: NextRequest) {
  const redis = await getKV();
  if (!redis) return NextResponse.json({ ratings: {} });

  try {
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
        const k = `rating:${game.id}:${version.modelId}`;
        keys.push(k);
        keyMap.push(`${game.id}:${version.modelId}`);
      }
    }

    if (keys.length === 0) return NextResponse.json({ ratings: {} });

    const pipeline = redis.pipeline();
    for (const key of keys) {
      pipeline.hgetall(key);
    }
    const results = await pipeline.exec();

    const ratings: Record<string, { average: number; count: number }> = {};
    for (let i = 0; i < keys.length; i++) {
      const data = results[i] as {
        totalStars?: number;
        voteCount?: number;
      } | null;
      if (data && data.voteCount && data.voteCount > 0) {
        ratings[keyMap[i]] = {
          average:
            Math.round((data.totalStars! / data.voteCount) * 10) / 10,
          count: data.voteCount,
        };
      }
    }

    return NextResponse.json({ ratings });
  } catch {
    return NextResponse.json({ ratings: {} });
  }
}

export async function POST(request: NextRequest) {
  const redis = await getKV();
  if (!redis) {
    return NextResponse.json(
      { error: "Ratings not configured" },
      { status: 503 },
    );
  }

  try {
    const body = await request.json();
    const { gameId, modelId, stars } = body;

    if (!gameId || !modelId || stars === undefined) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return NextResponse.json(
        { error: "Stars must be integer 1-5" },
        { status: 400 },
      );
    }

    const game = getGame(gameId);
    if (!game || !game.versions.find((v) => v.modelId === modelId)) {
      return NextResponse.json(
        { error: "Invalid game or model" },
        { status: 400 },
      );
    }

    const voterId = await getOrCreateVoterId();
    const voteKey = `vote:${voterId}:${gameId}:${modelId}`;
    const ratingKey = `rating:${gameId}:${modelId}`;

    const existingStars = await redis.get<number>(voteKey);

    if (existingStars !== null) {
      const delta = stars - existingStars;
      if (delta !== 0) {
        await redis.hincrby(ratingKey, "totalStars", delta);
      }
      await redis.set(voteKey, stars);
    } else {
      await redis.hincrby(ratingKey, "totalStars", stars);
      await redis.hincrby(ratingKey, "voteCount", 1);
      await redis.set(voteKey, stars);
    }

    const data = await redis.hgetall<{
      totalStars: number;
      voteCount: number;
    }>(ratingKey);
    const average =
      data && data.voteCount > 0
        ? Math.round((data.totalStars / data.voteCount) * 10) / 10
        : 0;

    return NextResponse.json({
      rating: { average, count: data?.voteCount ?? 0 },
      userVote: stars,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit rating" },
      { status: 500 },
    );
  }
}
