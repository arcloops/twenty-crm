import { Drawer } from 'expo-router/drawer';

import { AppDrawerContent } from '@/navigation/app-drawer-content';
import { useTheme } from '@/ui';

export default function AppDrawerLayout() {
  const theme = useTheme();

  return (
    <Drawer
      drawerContent={(props) => (
        <AppDrawerContent navigation={props.navigation} />
      )}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        overlayColor: 'rgba(0,0,0,0.35)',
        drawerStyle: {
          backgroundColor: theme.background.primary,
          width: 304,
        },
      }}
    >
      <Drawer.Screen
        name="(tabs)"
        options={{
          title: 'Arcloops CRM',
          drawerLabel: 'Home',
        }}
      />
    </Drawer>
  );
}
