import { createNavigationContainerRef } from '@react-navigation/native';
import { MainTabParamList } from './type';

/** Điều hướng từ ngoài màn hình (ví dụ khi nhận liên kết từ nút Chia sẻ). */
export const navigationRef = createNavigationContainerRef<MainTabParamList>();
