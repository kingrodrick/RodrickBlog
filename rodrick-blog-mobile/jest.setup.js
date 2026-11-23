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

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map();
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async key => (store.has(key) ? store.get(key) : null)),
      setItem: jest.fn(async (key, value) => {
        store.set(key, value);
      }),
      removeItem: jest.fn(async key => {
        store.delete(key);
      }),
    },
  };
});

jest.mock('@react-native-documents/picker', () => ({
  pick: jest.fn(async () => []),
  keepLocalCopy: jest.fn(async () => []),
  types: { pdf: 'application/pdf', images: 'image/*' },
  errorCodes: { OPERATION_CANCELED: 'OPERATION_CANCELED' },
  isErrorWithCode: jest.fn(() => false),
}));

jest.mock('@react-native-documents/viewer', () => ({
  viewDocument: jest.fn(async () => null),
}));

jest.mock('react-native-webview', () => ({
  WebView: 'WebView',
}));
