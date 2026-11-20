/* Mock cho module native: Jest chạy trên Node, không có native binary. */
jest.mock('react-native-keychain', () => ({
  getGenericPassword: jest.fn(async () => false),
  setGenericPassword: jest.fn(async () => true),
  resetGenericPassword: jest.fn(async () => true),
}));

jest.mock('react-native-nitro-share-intent', () => ({
  useShareIntent: jest.fn(),
  getInitialShare: jest.fn(async () => null),
  clearShareIntent: jest.fn(),
}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(async () => ({ didCancel: true })),
}));
