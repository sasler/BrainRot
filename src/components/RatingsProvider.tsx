"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export interface RatingData {
  average: number;
  count: number;
}

interface RatingsContextValue {
  ratings: Record<string, RatingData>;
  userVotes: Record<string, number>;
  loading: boolean;
  submitRating: (
    gameId: string,
    modelId: string,
    stars: number,
  ) => Promise<void>;
}

const RatingsContext = createContext<RatingsContextValue>({
  ratings: {},
  userVotes: {},
  loading: true,
  submitRating: async () => {},
});

export function useRatings() {
  return useContext(RatingsContext);
}

export function useVersionRating(gameId: string, modelId: string) {
  const { ratings, userVotes, loading, submitRating } = useRatings();
  const key = `${gameId}:${modelId}`;
  return {
    rating: ratings[key] ?? null,
    userVote: userVotes[key] ?? null,
    loading,
    submit: (stars: number) => submitRating(gameId, modelId, stars),
  };
}

export function useBestRating(gameId: string, modelIds: string[]) {
  const { ratings } = useRatings();
  let best: (RatingData & { modelId: string }) | null = null;
  for (const modelId of modelIds) {
    const r = ratings[`${gameId}:${modelId}`];
    if (r && (!best || r.average > best.average)) {
      best = { ...r, modelId };
    }
  }
  return best;
}

interface RatingsProviderProps {
  children: ReactNode;
  gameId?: string;
}

export default function RatingsProvider({
  children,
  gameId,
}: RatingsProviderProps) {
  const [ratings, setRatings] = useState<Record<string, RatingData>>({});
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qs = gameId ? `?gameId=${gameId}` : "";
    Promise.all([
      fetch(`/api/ratings${qs}`)
        .then((r) => r.json())
        .catch(() => ({ ratings: {} })),
      fetch(`/api/ratings/user${qs}`)
        .then((r) => r.json())
        .catch(() => ({ votes: {} })),
    ]).then(([ratingsRes, votesRes]) => {
      setRatings(ratingsRes.ratings ?? {});
      setUserVotes(votesRes.votes ?? {});
      setLoading(false);
    });
  }, [gameId]);

  const submitRating = useCallback(
    async (gId: string, modelId: string, stars: number) => {
      const key = `${gId}:${modelId}`;

      // Snapshot previous state for rollback
      const prevVote = userVotes[key];
      const prevRating = ratings[key];

      // Optimistic update
      setUserVotes((prev) => ({ ...prev, [key]: stars }));
      setRatings((prev) => {
        const existing = prev[key];
        if (existing) {
          const oldTotal = existing.average * existing.count;
          const delta = stars - (prevVote ?? 0);
          const newCount = prevVote !== undefined ? existing.count : existing.count + 1;
          return {
            ...prev,
            [key]: {
              average: Math.round(((oldTotal + delta) / newCount) * 10) / 10,
              count: newCount,
            },
          };
        }
        return {
          ...prev,
          [key]: { average: stars, count: 1 },
        };
      });

      try {
        const res = await fetch("/api/ratings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId: gId, modelId, stars }),
        });
        if (res.ok) {
          const data = await res.json();
          setRatings((prev) => ({
            ...prev,
            [key]: data.rating,
          }));
        } else {
          // Revert optimistic update on server error
          setUserVotes((prev) => {
            const next = { ...prev };
            if (prevVote !== undefined) next[key] = prevVote;
            else delete next[key];
            return next;
          });
          if (prevRating) {
            setRatings((prev) => ({ ...prev, [key]: prevRating }));
          } else {
            setRatings((prev) => {
              const next = { ...prev };
              delete next[key];
              return next;
            });
          }
        }
      } catch {
        // Revert on network failure
        setUserVotes((prev) => {
          const next = { ...prev };
          if (prevVote !== undefined) next[key] = prevVote;
          else delete next[key];
          return next;
        });
        if (prevRating) {
          setRatings((prev) => ({ ...prev, [key]: prevRating }));
        } else {
          setRatings((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
        }
      }
    },
    [gameId, userVotes, ratings],
  );

  return (
    <RatingsContext value={{ ratings, userVotes, loading, submitRating }}>
      {children}
    </RatingsContext>
  );
}
