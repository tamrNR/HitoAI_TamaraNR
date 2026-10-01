const crypto = require('crypto');

function stableStringify(value) {
  const seen = new WeakSet();

  const stringify = (val) => {
    if (val === null || typeof val === 'number' || typeof val === 'boolean') {
      return JSON.stringify(val);
    }
    if (typeof val === 'string') {
      return JSON.stringify(val);
    }
    if (typeof val === 'undefined') {
      return '"__undefined__"';
    }
    if (typeof val === 'function') {
      return '"__function__"';
    }
    if (val instanceof Date) {
      return JSON.stringify(val.toISOString());
    }
    if (Array.isArray(val)) {
      const arr = val.map((item) => stringify(item));
      return `[${arr.join(',')}]`;
    }
    if (typeof val === 'object') {
      if (seen.has(val)) return '"__circular__"';
      seen.add(val);
      const keys = Object.keys(val).sort();
      const parts = keys.map((k) => `${JSON.stringify(k)}:${stringify(val[k])}`);
      return `{${parts.join(',')}}`;
    }
    return JSON.stringify(val);
  };

  return stringify(value);
}

function sha256(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

function buildFiltrosHash({ tipoGrafico, context, chart, promptVersion }) {
  const payload = { tipoGrafico, context, chart, promptVersion };
  return sha256(stableStringify(payload));
}

module.exports = { stableStringify, sha256, buildFiltrosHash };
