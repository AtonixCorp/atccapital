import React, { useState } from 'react';
import './WorkspaceModules.css';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const VIEWS = ['Month', 'Week', 'Day'];

const getCalendarDays = (year, month) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const WorkspaceCalendar = () => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [calView, setCalView] = useState('Month');

  const cells = getCalendarDays(year, month);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  return (
    <div className="wsm-page">
      <div className="wsm-page-header">
        <div>
          <h1 className="wsm-page-title">Calendar</h1>
          <p className="wsm-page-sub">Team calendar for events, tasks, and milestones.</p>
        </div>
        <button className="wsm-btn-primary">+ New Event</button>
      </div>

      <div className="wsm-cal-controls">
        <button className="wsm-btn-secondary" onClick={prevMonth}>←</button>
        <span className="wsm-cal-title">{MONTHS[month]} {year}</span>
        <button className="wsm-btn-secondary" onClick={nextMonth}>→</button>
        <div className="wsm-chips" style={{ marginLeft: 'auto' }}>
          {VIEWS.map(v => (
            <button key={v} className={`wsm-chip${calView === v ? ' active' : ''}`} onClick={() => setCalView(v)}>{v}</button>
          ))}
        </div>
      </div>

      <div className="wsm-section">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {DAYS.map(d => (
            <div key={d} style={{ textAlign: 'center', fontWeight: 700, fontSize: 11, color: '#9ca3af', padding: '6px 0', textTransform: 'uppercase' }}>{d}</div>
          ))}
          {cells.map((day, i) => (
            <div key={i} style={{
              minHeight: 72,
              background: day ? '#fff' : 'transparent',
              border: day ? '1px solid #e5e7eb' : 'none',
              borderRadius: 6,
              padding: '6px 8px',
              fontSize: 13,
              color: day === today.getDate() && month === today.getMonth() && year === today.getFullYear() ? '#2563eb' : '#0d1b2e',
              fontWeight: day === today.getDate() && month === today.getMonth() && year === today.getFullYear() ? 700 : 400,
              cursor: day ? 'pointer' : 'default',
            }}>
              {day || ''}
            </div>
          ))}
        </div>
      </div>

      <div className="wsm-permission-note">
        <strong>Permission rules:</strong> Members and above can create events. Viewers can only view the calendar.
      </div>
    </div>
  );
};

export default WorkspaceCalendar;
