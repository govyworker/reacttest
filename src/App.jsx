import { Link, Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import { useMemo, useState } from 'react';

const events = [
  { id: 'annual-tech-conference-2026', title: 'Annual Tech Conference 2026', date: 'March 15, 2026', time: '9:00 AM - 5:00 PM', location: 'Grand Convention Center, Hall A', status: 'upcoming', checkedIn: 0, totalGuests: 342 },
  { id: 'product-launch-webinar', title: 'Product Launch Webinar', date: 'February 28, 2026', time: '2:00 PM - 3:30 PM', location: 'Virtual (Zoom)', status: 'live', checkedIn: 147, totalGuests: 189 },
  { id: 'team-building-workshop', title: 'Team Building Workshop', date: 'March 5, 2026', time: '10:00 AM - 4:00 PM', location: 'Riverside Park Pavilion', status: 'upcoming', checkedIn: 0, totalGuests: 56 },
  { id: 'q1-all-hands-meeting', title: 'Q1 All-Hands Meeting', date: 'February 20, 2026', time: '11:00 AM - 12:00 PM', location: 'Main Office, Floor 3', status: 'closed', checkedIn: 198, totalGuests: 210 },
  { id: 'design-sprint-kickoff', title: 'Design Sprint Kickoff', date: 'March 10, 2026', time: '9:00 AM - 12:00 PM', location: 'Innovation Lab, Room 204', status: 'upcoming', checkedIn: 0, totalGuests: 24 },
  { id: 'customer-appreciation-gala', title: 'Customer Appreciation Gala', date: 'February 14, 2026', time: '6:00 PM - 10:00 PM', location: 'The Grand Ballroom', status: 'closed', checkedIn: 431, totalGuests: 475 }
];

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/events" replace />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/new" element={<SimplePage title="Create Event" text="Set up a new event, attendee capacity, and QR check-in policy for your internal DND group." />} />
      <Route path="/events/:id" element={<SimplePage title="Manage Event" text="Review attendance data, update details, and monitor check-ins in one place." />} />
      <Route path="/public-view" element={<SimplePage title="Public View" text="Internal event discovery feed for teammates to see upcoming sessions and RSVP." />} />
      <Route path="/check-in" element={<CheckInPage />} />
    </Routes>
  );
}

function Header() {
  const { pathname } = useLocation();
  return (
    <header className="topbar">
      <div className="brand"><div className="brand-icon">⌘</div><span>EventHub</span></div>
      <nav className="nav-links">
        <Link to="/public-view" className={`nav-link ${pathname === '/public-view' ? 'active' : ''}`}>🌐 Public View</Link>
        <Link to="/events" className={`nav-link ${pathname.startsWith('/events') ? 'active' : ''}`}>📅 Events</Link>
        <Link to="/check-in" className={`nav-link ${pathname === '/check-in' ? 'active' : ''}`}>▦ Check-In</Link>
      </nav>
      <Link to="/public-view" className="user-btn" aria-label="User Profile">👤</Link>
    </header>
  );
}

function EventsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const visibleEvents = useMemo(() => events.filter((event) => {
    const q = search.toLowerCase().trim();
    const matchesText = event.title.toLowerCase().includes(q) || event.location.toLowerCase().includes(q);
    const matchesStatus = status === 'all' || event.status === status;
    return matchesText && matchesStatus;
  }), [search, status]);

  return (
    <div className="page-wrap">
      <Header />
      <main className="content">
        <div className="content-header">
          <div>
            <h1>Events</h1>
            <p>Manage your events and track check-ins</p>
          </div>
          <Link to="/events/new" className="primary-btn">+ Create Event</Link>
        </div>

        <div className="controls-row">
          <div className="search-box">
            <span>🔍</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events..." />
          </div>
          <div className="status-filters">
            {['all', 'upcoming', 'live', 'closed'].map((s) => (
              <button key={s} className={`filter-btn ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>{s[0].toUpperCase() + s.slice(1)}</button>
            ))}
          </div>
        </div>

        <p className="results-count">Showing {visibleEvents.length} event{visibleEvents.length === 1 ? '' : 's'}</p>

        <section className="cards-grid">
          {visibleEvents.map((event) => (
            <article key={event.id} className="event-card">
              <div className="card-header"><h2>{event.title}</h2><span className={`status ${event.status}`}>{event.status[0].toUpperCase() + event.status.slice(1)}</span></div>
              <div className="row">📅 {event.date}</div>
              <div className="row">🕒 {event.time}</div>
              <div className="row">📍 {event.location}</div>
              <div className="card-footer">
                <p><strong>{event.checkedIn}</strong> / {event.totalGuests} checked in</p>
                <div className="action-group">
                  <Link to={`/check-in?event=${encodeURIComponent(event.title)}`} className="secondary-btn">Check-In</Link>
                  <Link to={`/events/${event.id}`} className="manage-btn">Manage</Link>
                </div>
              </div>
            </article>
          ))}
        </section>

        {visibleEvents.length === 0 && <p className="no-results">No events matched your search/filter.</p>}
      </main>
    </div>
  );
}

function SimplePage({ title, text }) {
  return (
    <div className="subpage">
      <Header />
      <div className="placeholder-card">
        <h1>{title}</h1>
        <p>{text}</p>
        <Link to="/events" className="primary-btn back-btn">Back to Events</Link>
      </div>
    </div>
  );
}

function CheckInPage() {
  const [searchParams] = useSearchParams();
  const preset = searchParams.get('event');
  const defaultEvent = preset && events.some((e) => e.title === preset) ? preset : events[0].title;
  const [eventName, setEventName] = useState(defaultEvent);
  const [name, setName] = useState('');
  const [ticket, setTicket] = useState('');
  const [records, setRecords] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('eventhub-checkins-v1') || '[]');
    } catch {
      return [];
    }
  });

  const eventRecords = records.filter((r) => r.event === eventName).slice().reverse();

  function submit(e) {
    e.preventDefault();
    if (!name.trim() || !ticket.trim()) return;
    const next = [...records, { event: eventName, name: name.trim(), ticket: ticket.trim(), time: new Date().toLocaleString() }];
    setRecords(next);
    localStorage.setItem('eventhub-checkins-v1', JSON.stringify(next));
    setName('');
    setTicket('');
  }

  return (
    <div className="subpage">
      <Header />
      <div className="placeholder-card">
        <h1>QR Check-In Desk</h1>
        <p>Choose an event and register attendees as they arrive. (Simulated check-in flow)</p>
        <form className="checkin-form" onSubmit={submit}>
          <label>Event
            <select value={eventName} onChange={(e) => setEventName(e.target.value)}>
              {events.map((event) => <option key={event.id}>{event.title}</option>)}
            </select>
          </label>
          <label>Attendee Name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex Carter" />
          </label>
          <label>Ticket / QR ID
            <input value={ticket} onChange={(e) => setTicket(e.target.value)} placeholder="e.g. DND-2048" />
          </label>
          <button className="primary-btn" type="submit">Confirm Check-In</button>
        </form>

        <div className="checkin-list-wrap">
          <h2>Recent Check-Ins</h2>
          <ul className="checkin-list">
            {eventRecords.length > 0 ? eventRecords.map((record, index) => (
              <li key={`${record.ticket}-${index}`}><strong>{record.name}</strong> • {record.ticket}<span>{record.time}</span></li>
            )) : <li className="muted">No check-ins yet for this event.</li>}
          </ul>
        </div>
        <Link to="/events" className="primary-btn back-btn">Back to Events</Link>
      </div>
    </div>
  );
}

export default App;
