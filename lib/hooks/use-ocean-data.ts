"use client";

import { useEffect, useState } from "react";
import { oceanService } from "@/lib/api/ocean-service";
import type {
  OceanLocation,
  ProfileResponse,
  ReconstructionQuery,
  ReconstructionResponse,
} from "@/types/ocean";

export function useReconstruction(query: ReconstructionQuery) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data: ReconstructionResponse;
  } | null>(null);
  const [failure, setFailure] = useState<{
    key: string;
    message: string;
  } | null>(null);
  const { date, depth } = query;
  const key = `${date}:${depth}:${attempt}`;
  useEffect(() => {
    const controller = new AbortController();
    oceanService
      .getReconstruction({ date, depth }, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResult({ key, data });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setFailure({
            key,
            message:
              error instanceof Error
                ? error.message
                : "The ocean field could not be loaded.",
          });
      });
    return () => controller.abort();
  }, [date, depth, key]);
  const error = failure?.key === key ? failure.message : null;
  return {
    data: result?.data ?? null,
    loading: result?.key !== key && !error,
    error,
    retry: () => setAttempt((n) => n + 1),
  };
}

export function useProfile(location: OceanLocation, date: string) {
  const [result, setResult] = useState<{
    key: string;
    data: ProfileResponse;
  } | null>(null);
  const [failure, setFailure] = useState<{
    key: string;
    message: string;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const { lat, lon } = location;
  const key = `${date}:${lat}:${lon}:${attempt}`;
  useEffect(() => {
    const controller = new AbortController();
    oceanService
      .getProfile({ date, lat, lon }, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResult({ key, data });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setFailure({
            key,
            message:
              error instanceof Error
                ? error.message
                : "The profile could not be loaded.",
          });
      });
    return () => controller.abort();
  }, [date, lat, lon, key]);
  const error = failure?.key === key ? failure.message : null;
  return {
    data: result?.data ?? null,
    loading: result?.key !== key && !error,
    error,
    retry: () => setAttempt((n) => n + 1),
  };
}
