import { useEffect, useMemo, useState } from 'react'
import { chooseTask } from './taskPicker.js'
import './App.css'

const ENERGY_OPTIONS = {
  ringan: { icon: 'o', label: 'Ringan' },
  sedang: { icon: '-', label: 'Sedang' },
  berat: { icon: '!', label: 'Berat' },
}

const MOOD_OPTIONS = [
  {
    value: 'lelah',
    label: 'Aku Lelah',
    hint: 'Cari yang paling ringan dulu.',
  },
  {
    value: 'cukup',
    label: 'Cukup Bertenaga',
    hint: 'Mulai dari yang perlu diselesaikan.',
  },
  {
    value: 'semangat',
    label: 'Penuh Semangat',
    hint: 'Ambil tugas yang paling berbobot.',
  },
]

const STORAGE_KEY = 'pilin.tasks'

const ROUTINES = {
  sebelumTidur: {
    title: 'Sebelum Tidur',
    icon: 'Malam',
    doneMessage: 'Kamu sudah siap tidur. Semoga malam ini tenang dan memulihkan.',
    steps: [
      'Matikan layar minimal 15 menit sebelum tidur',
      'Cuci muka dan sikat gigi',
      'Tulis catatan singkat tentang hari ini',
      'Atur alarm untuk besok',
    ],
  },
  sebelumKuliah: {
    title: 'Sebelum Berangkat Kuliah',
    icon: 'Kuliah',
    doneMessage: 'Kamu siap berangkat. Ambil napas dulu sebelum keluar.',
    steps: [
      'Cek jadwal kuliah dan ruang kelas',
      'Siapkan buku catatan dan alat tulis',
      'Sarapan atau bawa bekal ringan',
      'Cek dompet, kunci, dan jas hujan',
    ],
  },
  mulaiBelajar: {
    title: 'Saat Hendak Mulai Belajar',
    icon: 'Belajar',
    doneMessage: 'Tempatmu sudah siap. Mulai dari satu bagian kecil.',
    steps: [
      'Buka materi yang paling relevan',
      'Singkirkan tab atau aplikasi yang tidak dipakai',
      'Tulis target belajar dalam satu kalimat',
      'Mulai timer 25 menit',
    ],
  },
  prioritasHariIni: {
    title: 'Menentukan Prioritas Hari Ini',
    icon: 'Prioritas',
    doneMessage: 'Prioritasmu sudah lebih jelas. Cukup ikuti satu langkah terdekat.',
    steps: [
      'Tulis semua hal yang sedang memenuhi kepala',
      'Lingkari yang punya tenggat paling dekat',
      'Pilih satu tugas ringan untuk pemanasan',
      'Pilih satu tugas utama untuk hari ini',
    ],
  },
}

function createId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    const parsed = saved ? JSON.parse(saved) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function formatDeadline(deadline) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${deadline}T12:00:00`))
}

function getRoutineProgressMessage(doneCount, totalSteps) {
  if (doneCount === 0) return 'Baru mulai, santai saja.'
  if (doneCount === totalSteps) return null
  if (totalSteps - doneCount === 1) return 'Tinggal satu lagi.'
  if (doneCount >= Math.ceil(totalSteps / 2)) return 'Setengah jalan, bagus.'
  return 'Lanjut pelan-pelan.'
}

function App() {
  const [mode, setMode] = useState('home')
  const [tasks, setTasks] = useState(loadTasks)
  const [mood, setMood] = useState(null)
  const [routineKey, setRoutineKey] = useState(null)
  const [checkedSteps, setCheckedSteps] = useState({})
  const [form, setForm] = useState({
    name: '',
    energy: 'ringan',
    deadline: '',
  })

  const currentTask = useMemo(() => chooseTask(tasks, mood), [tasks, mood])
  const currentRoutine = routineKey ? ROUTINES[routineKey] : null
  const checkedCount = Object.values(checkedSteps).filter(Boolean).length
  const routineDone = currentRoutine && checkedCount === currentRoutine.steps.length
  const routineProgressMessage = currentRoutine
    ? getRoutineProgressMessage(checkedCount, currentRoutine.steps.length)
    : null
  const unfinishedCount = tasks.filter((task) => !task.done).length
  const doneCount = tasks.filter((task) => task.done).length

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  function openTasks() {
    setMode('tasks')
    setRoutineKey(null)
    setCheckedSteps({})
  }

  function openRoutines() {
    setMode('routines')
    setMood(null)
  }

  function addTask(event) {
    event.preventDefault()
    const name = form.name.trim()
    if (!name) return

    setTasks((current) => [
      ...current,
      {
        id: createId(),
        name,
        energy: form.energy,
        deadline: form.deadline || null,
        done: false,
      },
    ])
    setForm({ name: '', energy: 'ringan', deadline: '' })
  }

  function finishTask(taskId) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, done: true } : task,
      ),
    )
  }

  function clearDoneTasks() {
    setTasks((current) => current.filter((task) => !task.done))
  }

  function resetSession() {
    setMood(null)
    setRoutineKey(null)
    setCheckedSteps({})
    setMode('home')
  }

  function openRoutine(key) {
    setRoutineKey(key)
    setCheckedSteps({})
  }

  function returnToRoutineList() {
    setRoutineKey(null)
    setCheckedSteps({})
  }

  function toggleStep(stepIndex) {
    setCheckedSteps((current) => ({
      ...current,
      [stepIndex]: !current[stepIndex],
    }))
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <button className="brand" type="button" onClick={resetSession}>
          <span>Pilin</span>
          <small>Pilih & Alirkan</small>
        </button>
        <nav className="mode-nav" aria-label="Mode aplikasi">
          <button
            className={mode === 'tasks' ? 'is-active' : ''}
            type="button"
            onClick={openTasks}
          >
            Tugas
          </button>
          <button
            className={mode === 'routines' ? 'is-active' : ''}
            type="button"
            onClick={openRoutines}
          >
            Rutin
          </button>
        </nav>
      </header>

      {mode === 'home' && (
        <section className="home-view" aria-labelledby="home-title">
          <p className="eyebrow">Satu langkah kecil dulu.</p>
          <h1 id="home-title">Apa yang perlu mengalir sekarang?</h1>
          <p className="home-copy">
            Pilih satu tugas saat kepala penuh, atau ikuti checklist saat rutinitas terasa berat.
          </p>
          <div className="home-actions">
            <button className="primary-action" type="button" onClick={openTasks}>
              Apa Selanjutnya?
            </button>
            <button className="secondary-action" type="button" onClick={openRoutines}>
              Panduan Rutin
            </button>
          </div>
          <p className="quiet-note">Sesi disimpan ringan di browser, hanya agar refresh tidak menghapus tugas.</p>
        </section>
      )}

      {mode === 'tasks' && (
        <section className="task-view" aria-labelledby="task-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Mode tugas</p>
              <h1 id="task-title">Apa Selanjutnya?</h1>
            </div>
            <button className="text-button" type="button" onClick={resetSession}>
              Kembali
            </button>
          </div>

          <form className="task-form" onSubmit={addTask}>
            <label>
              Nama tugas
              <input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Contoh: Rapikan catatan kuliah"
              />
            </label>

            <div className="form-row">
              <label>
                Energi
                <select
                  value={form.energy}
                  onChange={(event) => setForm({ ...form, energy: event.target.value })}
                >
                  <option value="ringan">Ringan</option>
                  <option value="sedang">Sedang</option>
                  <option value="berat">Berat</option>
                </select>
              </label>

              <label>
                Tenggat
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(event) => setForm({ ...form, deadline: event.target.value })}
                />
              </label>
            </div>

            <button className="primary-action compact" type="submit">
              Tambah Tugas
            </button>
          </form>

          <div className="task-summary">
            <span>{unfinishedCount} belum selesai</span>
            <span>{doneCount} selesai</span>
            {doneCount > 0 && (
              <button className="summary-action" type="button" onClick={clearDoneTasks}>
                Bersihkan selesai
              </button>
            )}
          </div>

          {!mood && (
            <div className="energy-panel">
              <div>
                <h2>Bagaimana energimu?</h2>
                <p>
                  {unfinishedCount > 0
                    ? 'Pilin akan memilih satu tugas berikutnya.'
                    : 'Tambahkan tugas dulu, atau pindah ke Panduan Rutin kalau belum ingin menulis tugas.'}
                </p>
              </div>
              <div className="energy-grid">
                {MOOD_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className="mood-button"
                    type="button"
                    onClick={() => setMood(option.value)}
                  >
                    <strong>{option.label}</strong>
                    <span>{option.hint}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mood && currentTask && (
            <article className="task-card">
              <p className="eyebrow">Satu ini saja</p>
              <h2>{currentTask.name}</h2>
              <div className="task-meta">
                <span>
                  {ENERGY_OPTIONS[currentTask.energy].icon} {ENERGY_OPTIONS[currentTask.energy].label}
                </span>
                {currentTask.deadline && <span>Tenggat: {formatDeadline(currentTask.deadline)}</span>}
              </div>
              {mood === 'lelah' && currentTask.energy !== 'ringan' && (
                <p className="gentle-warning">Ini mendesak, tapi lakukan dengan jeda ya.</p>
              )}
              <button className="primary-action" type="button" onClick={() => finishTask(currentTask.id)}>
                Selesai
              </button>
            </article>
          )}

          {mood && !currentTask && (
            <div className="empty-state">
              {unfinishedCount === 0 && doneCount > 0 ? (
                <p>Kamu sudah menyelesaikan semua. Istirahatlah sejenak.</p>
              ) : mood === 'lelah' ? (
                <p>Tidak ada tugas ringan saat ini. Coba Panduan Rutin agar langkah berikutnya lebih mudah.</p>
              ) : (
                <p>Belum ada tugas. Tambahkan satu hal kecil dulu, lalu mulai lagi.</p>
              )}
              <div className="empty-actions">
                <button className="secondary-action" type="button" onClick={() => setMood(null)}>
                  Pilih Energi Lagi
                </button>
                {mood === 'lelah' && (
                  <button className="text-button" type="button" onClick={openRoutines}>
                    Buka Panduan Rutin
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {mode === 'routines' && (
        <section className="routine-view" aria-labelledby="routine-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Panduan rutin</p>
              <h1 id="routine-title">
                {currentRoutine ? currentRoutine.title : 'Pilih Rutinitas'}
              </h1>
            </div>
            <button className="text-button" type="button" onClick={resetSession}>
              Kembali
            </button>
          </div>

          {!currentRoutine && (
            <div className="routine-grid">
              {Object.entries(ROUTINES).map(([key, routine]) => (
                <button
                  className="routine-choice"
                  key={key}
                  type="button"
                  onClick={() => openRoutine(key)}
                >
                  <span aria-hidden="true">{routine.icon}</span>
                  <strong>{routine.title}</strong>
                </button>
              ))}
            </div>
          )}

          {currentRoutine && (
            <article className="routine-card">
              <div className="routine-status">
                <p className="routine-message">
                  {routineDone ? currentRoutine.doneMessage : routineProgressMessage}
                </p>
                <span>{checkedCount} dari {currentRoutine.steps.length} langkah</span>
              </div>

              <div className="routine-steps">
                {currentRoutine.steps.map((step, index) => (
                  <label
                    className={`routine-step ${checkedSteps[index] ? 'is-checked' : ''}`}
                    key={step}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(checkedSteps[index])}
                      onChange={() => toggleStep(index)}
                    />
                    <span>{step}</span>
                  </label>
                ))}
              </div>

              <div className="routine-actions">
                <button className="secondary-action" type="button" onClick={returnToRoutineList}>
                  Pilih Rutinitas Lain
                </button>
                <button className="text-button" type="button" onClick={resetSession}>
                  Kembali ke Menu
                </button>
              </div>
            </article>
          )}
        </section>
      )}

      <footer className="app-footer">
        Sesi ini hanya untuk saat ini. Tutup tab dan bebaskan pikiranmu.
      </footer>
    </main>
  )
}

export default App
