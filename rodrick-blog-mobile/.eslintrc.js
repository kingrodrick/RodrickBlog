module.exports = {
  root: true,
  extends: '@react-native',
  plugins: ['rodrick'],
  rules: {
    // Thông báo mặc định không chỉ cách sửa; dùng no-restricted-syntax bên dưới.
    '@typescript-eslint/no-explicit-any': 'off',
    'no-restricted-syntax': [
      'error',
      {
        selector: 'TSAnyKeyword',
        message:
          "Không dùng `any`. Lỗi bắt được: `catch (e)` rồi `e instanceof Error ? e.message : '...'` như src/shared/hooks/useAsync.ts. " +
          'Dữ liệu API: khai báo type trong types.ts của feature. Chưa rõ kiểu: dùng `unknown` rồi thu hẹp bằng type guard.',
      },
    ],
    'rodrick/feature-boundaries': 'error',
  },
  overrides: [
    {
      // Unit test được phép test phần nội bộ của feature.
      files: ['__tests__/**'],
      rules: { 'rodrick/feature-boundaries': 'off' },
    },
    {
      files: ['jest.setup.js'],
      env: { jest: true },
    },
  ],
};
