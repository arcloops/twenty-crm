# n8n workflow imports

Import each JSON in the n8n editor (**⋯ → Import from File**), then
activate. Paths are production-shaped (`https://n8n.arcloops.io/webhook/…`).
No live webhook hosts or API keys are stored in these files.

Twenty object names: **person** (contact), **opportunity** (deal).

Default Twenty stage **values**: `NEW`, `SCREENING`, `MEETING`, `PROPOSAL`,
`CUSTOMER`. Arcloops target values (after
[`docs/workspace-setup.md`](../../docs/workspace-setup.md)):
`WARM_CONTACT`, `MEETING_BOOKED`, `DISCOVERY`, `PROPOSAL_SENT`,
`NEGOTIATION`, `WON`, `LOST`.

Until you rename stages in Settings, set n8n env
`TWENTY_INBOUND_STAGE=NEW` and `TWENTY_WON_STAGE=CUSTOMER`. After rename,
use `WARM_CONTACT` / `WON` (see [`../env.example`](../env.example)).
Proposal Sent matching already accepts `PROPOSAL`, `PROPOSAL_SENT`, and
`Proposal Sent`.

## Twenty → n8n (register in Settings → Webhooks)

| File | Twenty operations | n8n path |
|---|---|---|
| [`twenty-contact-created.json`](./twenty-contact-created.json) | `person.created` | `/webhook/twenty-contact-created` |
| [`twenty-deal-updated.json`](./twenty-deal-updated.json) | `opportunity.updated` | `/webhook/twenty-deal-updated` |
| [`twenty-training-certified.json`](./twenty-training-certified.json) | `trainingDelivery.updated` | `/webhook/twenty-training-certified` |

```
https://n8n.arcloops.io/webhook/twenty-contact-created
https://n8n.arcloops.io/webhook/twenty-deal-updated
https://n8n.arcloops.io/webhook/twenty-training-certified
```

## External → n8n (register at the vendor)

| File | Vendor | n8n path |
|---|---|---|
| [`stripe-payment-succeeded.json`](./stripe-payment-succeeded.json) | Stripe `payment_intent.succeeded` | `/webhook/stripe-payment-succeeded` |
| [`cal-com-booking.json`](./cal-com-booking.json) | Cal.com `BOOKING_CREATED` | `/webhook/cal-com-booking` |
| [`tally-warm-contact.json`](./tally-warm-contact.json) | Tally form submission | `/webhook/tally` |

Put `opportunityId` on the Stripe PaymentIntent **metadata** so n8n can
mark the deal Won.

## Node graphs

```
twenty-contact-created
  Webhook → Normalize person → Brevo create/update contact (placeholder list)

twenty-deal-updated
  Webhook → Normalize opportunity → IF Proposal Sent → Teams Adaptive Card
            (TEAMS_BD_WEBHOOK_URL, title + FactSet)

stripe-payment-succeeded
  Webhook → Normalize Stripe → IF succeeded → Twenty GraphQL Won
                                → Teams Adaptive Card

cal-com-booking
  Webhook → Normalize booking → Find person by email → Create note
                                → Link note to person

tally-warm-contact
  Webhook → Map Tally fields → Create person → Create opportunity (Warm Contact)

twenty-training-certified
  Webhook → Normalize delivery → IF Certified → Cert portal POST /cohorts
                                  → Create note → Link note to record
```

## Teams Adaptive Card

Deal and Stripe workflows POST this shape to `$env.TEAMS_BD_WEBHOOK_URL`:

```json
{
  "type": "message",
  "attachments": [
    {
      "contentType": "application/vnd.microsoft.card.adaptive",
      "content": {
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "type": "AdaptiveCard",
        "version": "1.4",
        "body": [
          {
            "type": "TextBlock",
            "text": "🎯 Proposal Sent",
            "weight": "Bolder",
            "size": "Medium",
            "color": "Accent"
          },
          {
            "type": "FactSet",
            "facts": [
              { "title": "Deal", "value": "…" },
              { "title": "Company", "value": "…" },
              { "title": "Value", "value": "…" }
            ]
          }
        ]
      }
    }
  ]
}
```

## Twenty API used by workflows

Auth: `Authorization: Bearer $TWENTY_CRM_API_KEY`.

- GraphQL: `POST $TWENTY_CRM_API_URL/graphql` (Twenty `ApiPath.GraphQL`;
  not `/api/graphql`)
- REST: `POST $TWENTY_CRM_API_URL/rest/people`, `/rest/opportunities`,
  `/rest/notes`, `/rest/noteTargets`
