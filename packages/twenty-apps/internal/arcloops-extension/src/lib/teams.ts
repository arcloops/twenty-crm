export type PostToTeamsResult = {
  success: boolean;
  error?: string;
  status?: number;
};

type AdaptiveCardFact = {
  title: string;
  value: string;
};

type TeamsAdaptiveCardPayload = {
  type: 'message';
  attachments: Array<{
    contentType: 'application/vnd.microsoft.card.adaptive';
    content: {
      $schema: string;
      type: 'AdaptiveCard';
      version: string;
      body: Array<
        | { type: 'TextBlock'; text: string; weight: 'Bolder'; size: 'Medium' }
        | { type: 'FactSet'; facts: AdaptiveCardFact[] }
      >;
    };
  }>;
};

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export const postToTeams = async (
  webhookUrl: string,
  title: string,
  facts: Record<string, string>,
): Promise<PostToTeamsResult> => {
  if (!isNonEmptyString(webhookUrl)) {
    return {
      success: false,
      error:
        'TEAMS_BD_WEBHOOK_URL is not set. Add the Teams Incoming Webhook URL on the app (Settings → Applications) or the process environment.',
    };
  }

  const payload: TeamsAdaptiveCardPayload = {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            {
              type: 'TextBlock',
              text: title,
              weight: 'Bolder',
              size: 'Medium',
            },
            {
              type: 'FactSet',
              facts: Object.entries(facts).map(([factTitle, value]) => ({
                title: factTitle,
                value,
              })),
            },
          ],
        },
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: `Teams webhook returned HTTP ${response.status}`,
      };
    }

    return { success: true, status: response.status };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown Teams webhook error';

    return {
      success: false,
      error: message,
    };
  }
};
