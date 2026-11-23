/** Tên phần tử JSX dạng đơn giản (`View`, `Text`), hoặc null. */
function elementName(element) {
  const name = element.openingElement.name;
  return name.type === 'JSXIdentifier' ? name.name : null;
}

function findAttribute(element, attrName) {
  return element.openingElement.attributes.find(
    a => a.type === 'JSXAttribute' && a.name.name === attrName,
  );
}

function hasSpread(element) {
  return element.openingElement.attributes.some(a => a.type === 'JSXSpreadAttribute');
}

/** Gom các `const x = StyleSheet.create({...})` cấp module: { x: { key: ObjectExpression } }. */
function collectStyleSheets(program) {
  const sheets = {};
  for (const statement of program.body) {
    const declaration =
      statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
    if (!declaration || declaration.type !== 'VariableDeclaration') {
      continue;
    }
    for (const { id, init } of declaration.declarations) {
      const isCreate =
        init &&
        init.type === 'CallExpression' &&
        init.callee.type === 'MemberExpression' &&
        init.callee.object.name === 'StyleSheet' &&
        init.callee.property.name === 'create' &&
        init.arguments[0] &&
        init.arguments[0].type === 'ObjectExpression';
      if (!isCreate || id.type !== 'Identifier') {
        continue;
      }
      const entries = {};
      for (const prop of init.arguments[0].properties) {
        if (prop.type === 'Property' && !prop.computed && prop.value.type === 'ObjectExpression') {
          entries[prop.key.name ?? prop.key.value] = prop.value;
        }
      }
      sheets[id.name] = entries;
    }
  }
  return sheets;
}

/**
 * Đọc các thuộc tính style tĩnh của biểu thức, gộp mọi nhánh điều kiện.
 * `dynamic: true` nghĩa là có phần không đọc được lúc lint.
 */
function readStyle(expr, sheets, out = { props: new Map(), dynamic: false }) {
  if (!expr) {
    return out;
  }
  switch (expr.type) {
    case 'ObjectExpression':
      for (const prop of expr.properties) {
        if (prop.type === 'Property' && !prop.computed) {
          out.props.set(prop.key.name ?? prop.key.value, prop.value);
        } else {
          out.dynamic = true;
        }
      }
      break;
    case 'MemberExpression': {
      const sheet = expr.object.type === 'Identifier' ? sheets[expr.object.name] : undefined;
      const entry = sheet && !expr.computed ? sheet[expr.property.name] : undefined;
      if (entry) {
        readStyle(entry, sheets, out);
      } else {
        out.dynamic = true;
      }
      break;
    }
    case 'ArrayExpression':
      expr.elements.forEach(el => readStyle(el, sheets, out));
      break;
    case 'LogicalExpression':
      if (expr.operator !== '&&') {
        readStyle(expr.left, sheets, out);
      }
      readStyle(expr.right, sheets, out);
      break;
    case 'ConditionalExpression':
      readStyle(expr.consequent, sheets, out);
      readStyle(expr.alternate, sheets, out);
      break;
    case 'Literal':
      // `null`/`false` trong mảng style không thêm thuộc tính nào.
      break;
    default:
      out.dynamic = true;
  }
  return out;
}

function styleOf(element, sheets) {
  const attr = findAttribute(element, 'style');
  if (!attr || !attr.value || attr.value.type !== 'JSXExpressionContainer') {
    return { props: new Map(), dynamic: false };
  }
  return readStyle(attr.value.expression, sheets);
}

const literalIs = (node, value) => !!node && node.type === 'Literal' && node.value === value;

/** flex/flexShrink có mặt và không phải số 0. */
function canShrink(props) {
  return ['flex', 'flexShrink'].some(key => props.has(key) && !literalIs(props.get(key), 0));
}

function firstChildElement(element) {
  const child = element.children.find(
    c => !(c.type === 'JSXText' && c.value.trim() === ''),
  );
  return child && child.type === 'JSXElement' ? child : null;
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Text đầu tiên trong hàng space-between phải có numberOfLines và flex/flexShrink để Android không cắt mất chữ',
    },
    schema: [],
    messages: {
      unsafeRowText:
        'Text này có thể mất từ cuối trên Android: với font hệ thống tuỳ chỉnh (Samsung), máy đo thiếu chiều rộng, từ cuối rơi xuống dòng 2 rồi bị khung một dòng cắt đi. ' +
        'Thiếu {{missing}}. Sửa: `<Text numberOfLines={1} style={styles.flex}>` với `flex: { flex: 1 }` (hoặc `flexShrink: 1` nếu cần ôm nội dung); phần tử bên cạnh giữ nguyên.',
    },
  },
  create(context) {
    let sheets = {};
    return {
      Program(node) {
        sheets = collectStyleSheets(node);
      },
      JSXElement(node) {
        if (elementName(node) !== 'View') {
          return;
        }
        const { props } = styleOf(node, sheets);
        if (
          !literalIs(props.get('flexDirection'), 'row') ||
          !literalIs(props.get('justifyContent'), 'space-between')
        ) {
          return;
        }
        const text = firstChildElement(node);
        if (!text || elementName(text) !== 'Text' || hasSpread(text)) {
          return;
        }
        const textStyle = styleOf(text, sheets);
        const missing = [];
        if (!findAttribute(text, 'numberOfLines')) {
          missing.push('numberOfLines');
        }
        if (!canShrink(textStyle.props) && !textStyle.dynamic) {
          missing.push('flex/flexShrink');
        }
        if (missing.length) {
          context.report({
            node: text.openingElement,
            messageId: 'unsafeRowText',
            data: { missing: missing.join(' và ') },
          });
        }
      },
    };
  },
};
