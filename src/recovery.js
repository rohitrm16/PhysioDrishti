// Recovery logic shared by the patient app and the clinician dashboard (pure functions, no I/O).
// Adherence: a day counts when the patient did a session that day (stopping for pain still counts:
// stopping was the safe choice). Progress: pain trend, a personal goal (Patient-Specific Functional
// Scale style, 0 = cannot do it, 10 = can do it as before), and milestones.

export const DAY_MS = 86400000
export const dayKey = (d) => {  // local calendar day, YYYY-MM-DD
  const x = new Date(d)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }

export const countsAsDone = (s) => s.stopped || (s.items || []).reduce((t, i) => t + (i.done || 0), 0) >= 0.5 * (s.items || []).reduce((t, i) => t + (i.target || 0), 0)

export function adherence(sessions, { today = new Date(), days = 14, perDay = 1 } = {}) {
  const byDay = {}
  for (const s of sessions) if (countsAsDone(s)) byDay[dayKey(s.at)] = (byDay[dayKey(s.at)] || 0) + 1
  const done = (d) => (byDay[dayKey(d)] || 0) >= perDay
  // streak: consecutive days up to today; today not done yet does not break it
  let streak = 0
  let cursor = done(today) ? today : addDays(today, -1)
  while (done(cursor)) { streak += 1; cursor = addDays(cursor, -1) }
  const first = sessions.length ? new Date(Math.min(...sessions.map((s) => +new Date(s.at)))) : today
  const span = Math.max(1, Math.min(days, Math.floor((new Date(dayKey(today)) - new Date(dayKey(first))) / DAY_MS) + 1))
  let daysDone = 0
  for (let i = 0; i < span; i++) if (done(addDays(today, -i))) daysDone += 1
  const week = Array.from({ length: 7 }, (_, i) => { const d = addDays(today, i - 6); return { date: dayKey(d), dow: d.getDay(), count: byDay[dayKey(d)] || 0, done: done(d), today: i === 6 } })
  const last = sessions.length ? Math.max(...sessions.map((s) => +new Date(s.at))) : null
  const daysSinceLast = last == null ? null : Math.floor((new Date(dayKey(today)) - new Date(dayKey(last))) / DAY_MS)
  return { streak, daysDone, span, pct: Math.round((daysDone / span) * 100), week, doneToday: done(today), daysSinceLast }
}

const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
export function painTrend(sessions) {
  const pts = sessions.filter((s) => s.pain_before != null).map((s) => ({ at: s.at, before: s.pain_before, after: s.pain_after }))
  const first = avg(pts.slice(0, 3).map((p) => p.before)), last = avg(pts.slice(-3).map((p) => p.before))
  const recentRises = sessions.slice(-3).filter((s) => s.stopped || (s.pain_after != null && s.pain_before != null && s.pain_after - s.pain_before >= 2)).length
  return { points: pts, first, last, change: pts.length >= 4 ? Math.round((last - first) * 10) / 10 : null, recentRises }
}

// Pain-monitoring dose rule. Reps never go above the physiotherapist-approved dose (scale <= 1).
// Pain up 2+ points, or stopped for pain -> next session 25% fewer reps (not below half).
// A comfortable full session -> step back up by 25%. Back after 3+ days off -> start at 75%.
export function nextScale(sessions, { today = new Date() } = {}) {
  const lastS = sessions[sessions.length - 1]
  if (!lastS) return { scale: 1, reason: null }
  const prev = lastS.scale ?? 1
  const gap = Math.floor((new Date(dayKey(today)) - new Date(dayKey(lastS.at))) / DAY_MS)
  const flare = lastS.stopped || (lastS.pain_after != null && lastS.pain_after - (lastS.pain_before ?? lastS.pain_after) >= 2)
  if (flare) return { scale: Math.max(0.5, prev - 0.25), reason: 'Your pain went up last time, so today has fewer reps.' }
  if (gap >= 3) return { scale: Math.min(prev, 0.75), reason: `Welcome back! After ${gap} days off, we've made today a little lighter.` }
  const full = (lastS.items || []).every((i) => (i.done || 0) >= (i.target || 0))
  if (full && prev < 1) return { scale: Math.min(1, prev + 0.25), reason: 'Last session went well, so we are stepping back up.' }
  return { scale: prev, reason: prev < 1 ? 'Building back up gently.' : null }
}
export const scaledReps = (reps, scale) => Math.max(Math.min(3, reps), Math.round(reps * scale))

export function goalProgress(checkins) {
  if (!checkins?.length) return null
  const first = checkins[0], last = checkins[checkins.length - 1]
  const daysSince = Math.floor((Date.now() - +new Date(last.at)) / DAY_MS)
  return { goal: last.goal, first: first.rating, last: last.rating, change: last.rating - first.rating, points: checkins, due: daysSince >= 7 }
}

export function milestones(sessions, checkins = [], { today = new Date() } = {}) {
  const a = adherence(sessions, { today, days: 14 })
  const p = painTrend(sessions)
  const g = goalProgress(checkins)
  const done = sessions.filter(countsAsDone)
  const full = sessions.some((s) => !s.stopped && (s.items || []).length && s.items.every((i) => i.done >= i.target) && (s.scale ?? 1) >= 1)
  let bestStreak = 0
  for (let i = 0; i < done.length; i++) bestStreak = Math.max(bestStreak, adherence(sessions.filter((s) => +new Date(s.at) <= +new Date(done[i].at)), { today: new Date(done[i].at) }).streak)
  return [
    { id: 'first', icon: '🌱', title: 'First session', desc: 'You started. That is the hardest part.', achieved: done.length >= 1 },
    { id: 'streak3', icon: '🔥', title: '3-day streak', desc: 'Three days in a row.', achieved: bestStreak >= 3 },
    { id: 'full', icon: '💪', title: 'Full session', desc: 'Every rep of the full plan.', achieved: full },
    { id: 'streak7', icon: '📅', title: '7-day streak', desc: 'A full week without missing a day.', achieved: bestStreak >= 7 },
    { id: 'ten', icon: '🔟', title: '10 sessions', desc: 'Ten sessions done.', achieved: done.length >= 10 },
    { id: 'pain2', icon: '📉', title: 'Pain down 2 points', desc: 'Your usual pain is 2 points lower than when you started.', achieved: p.change != null && p.change <= -2 },
    { id: 'goal2', icon: '🎯', title: 'Goal +2', desc: 'Your goal activity is 2 points easier.', achieved: !!g && g.change >= 2 },
    { id: 'habit', icon: '🏆', title: 'Habit formed', desc: '10 of the last 14 days.', achieved: a.span >= 14 && a.daysDone >= 10 },
  ]
}

// Things a clinician should look at. Also drives patient-side nudges.
export function flags(sessions, checkins = [], { today = new Date() } = {}) {
  const out = []
  const a = adherence(sessions, { today })
  const p = painTrend(sessions)
  const g = goalProgress(checkins)
  const weekAgo = +today - 7 * DAY_MS
  const stoppedThisWeek = sessions.filter((s) => s.stopped && +new Date(s.at) >= weekAgo).length
  if (stoppedThisWeek >= 2) out.push({ level: 'danger', code: 'stopped', text: `Stopped for pain ${stoppedThisWeek} times this week` })
  if (p.recentRises >= 2) out.push({ level: 'danger', code: 'pain_rising', text: 'Pain went up in 2 of the last 3 sessions' })
  if (p.change != null && p.change >= 2) out.push({ level: 'warn', code: 'pain_worse', text: `Usual pain up ${p.change} points since starting` })
  if (a.daysSinceLast != null && a.daysSinceLast >= 3) out.push({ level: 'warn', code: 'inactive', text: `No session for ${a.daysSinceLast} days` })
  if (g && g.change <= -2) out.push({ level: 'warn', code: 'goal_worse', text: `Goal activity ${-g.change} points harder` })
  if (a.span >= 7 && a.pct < 50) out.push({ level: 'info', code: 'low_adherence', text: `Adherence ${a.pct}% over ${a.span} days` })
  return out
}

export function nudge(sessions, checkins = [], opts = {}) {
  const f = flags(sessions, checkins, opts)
  if (f.some((x) => x.level === 'danger')) return { tone: 'danger', text: 'Your pain has been going up during exercise. Please book a check with a physiotherapist before your next session.' }
  const a = adherence(sessions, opts)
  if (!sessions.length) return { tone: 'info', text: 'Start with one short session today. It takes about 10 minutes.' }
  if (a.doneToday) return { tone: 'good', text: a.streak > 1 ? `Done for today. ${a.streak}-day streak, keep it going tomorrow!` : 'Done for today. See you tomorrow!' }
  if (a.daysSinceLast >= 3) return { tone: 'info', text: `It has been ${a.daysSinceLast} days. No problem: today's session is lighter to ease you back in.` }
  if (a.streak >= 2) return { tone: 'info', text: `You're on a ${a.streak}-day streak. Today's session keeps it alive.` }
  return { tone: 'info', text: "Today's session is waiting. Small and regular beats long and rare." }
}
