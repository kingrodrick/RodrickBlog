import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Thông báo lỗi viết cho agent: nói vì sao sai và phải thay bằng gì.
const NO_ANY =
  "Không dùng `any`: nó tắt kiểm tra kiểu và agent sau sẽ chép theo. " +
  "Lỗi trong catch: viết `catch (err)` (kiểu unknown) rồi `getErrorMessage(err, 'thông báo mặc định')` từ '@/lib/errors'. " +
  "Giá trị union như trạng thái chuyến: dùng `TripStatus` + `isTripStatus()` từ '@/types/database.type'. " +
  "Dữ liệu chưa rõ kiểu: dùng `unknown` rồi thu hẹp bằng type guard.";

const NO_DASH =
  "Cấm em-dash (—) và en-dash (–) trong UI và dữ liệu (design lock của rodrick-blog). " +
  "Khoảng số/ngày dùng '-' (11-18/12, 18-135mm); ngăn cách dùng '•'. " +
  "Nếu cần nhận dạng en-dash trong dữ liệu cũ, viết escape \\u2013 trong regex thay vì ký tự thật.";

const SOURCE_FILES = ["{app,components,lib,services,types}/**/*.{ts,tsx}"];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),

  // R1 (any) + R3 (dash)
  {
    files: SOURCE_FILES,
    rules: {
      // Thông báo mặc định không chỉ cách sửa; dùng no-restricted-syntax bên dưới.
      "@typescript-eslint/no-explicit-any": "off",
      "no-restricted-syntax": [
        "error",
        { selector: "TSAnyKeyword", message: NO_ANY },
        { selector: "Literal[value=/[\\u2013\\u2014]/]", message: NO_DASH },
        { selector: "JSXText[value=/[\\u2013\\u2014]/]", message: NO_DASH },
        { selector: "TemplateElement[value.raw=/[\\u2013\\u2014]/]", message: NO_DASH },
      ],
    },
  },

  // R2: phân tầng app -> components -> services -> lib -> types
  {
    files: ["{app,components}/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              // Khớp cả '@/lib/supabase' lẫn đường dẫn tương đối.
              group: ["**/lib/supabase"],
              message:
                "UI/route không gọi Supabase trực tiếp. Thêm hàm vào services/itinerary.service.ts hoặc services/gallery.service.ts rồi gọi service; truy vấn và select cột nằm một chỗ.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["services/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/components/*", "@/app/*", "**/components/*", "**/app/*"],
              message:
                "Tầng dưới (services/lib/types) không import UI. Chuyển phần dùng chung xuống lib/ hoặc types/.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["{lib,types}/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/components/*", "@/app/*", "**/components/*", "**/app/*"],
              message:
                "Tầng dưới (services/lib/types) không import UI. Chuyển phần dùng chung xuống lib/ hoặc types/.",
            },
            {
              group: ["@/services/*", "**/services/*"],
              message:
                "lib/ và types/ không phụ thuộc services/ (tầng trên). Chuyển hàm thuần sang lib/.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
