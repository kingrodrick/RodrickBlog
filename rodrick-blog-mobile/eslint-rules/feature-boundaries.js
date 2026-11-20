const path = require('path');

const FEATURES_ROOT = path.resolve(__dirname, '..', 'src', 'features');

/** Tên feature chứa `absPath`, hoặc null nếu nằm ngoài src/features. */
function featureOf(absPath) {
  const rel = path.relative(FEATURES_ROOT, absPath);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    return null;
  }
  return rel.split(path.sep)[0];
}

/** Đích là chính thư mục feature hoặc index của nó (public API). */
function isPublicEntry(absTarget, feature) {
  const rel = path.relative(path.join(FEATURES_ROOT, feature), absTarget);
  return rel === '' || /^index(\.tsx?)?$/.test(rel);
}

function toImportPath(fromDir, absTarget) {
  let p = path.relative(fromDir, absTarget).split(path.sep).join('/');
  return p.startsWith('.') ? p : `./${p}`;
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Feature không import chéo nhau; bên ngoài chỉ import feature qua index.ts',
    },
    schema: [],
    messages: {
      crossFeature:
        "Feature '{{from}}' không được import từ feature '{{to}}' ({{source}}). " +
        'Mỗi feature tự chứa; code dùng chung từ 2 feature trở lên chuyển xuống src/shared/ (ui, hooks, utils, api). ' +
        'Dữ liệu giữa màn hình truyền qua navigation params (src/navigation/type.ts).',
      deepImport:
        "Chỉ import feature '{{to}}' qua public API: '{{suggest}}' (src/features/{{to}}/index.ts). " +
        "Thứ cần dùng chưa được export thì thêm `export ... from './...'` vào index.ts, không import sâu ({{source}}).",
    },
  },
  create(context) {
    const filename = context.getFilename();
    if (!path.isAbsolute(filename)) {
      return {};
    }
    const fromDir = path.dirname(filename);
    const fromFeature = featureOf(filename);

    function check(node) {
      const source = node.source && node.source.value;
      if (typeof source !== 'string' || !source.startsWith('.')) {
        return;
      }
      const absTarget = path.resolve(fromDir, source);
      const toFeature = featureOf(absTarget);
      if (!toFeature || toFeature === fromFeature) {
        return;
      }
      if (fromFeature) {
        context.report({
          node: node.source,
          messageId: 'crossFeature',
          data: { from: fromFeature, to: toFeature, source },
        });
        return;
      }
      if (!isPublicEntry(absTarget, toFeature)) {
        context.report({
          node: node.source,
          messageId: 'deepImport',
          data: {
            to: toFeature,
            source,
            suggest: toImportPath(fromDir, path.join(FEATURES_ROOT, toFeature)),
          },
        });
      }
    }

    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
      ImportExpression: check,
    };
  },
};
