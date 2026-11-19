import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { Circle, Path } from 'react-native-svg';
import { House, FileText, Image, Settings } from 'lucide-react-native';
import { darkColors, iconSize, iconStroke, useTheme } from '../theme';
import { HomeStack } from './HomeStack';
import { MainTabParamList } from './type';

const Tab = createBottomTabNavigator<MainTabParamList>();

/** Thanh tab: nền đen hơi trong, icon sáng. */
const BAR_ALPHA = 0.6;
const BAR_BG = `rgba(0,0,0,${BAR_ALPHA})`;
const ICON_COLOR = darkColors.text;

/** Màu thật của thanh sau khi phủ đen lên nền màn (dùng để khoét chi tiết icon đặc). */
function barColorOver(hex: string): string {
  const h = hex.replace('#', '');
  const k = 1 - BAR_ALPHA;
  const [r, g, b] = [0, 2, 4].map(i =>
    Math.round(parseInt(h.slice(i, i + 2), 16) * k),
  );
  return `rgb(${r},${g},${b})`;
}

/**
 * Lucide chỉ có icon nét. Khi đang chọn: tô đặc cả icon (fill), rồi vẽ lại
 * chi tiết bên trong bằng màu thanh tab để icon vẫn đọc được.
 * Toạ độ lấy đúng từ dữ liệu icon Lucide (khung 24x24).
 */
const KNOCKOUT: Record<
  keyof MainTabParamList,
  (bg: string, w: number) => React.ReactNode
> = {
  Home: bg => (
    <Path
      key="door"
      d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8z"
      fill={bg}
      stroke="none"
    />
  ),
  Documents: (bg, w) => (
    <Path
      key="lines"
      d="M14 2v5a1 1 0 0 0 1 1h5M10 9H8M16 13H8M16 17H8"
      fill="none"
      stroke={bg}
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  Photos: (bg, w) => [
    <Circle key="sun" cx="9" cy="9" r="2" fill={bg} stroke="none" />,
    <Path
      key="hill"
      d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"
      fill="none"
      stroke={bg}
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
    />,
  ],
  Settings: bg => (
    <Circle key="hub" cx="12" cy="12" r="3" fill={bg} stroke="none" />
  ),
};

const ITEMS = {
  Home: { Icon: House, label: 'Trang chủ' },
  Documents: { Icon: FileText, label: 'Giấy tờ' },
  Photos: { Icon: Image, label: 'Ảnh' },
  Settings: { Icon: Settings, label: 'Cài đặt' },
} as const;

function FooterBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const knockoutColor = barColorOver(colors.background);

  return (
    <View style={styles.bar}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const name = route.name as keyof typeof ITEMS;
        const { Icon, label } = ITEMS[name];
        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
            onPress={() => !focused && navigation.navigate(route.name)}
            style={styles.item}
          >
            <Icon
              size={iconSize.control}
              color={ICON_COLOR}
              fill={focused ? ICON_COLOR : 'none'}
              strokeWidth={iconStroke.normal}
              strokeLinecap="round"
            >
              {focused
                ? KNOCKOUT[name](knockoutColor, iconStroke.normal)
                : null}
            </Icon>
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
      <Tab.Screen name="Documents" component={() => <></>} />
      <Tab.Screen name="Photos" component={() => <></>} />
      <Tab.Screen name="Settings" component={() => <></>} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', paddingVertical: 8, backgroundColor: BAR_BG },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
});
