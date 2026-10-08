import { Drawer } from 'expo-router/drawer';

import { AppDrawerContent } from '@/navigation/app-drawer-content';
import { useTheme } from '@/ui';

export default function DrawerLayout() {
  const theme = useTheme();

  return (
    <Drawer
      drawerContent={(props) => (
        <AppDrawerContent navigation={props.navigation} />
      )}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        overlayColor:
          theme.name === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(15,23,42,0.28)',
        drawerStyle: {
          backgroundColor: theme.background.primary,
          width: 312,
        },
        swipeEdgeWidth: 40,
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          title: 'Arcloops CRM',
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer>
  );
}
