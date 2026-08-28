'use client';

import { useEffect } from 'react';
import { buildChallengeWebMcpTools } from '@/lib/webmcp/challenge-tools';
import type { ChallengeStage } from '@/lib/webmcp-challenge/types';
import type { WebMcpDocument } from '@/lib/webmcp/types';
import type { WebMcpRegistrationStatus } from '@/lib/webmcp/types';

export function ChallengeTools({
  stage,
  onStatusChange,
}: {
  stage: ChallengeStage;
  onStatusChange?: (status: WebMcpRegistrationStatus, toolCount: number) => void;
}) {
  useEffect(() => {
    const modelContext = (document as WebMcpDocument).modelContext;
    if (!modelContext?.registerTool) {
      onStatusChange?.('unsupported', 0);
      return;
    }

    const controller = new AbortController();
    const tools = buildChallengeWebMcpTools(stage);
    onStatusChange?.('registering', tools.length);
    void Promise.all(
      tools.map((tool) => modelContext.registerTool(tool, { signal: controller.signal })),
    ).then(() => {
      if (!controller.signal.aborted) onStatusChange?.('ready', tools.length);
    }).catch((error) => {
      if (!controller.signal.aborted) {
        onStatusChange?.('error', 0);
        console.warn('[WebMCP Challenge] Tool registration failed', error);
      }
    });

    return () => controller.abort();
  }, [onStatusChange, stage]);

  return null;
}
