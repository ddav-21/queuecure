const { useEffect, useMemo, useState } = React;
const motionApi = window.framerMotion || null;
const MotionDiv = motionApi ? motionApi.motion.div : 'div';
const MotionArticle = motionApi ? motionApi.motion.article : 'article';
const MotionButton = motionApi ? motionApi.motion.button : 'button';

const API = {
  get: async (url) => {
    const response = await fetch(url);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Request failed');
    return payload;
  },
  post: async (url, body) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Request failed');
    return payload;
  },
  patch: async (url, body) => {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Request failed');
    return payload;
  },
  put: async (url, body) => {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Request failed');
    return payload;
  }
};

const HOME_STEPS = [
  {
    title: 'Create Account Or Sign In',
    text: 'Use your email and password to access QueueCure from your phone in dorm or class.'
  },
  {
    title: 'Tap Book Now',
    text: 'Choose an open time slot from the live calendar. Closed or booked slots are locked automatically.'
  },
  {
    title: 'Log Symptoms',
    text: 'Write your symptoms in under one minute so nurse triage can start before you arrive.'
  },
  {
    title: 'Get Follow-Up Notes',
    text: 'Check your My Status page for nurse notes and care instructions after your visit.'
  }
];

const HOME_BENEFITS = [
  {
    title: 'Reduce Wait Time',
    body: 'QueueCure targets a drop from around 50 minutes to under 20 minutes by replacing physical lines.'
  },
  {
    title: 'Anytime Health Advice',
    body: 'Students can access health guidance 24/7 through the library with quick red-flag checklists.'
  },
  {
    title: 'Smarter Triage',
    body: 'Nurses get symptom context early and can prioritize students with urgent warning signs.'
  }
];

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function plusDays(baseDate, days) {
  const copy = new Date(baseDate);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function Header({ tab, setTab, user, theme, onToggleTheme, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (targetTab) => {
    setTab(targetTab);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    onLogout();
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 640) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <header className="site-header">
      <div className="container nav-inner">
        <button className="logo" onClick={() => handleNav('home')}>
          <img className="logo-icon" src="queuecure-logo cr.png" alt="QueueCure logo" />
          <span className="logo-dark">Queue</span>
          <span className="logo-light">Cure</span>
        </button>

        <button
          className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={`top-nav ${mobileMenuOpen ? 'open' : ''}`} aria-label="Primary">
          <button className={tab === 'home' ? 'active' : ''} onClick={() => handleNav('home')}>Home</button>
          <button className={tab === 'library' ? 'active' : ''} onClick={() => handleNav('library')}>Health Library</button>
          <button className={tab === 'contact' ? 'active' : ''} onClick={() => handleNav('contact')}>Contact</button>
          <button className={tab === 'auth' ? 'active' : ''} onClick={() => handleNav('auth')}>
            {user ? 'Account' : 'Login/Signup'}
          </button>
          {user && user.role === 'Nurse' ? <button className={tab === 'nurse' ? 'active' : ''} onClick={() => handleNav('nurse')}>Nurse Center</button> : null}
          {user && user.role === 'Nurse' ? <button className={tab === 'db' ? 'active' : ''} onClick={() => handleNav('db')}>DB Viewer</button> : null}
          <button className="theme-btn" onClick={onToggleTheme}>{theme === 'dark' ? 'Light' : 'Dark'}</button>
          {user ? <button onClick={handleLogout}>Logout</button> : null}
        </nav>
      </div>
    </header>
  );
}

function Hero({ onBookNow }) {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="hero-brand-mark">
            <img src="QueueCure-Logo cr.png" alt="QueueCure logo" />
            <span>QueueCure Health Portal</span>
          </div>
          <p className="kicker">Gelan Special Boys&apos; Boarding Secondary School</p>
          <h1>From long clinic lines to fast digital recovery.</h1>
          <p>
            QueueCure helps a sick student understand the process and book care in under two minutes.
            No queue confusion. No crowding. Just clear next steps.
          </p>
          <button className="cta" onClick={onBookNow}>Book Now</button>
        </div>
        <div className="hero-card">
          <h3>Fast Access Promise</h3>
          <p>Live slots + pre-logged symptoms + nurse command center.</p>
          <p><strong>Goal:</strong> cut average wait from 50 min to under 20 min.</p>
        </div>
      </div>
    </section>
  );
}

function HomePage({ onBookNow, onGoAuth }) {
  return (
    <>
      <Hero onBookNow={onBookNow} />

      <section className="container block">
        <div className="section-head">
          <h2>How It Works</h2>
          <p>Simple transition from manual clinic lines to digital booking.</p>
        </div>
        <div className="step-grid">
          {HOME_STEPS.map((item, index) => (
            <article key={item.title} className="card step-card">
              <span className="index">0{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container block">
        <div className="section-head">
          <h2>Why Students Use QueueCure</h2>
          <p>Quick value highlights for sick students who need immediate clarity.</p>
        </div>
        <div className="benefit-grid">
          {HOME_BENEFITS.map((item) => (
            <article key={item.title} className="card benefit-card">
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container block">
        <div className="card qr-callout">
          <h2>Dorm QR Quick Entry</h2>
          <p>
            Posters in dorms include QueueCure QR codes. Students scan and land directly on booking
            with location context (example: <code>/book?location=Dorm8</code>).
          </p>
          <button className="secondary" onClick={onBookNow}>Open Booking Calendar</button>
        </div>
      </section>

      <section className="container block">
        <div className="card quick-auth">
          <h2>Login / Signup Entry</h2>
          <p>If you are feeling unwell now, sign in or create your account and book in less than 2 minutes.</p>
          <button className="cta" onClick={onGoAuth}>Go To Login/Signup</button>
        </div>
      </section>
    </>
  );
}

function AppointmentSlotCard({ slot, selectedSlot, onSlotSelect, index }) {
  const isBooked = slot.isBooked || !slot.isOpen;
  const isActive = selectedSlot === slot.timeSlot;

  return (
    <MotionButton
      type="button"
      className={`slot-card ${isBooked ? 'booked' : 'available'} ${isActive ? 'picked' : ''}`}
      disabled={isBooked}
      onClick={() => !isBooked && onSlotSelect(slot.timeSlot)}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
    >
      <span className="slot-gradient-line" aria-hidden="true" />
      {!isBooked ? <span className="pulse-dot" aria-hidden="true" /> : null}
      <span className="slot-time">{slot.timeSlot}</span>
      <span className="slot-state">{isBooked ? 'Booked' : 'Available'}</span>
    </MotionButton>
  );
}

function BookingCalendar({ selectedDate, onDateChange, slots, onSlotSelect, selectedSlot }) {
  const today = new Date();
  const days = [...Array(7).keys()].map((offset) => plusDays(today, offset));

  return (
    <div className="calendar-shell">
      <h3>Live Appointment Calendar</h3>
      <div className="day-grid">
        {days.map((day) => {
          const value = formatDate(day);
          const active = value === selectedDate;
          return (
            <button key={value} className={`day-pill ${active ? 'active' : ''}`} onClick={() => onDateChange(value)}>
              <span>{day.toLocaleDateString(undefined, { weekday: 'short' })}</span>
              <strong>{day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</strong>
            </button>
          );
        })}
      </div>

      <MotionDiv className="slot-card-grid" initial="hidden" animate="visible">
        {slots.map((slot, index) => (
          <AppointmentSlotCard
            key={slot.timeSlot}
            slot={slot}
            selectedSlot={selectedSlot}
            onSlotSelect={onSlotSelect}
            index={index}
          />
        ))}
      </MotionDiv>
    </div>
  );
}

function StudentDashboard({ currentUser, qrLocation }) {
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const loadSlots = async (dateValue) => {
    const data = await API.get(`/api/appointments/slots?date=${dateValue}`);
    setSlots(data.slots);
  };

  const loadAppointments = async () => {
    const rows = await API.get(`/api/appointments/student/${currentUser.id}`);
    setAppointments(rows);
  };

  useEffect(() => {
    loadSlots(selectedDate).catch((error) => setMessage(error.message));
  }, [selectedDate]);

  useEffect(() => {
    loadAppointments().catch((error) => setMessage(error.message));
  }, []);

  const book = async () => {
    if (!selectedSlot) {
      setMessage('Choose a time slot first.');
      return;
    }

    setBusy(true);
    setMessage('');
    try {
      const taggedSymptoms = qrLocation ? `[Location:${qrLocation}] ${symptoms}` : symptoms;
      await API.post('/api/appointments', {
        studentId: currentUser.id,
        date: selectedDate,
        timeSlot: selectedSlot,
        symptoms: taggedSymptoms
      });
      setSymptoms('');
      setSelectedSlot('');
      await Promise.all([loadSlots(selectedDate), loadAppointments()]);
      setMessage('Booking confirmed.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="container block">
      <div className="dash-grid">
        <article className="card">
          <h2>Book Appointment</h2>
          {qrLocation ? <p className="hint">Detected scan location: {qrLocation}</p> : null}
          <BookingCalendar
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            slots={slots}
            onSlotSelect={setSelectedSlot}
            selectedSlot={selectedSlot}
          />
          <label>Symptoms</label>
          <textarea
            value={symptoms}
            onChange={(event) => setSymptoms(event.target.value)}
            placeholder="e.g., sore throat, fever, dizziness"
          />
          <button className="cta" onClick={book} disabled={busy}>{busy ? 'Booking...' : 'Confirm Booking'}</button>
          {message ? <p className="hint">{message}</p> : null}
        </article>

        <article className="card">
          <h2>My Status</h2>
          <div className="list-col">
            {appointments.length === 0 ? <p>No appointments yet.</p> : null}
            {appointments.map((item) => (
              <div className="status-card" key={item.id}>
                <h4>{item.date} • {item.timeSlot}</h4>
                <p>Status: <strong>{item.status}</strong></p>
                <p>Nurse notes: {item.nurseNotes || 'Not yet provided.'}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function NurseDashboard() {
  const [date, setDate] = useState(formatDate(new Date()));
  const [schedule, setSchedule] = useState([]);
  const [slotControls, setSlotControls] = useState([]);
  const [message, setMessage] = useState('');

  const refresh = async () => {
    const [scheduleRows, slotRows] = await Promise.all([
      API.get(`/api/nurse/schedule?date=${date}`),
      API.get(`/api/nurse/slots?date=${date}`)
    ]);
    setSchedule(scheduleRows);
    setSlotControls(slotRows.slots);
  };

  useEffect(() => {
    refresh().catch((error) => setMessage(error.message));
  }, [date]);

  return (
    <section className="container block">
      <div className="card">
        <h2>Nurse Command Center</h2>
        <label>Schedule Date</label>
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        {message ? <p className="hint">{message}</p> : null}

        <h3>Open/Close Slots</h3>
        <div className="slot-grid">
          {slotControls.map((slot) => (
            <button
              key={slot.timeSlot}
              className={`slot-pill ${slot.isOpen ? '' : 'locked'}`}
              onClick={() =>
                API.put('/api/nurse/slots', { date, timeSlot: slot.timeSlot, isOpen: !slot.isOpen })
                  .then(refresh)
                  .catch((error) => setMessage(error.message))
              }
            >
              <span>{slot.timeSlot}</span>
              <small>{slot.isOpen ? 'Open' : 'Closed'}</small>
            </button>
          ))}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Student</th>
                <th>Symptoms</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {schedule.length === 0 ? <tr><td colSpan="4">No bookings.</td></tr> : null}
              {schedule.map((row) => (
                <tr key={row.id}>
                  <td>{row.timeSlot}</td>
                  <td>{row.studentEmail}</td>
                  <td>{row.symptoms || 'Not provided'}</td>
                  <td>{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function sectionize(text) {
  return String(text || '')
    .split('\n\n')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const idx = chunk.indexOf(':');
      if (idx === -1) return { label: 'Note', value: chunk };
      return { label: chunk.slice(0, idx).trim(), value: chunk.slice(idx + 1).trim() };
    });
}

function pickSection(rows, label) {
  const target = label.toLowerCase();
  const found = rows.find((row) => row.label.toLowerCase().includes(target));
  return found ? found.value : 'Not provided yet.';
}

function libraryIcon(category) {
  const label = String(category || '').toLowerCase();
  if (label.includes('injur')) return '🩹';
  if (label.includes('hygiene') || label.includes('skin')) return '🧼';
  if (label.includes('mental')) return '🧠';
  if (label.includes('respir') || label.includes('viral')) return '🌡️';
  return '💙';
}

function LibrarySection() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [expanded, setExpanded] = useState({});

  const load = async (q, cat) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (cat) params.set('category', cat);
    const data = await API.get(`/api/library?${params.toString()}`);
    setArticles(data.articles);
    setCategories(data.categories);
  };

  useEffect(() => {
    load('', '');
  }, []);

  return (
    <section className="container block">
      <div className="section-head">
        <h2>Health Library</h2>
        <p>Easy-to-scan bento cards for students and clients.</p>
      </div>

      <div className="library-tools card">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by symptom or topic" />
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">All categories</option>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <button className="secondary" onClick={() => load(query, category)}>Search</button>
      </div>

      <MotionDiv className="library-grid bento-layout" initial="hidden" animate="visible">
        {articles.map((article, index) => {
          const rows = sectionize(article.contentBody);
          const overview = pickSection(rows, 'overview');
          const expectText = pickSection(rows, 'what to expect');
          const dormCare = pickSection(rows, 'dorm care');
          const nurseTrigger = pickSection(rows, 'nurse trigger');
          const redFlag = pickSection(rows, 'red flag');
          const isExpanded = !!expanded[article.id];

          return (
            <MotionArticle
              key={article.id}
              className={`card library-card bento-card ${isExpanded ? 'expanded' : ''}`}
              layout
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
            >
              <span className="slot-gradient-line" aria-hidden="true" />

              <div className="library-head">
                <div className="lib-icon" aria-hidden="true">{libraryIcon(article.category)}</div>
                <div>
                  <h3>{article.title}</h3>
                  <p className="snippet-2">{overview}</p>
                </div>
              </div>

              {isExpanded ? (
                <div className="bento-grid">
                  <div className="bento-item"><strong>What to Expect</strong><p>{expectText}</p></div>
                  <div className="bento-item"><strong>Dorm Care</strong><p>{dormCare}</p></div>
                  <div className="bento-item"><strong>Nurse Trigger</strong><p>{nurseTrigger}</p></div>
                  <div className="bento-item bento-red-flag"><strong>Red Flag</strong><p>{redFlag}</p></div>
                </div>
              ) : null}

              <div className="lib-footer-row">
                <div className="pill-row">
                  <span className="pill">{article.category}</span>
                  <span className="pill">Clinic Guide</span>
                </div>
                <button
                  className="read-more"
                  onClick={() => setExpanded((prev) => ({ ...prev, [article.id]: !prev[article.id] }))}
                >
                  {isExpanded ? 'Show Less' : 'Read More'}
                </button>
              </div>
            </MotionArticle>
          );
        })}
      </MotionDiv>
    </section>
  );
}

function DatabaseViewer() {
  const [table, setTable] = useState('Users');
  const [summary, setSummary] = useState([]);
  const [rows, setRows] = useState([]);

  const load = async (target) => {
    const data = await API.get(`/api/admin/db?table=${encodeURIComponent(target)}`);
    setTable(data.table);
    setSummary(data.summary);
    setRows(data.rows);
  };

  useEffect(() => {
    load('Users');
  }, []);

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <section className="container block">
      <div className="card">
        <h2>Database Viewer</h2>
        <div className="db-tabs">
          {summary.map((item) => (
            <button key={item.table} className={table === item.table ? 'active' : ''} onClick={() => load(item.table)}>
              {item.table} ({item.rows})
            </button>
          ))}
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
            </thead>
            <tbody>
              {rows.length === 0 ? <tr><td>No rows yet.</td></tr> : null}
              {rows.map((row, idx) => (
                <tr key={`row-${idx}`}>
                  {columns.map((column) => <td key={`${idx}-${column}`}>{String(row[column] ?? '')}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  return (
    <section className="container block">
      <div className="card contact-card">
        <h2>Contact The Clinic</h2>
        <p>Use QueueCure first for booking. For urgent campus concerns, contact the nurse office directly.</p>
        <div className="contact-grid">
          <div>
            <h4>Clinic Office</h4>
            <p>Gelan Special Boys&apos; Boarding Secondary School</p>
            <p>Weekdays 8:00 AM - 5:00 PM</p>
          </div>
          <div>
            <h4>Support Channels</h4>
            <p>Email: nurse@queuecure.school</p>
            <p>Portal: QueueCure Nurse Command Center</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function AuthPanel({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('login');
  const [message, setMessage] = useState('');

  const submit = async () => {
    try {
      if (mode === 'register') {
        await API.post('/api/auth/register/student', { email, password });
      }
      const login = await API.post('/api/auth/login', { email, password });
      onLogin(login.user);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <section className="container block" id="auth-entry">
      <div className="card auth-card">
        <h2>{mode === 'login' ? 'Login' : 'Create Account'}</h2>
        <p>Student accounts use email + password only.</p>
        <p>Nurse demo: nurse@queuecure.school / NursePass123</p>
        <input value={email} type="email" onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
        <input value={password} type="password" onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
        <button className="cta" onClick={submit}>{mode === 'login' ? 'Sign In' : 'Sign Up'}</button>
        <button className="switch" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Login'}
        </button>
        {message ? <p className="hint">{message}</p> : null}
      </div>
    </section>
  );
}

function Footer({ setTab }) {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <p>QueueCure • Digital School Health Access</p>
        <div>
          <button onClick={() => setTab('library')}>Health Library</button>
          <button onClick={() => setTab('contact')}>Contact</button>
          <button onClick={() => setTab('auth')}>Login/Signup</button>
        </div>
      </div>
    </footer>
  );
}

function App() {
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const qrLocation = query.get('location');

  const [tab, setTab] = useState('home');
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('queuecureTheme');
    if (saved) return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('queuecureUser');
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('queuecureTheme', theme);
  }, [theme]);

  const login = (userData) => {
    localStorage.setItem('queuecureUser', JSON.stringify(userData));
    setUser(userData);
    setTab(userData.role === 'Nurse' ? 'nurse' : 'student');
  };

  const logout = () => {
    localStorage.removeItem('queuecureUser');
    setUser(null);
    setTab('home');
  };

  const goBooking = () => {
    setTab(user ? 'student' : 'auth');
  };

  return (
    <div>
      <Header
        tab={tab}
        setTab={setTab}
        user={user}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onLogout={logout}
      />

      {tab === 'home' ? <HomePage onBookNow={goBooking} onGoAuth={() => setTab('auth')} /> : null}
      {tab === 'student' && user && user.role === 'Student' ? <StudentDashboard currentUser={user} qrLocation={qrLocation} /> : null}
      {tab === 'nurse' && user && user.role === 'Nurse' ? <NurseDashboard /> : null}
      {tab === 'db' && user && user.role === 'Nurse' ? <DatabaseViewer /> : null}
      {tab === 'library' ? <LibrarySection /> : null}
      {tab === 'contact' ? <ContactSection /> : null}
      {tab === 'auth' || !user ? <AuthPanel onLogin={login} /> : null}

      <Footer setTab={setTab} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);



