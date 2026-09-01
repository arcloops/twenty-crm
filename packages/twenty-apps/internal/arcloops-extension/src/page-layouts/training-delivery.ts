import { definePageLayout, PageLayoutTabLayoutMode } from 'twenty-sdk/define';

import { TRAINING_DELIVERY_UNIVERSAL_IDENTIFIER } from 'src/objects/training-delivery';
import { TRAINING_DELIVERY_RECORD_PAGE_FIELDS_VIEW_UNIVERSAL_IDENTIFIER } from 'src/views/training-delivery-record-page-fields';

export default definePageLayout({
  universalIdentifier: '8c1d5e90-2b4a-4f73-9d16-e0a7c3b85219',
  name: 'Training Delivery Record Page',
  type: 'RECORD_PAGE',
  objectUniversalIdentifier: TRAINING_DELIVERY_UNIVERSAL_IDENTIFIER,
  tabs: [
    {
      universalIdentifier: '1f6a9c20-5d8e-4b47-8a31-c7e2d4f09653',
      title: 'Home',
      position: 10,
      icon: 'IconHome',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: 'b3e8d041-7c2f-4a95-91e6-4d8b0f27a1c5',
          title: 'Fields',
          type: 'FIELDS',
          configuration: {
            configurationType: 'FIELDS',
            viewUniversalIdentifier:
              TRAINING_DELIVERY_RECORD_PAGE_FIELDS_VIEW_UNIVERSAL_IDENTIFIER,
          },
        },
      ],
    },
    {
      universalIdentifier: '6d2b4e87-1a9c-4f50-8e73-d5c9a0b1842f',
      title: 'Timeline',
      position: 20,
      icon: 'IconTimelineEvent',
      layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
      widgets: [
        {
          universalIdentifier: '9e0c3f52-8b17-4d64-a2e9-7f1c5d8a3640',
          title: 'Timeline',
          type: 'TIMELINE',
          configuration: { configurationType: 'TIMELINE' },
        },
      ],
    },
  ],
});
