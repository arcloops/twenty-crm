import { CoreApiClient } from 'twenty-client-sdk/core';
import { defineLogicFunction } from 'twenty-sdk/define';

import { CLOSED_OPPORTUNITY_STAGE_VALUES } from 'src/constants/opportunity-stages';
import { postToTeams } from 'src/lib/teams';

const STALE_DEAL_DAYS = 14;

export type StaleDealAlertResult = {
  success: boolean;
  skipped?: boolean;
  staleCount?: number;
  error?: string;
};

type OpportunityNode = {
  id: string;
  name?: string | null;
  stage?: string | null;
  updatedAt?: string | null;
  company?: { name?: string | null } | null;
};

type OpportunityEdge = {
  node?: OpportunityNode | null;
};

type OpportunitiesQueryResult = {
  opportunities?: {
    edges?: OpportunityEdge[] | null;
  } | null;
};

const isClosedStage = (stage: string | null | undefined): boolean => {
  if (typeof stage !== 'string') {
    return false;
  }

  return CLOSED_OPPORTUNITY_STAGE_VALUES.has(stage);
};

const toOpportunityNodes = (
  result: OpportunitiesQueryResult,
): OpportunityNode[] =>
  (result.opportunities?.edges ?? [])
    .map((edge) => edge?.node)
    .filter(
      (node): node is OpportunityNode =>
        node !== null && node !== undefined,
    );

const handler = async (): Promise<StaleDealAlertResult> => {
  const webhookUrl = process.env.TEAMS_BD_WEBHOOK_URL?.trim() ?? '';

  if (webhookUrl.length === 0) {
    return {
      success: false,
      error:
        'TEAMS_BD_WEBHOOK_URL is not set. Add the Teams Incoming Webhook URL on the app (Settings → Applications) or the process environment.',
    };
  }

  const cutoff = new Date(Date.now() - STALE_DEAL_DAYS * 24 * 60 * 60 * 1000);
  const client = new CoreApiClient();

  let queryResult: OpportunitiesQueryResult;

  try {
    queryResult = (await client.query({
      opportunities: {
        __args: {
          first: 100,
        },
        edges: {
          node: {
            id: true,
            name: true,
            stage: true,
            updatedAt: true,
            company: {
              name: true,
            },
          },
        },
      },
    })) as OpportunitiesQueryResult;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unknown opportunity query error';

    return {
      success: false,
      error: message,
    };
  }

  const staleOpportunities = toOpportunityNodes(queryResult).filter(
    (opportunity) => {
      if (isClosedStage(opportunity.stage)) {
        return false;
      }

      if (typeof opportunity.updatedAt !== 'string') {
        return false;
      }

      return new Date(opportunity.updatedAt).getTime() < cutoff.getTime();
    },
  );

  if (staleOpportunities.length === 0) {
    return {
      success: true,
      skipped: true,
      staleCount: 0,
    };
  }

  const facts = Object.fromEntries(
    staleOpportunities.map((opportunity) => [
      opportunity.company?.name ?? 'No company',
      `${opportunity.name ?? opportunity.id} · ${
        opportunity.stage ?? 'unknown stage'
      }`,
    ]),
  );

  const teamsResult = await postToTeams(
    webhookUrl,
    `⚠️ ${staleOpportunities.length} stale deal(s) — no activity ${STALE_DEAL_DAYS}d+`,
    facts,
  );

  if (teamsResult.success !== true) {
    return {
      success: false,
      staleCount: staleOpportunities.length,
      error: teamsResult.error,
    };
  }

  return {
    success: true,
    staleCount: staleOpportunities.length,
  };
};

export default defineLogicFunction({
  universalIdentifier: '9e39408f-f08c-46c2-87ce-6a7b0343e479',
  name: 'staleDealAlert',
  description:
    'Weekday 09:00 cron that posts opportunities with no activity for 14+ days to the BD Teams webhook. Also exposed as POST /stale-deal-alert for n8n or manual exec.',
  timeoutSeconds: 30,
  handler,
  cronTriggerSettings: {
    pattern: '0 9 * * 1-5',
  },
  httpRouteTriggerSettings: {
    path: '/stale-deal-alert',
    httpMethod: 'POST',
    isAuthRequired: true,
  },
});
