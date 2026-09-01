import { defineNavigationMenuItem } from 'twenty-sdk/define';
import { NavigationMenuItemType } from 'twenty-shared/types';

import { TRAINING_DELIVERIES_VIEW_UNIVERSAL_IDENTIFIER } from 'src/views/training-deliveries';

export default defineNavigationMenuItem({
  universalIdentifier: 'e21e4adb-c628-4c14-9444-3ef1200180c3',
  name: 'training-deliveries',
  icon: 'IconSchool',
  color: 'blue',
  position: 0,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: TRAINING_DELIVERIES_VIEW_UNIVERSAL_IDENTIFIER,
});
