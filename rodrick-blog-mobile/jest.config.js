module.exports = {
  preset: '@react-native/jest-preset',
  // Preset chỉ biên dịch .js/.ts; lucide-react-native phát hành file .mjs.
  transform: { '^.+\\.mjs$': 'babel-jest' },
  setupFiles: ['./jest.setup.js'],
  // Các gói này phát hành dạng ESM, cần Babel biên dịch trước khi Jest chạy.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|lucide-react-native|react-native-.*)/)',
  ],
};
