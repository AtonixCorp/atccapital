import React, { useEffect, useState } from 'react';
import { subscribeToUiErrors } from '../utils/errorReporting';

const toneBySeverity = {
  error: {
    background: '#7f1d1d',
    border: '#fecaca',
    title: '#fee2e2',
    body: '#fecaca',
  },
  warning: {
    background: '#78350f',
    border: '#fde68a',
    title: '#fef3c7',
    body: '#fde68a',
  },
  info: {
    background: '#1e3a8a',
    border: '#bfdbfe',
    title: '#dbeafe',
    body: '#bfdbfe',
  },
};

const dedupeKey = (item) => [item.title, item.message, item.status, item.source].join('::');

export default function GlobalErrorCenter() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToUiErrors((incoming) => {
      setItems((current) => {
        const now = Date.now();
        const key = dedupeKey(incoming);
        const duplicate = current.find((item) => dedupeKey(item) === key && now - item.timestamp < 2500);
        if (duplicate) {
          return current;
        }

        const next = [incoming, ...current].slice(0, 4);
        return next;
      });
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!items.length) return undefined;

    const timers = items.map((item) => setTimeout(() => {
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    }, item.autoHideMs || 7000));

    return () => timers.forEach((timer) => clearTimeout(timer));
  }, [items]);

  if (!items.length) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 10000,
        display: 'grid',
        gap: 12,
        width: 'min(420px, calc(100vw - 32px))',
      }}
    >
      {items.map((item) => {
        const tone = toneBySeverity[item.severity] || toneBySeverity.error;
        return (
          <div
            key={item.id}
            style={{
              background: tone.background,
              border: `1px solid ${tone.border}`,
              borderRadius: 12,
              boxShadow: '0 12px 32px rgba(15, 23, 42, 0.35)',
              padding: '14px 16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: tone.title }}>{item.title}</div>
                <div style={{ fontSize: 12, color: tone.body, marginTop: 4, lineHeight: 1.45 }}>{item.message}</div>
                {item.source || item.status ? (
                  <div style={{ fontSize: 11, color: tone.body, opacity: 0.9, marginTop: 8 }}>
                    {[item.source, item.status ? `HTTP ${item.status}` : null].filter(Boolean).join(' • ')}
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: tone.title,
                  cursor: 'pointer',
                  fontSize: 18,
                  lineHeight: 1,
                  padding: 0,
                }}
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
