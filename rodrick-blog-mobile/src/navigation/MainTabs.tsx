import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { House, FileText, Image, Settings } from 'lucide-react-native';
import { iconSize, iconStroke, useTheme } from '../theme';
import { HomeStack } from './HomeStack';
import { MainTabParamList } from './type';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ITEMS = {
  Home: { Icon: House, label: 'Trang chủ' },
  Documents: { Icon: FileText, label: 'Giấy tờ' },
  Photos: { Icon: Image, label: 'Ảnh' },
  Settings: { Icon: Settings, label: 'Cài đặt' },
} as const;

function FooterBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.bar, { backgroundColor: colors.background }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { Icon, label } = ITEMS[route.name as keyof typeof ITEMS];
        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
            onPress={() => !focused && navigation.navigate(route.name)}
            style={styles.item}
          >
            <View
              style={[
                styles.pill,
                focused && { backgroundColor: colors.surfaceMuted },
              ]}
            >
              <Icon
                size={iconSize.control}
                color={colors.text}
                strokeWidth={focused ? iconStroke.active : iconStroke.normal}
                strokeLinecap="round"
              />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// tabBar được gọi như hàm thường, nên phải bọc FooterBar thành element để hook chạy đúng chỗ.
const renderTabBar = (props: BottomTabBarProps) => <FooterBar {...props} />;

export function MainTabs() {
  return (
    <Tab.Navigator tabBar={renderTabBar} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeStack} />
      {/* <Tab.Screen name="Documents" component={DocumentsScreen} />
      <Tab.Screen name="Photos" component={PhotosScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} /> */}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', paddingVertical: 8 },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  pill: {
    width: 64,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
