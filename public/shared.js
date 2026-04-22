export function hasCompleteFirebaseConfig(config) {
  return Object.values(config).every((value) => {
    return typeof value === 'string' && value.trim() !== '' && !value.includes('YOUR_');
  });
}

export function buildConditionMatrix(factors) {
  return factors.reduce(
    (accumulator, factor) => {
      const next = [];

      accumulator.forEach((entry) => {
        factor.levels.forEach((level) => {
          const values = { ...entry.values, [factor.key]: level.id };
          const id = Object.entries(values)
            .map(([key, value]) => `${key}-${value}`)
            .join('__');

          next.push({
            id,
            label: Object.values(values).join(' / '),
            values,
          });
        });
      });

      return next;
    },
    [{ id: 'base', label: 'base', values: {} }],
  ).filter((entry) => Object.keys(entry.values).length > 0);
}

export function generateParticipantId(difficultyLevel) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);

  const code = Array.from(bytes, (value) => alphabet[value % alphabet.length]).join('');
  const normalizedDifficulty =
    typeof difficultyLevel === 'string' && difficultyLevel.trim()
      ? difficultyLevel.trim().toUpperCase()
      : 'participant';

  return `${normalizedDifficulty}-${code}`;
}

export function chooseRandomItem(items) {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return items[bytes[0] % items.length];
}

export function formatDateTime(timestamp) {
  if (!timestamp) {
    return '—';
  }

  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatDuration(milliseconds) {
  if (!milliseconds && milliseconds !== 0) {
    return '—';
  }

  if (milliseconds < 1000) {
    return `${milliseconds} ms`;
  }

  return `${(milliseconds / 1000).toFixed(1)} s`;
}

export function downloadFile(fileName, content, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  link.click();

  URL.revokeObjectURL(url);
}

export function toCsv(rows) {
  if (!rows.length) {
    return '';
  }

  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set()),
  );

  const escape = (value) => {
    if (value === null || value === undefined) {
      return '';
    }

    const normalized = String(value).replace(/"/g, '""');
    return /[",\n]/.test(normalized) ? `"${normalized}"` : normalized;
  };

  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(',')),
  ];

  return lines.join('\n');
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function normalizeFirestoreValue(value) {
  if (value && typeof value.toMillis === 'function') {
    return value.toMillis();
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeFirestoreValue(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, normalizeFirestoreValue(nested)]),
    );
  }

  return value;
}
