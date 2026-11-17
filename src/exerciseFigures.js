// Animated stick-figure diagrams for the home exercises (side view unless noted).
// figureSvg(slug, { animate }) returns an SVG string. The figure moves between a
// start and end pose; the body part doing the work is drawn in the accent colour,
// and a faint outline shows the end position. No external images or libraries.
//
// Colours come from CSS variables with fallbacks, so the host page can theme them:
//   --fig-ink (body), --fig-accent (moving part), --fig-prop (floor, chair, mat)

const INK = 'var(--fig-ink,#1E2B25)'
const ACC = 'var(--fig-accent,#C9500F)'
const PROP = 'var(--fig-prop,#B9C7C0)'

// Reusable props
const mat = `<rect x="14" y="99" width="152" height="4" rx="2" fill="${PROP}"/>`
const floor = (y) => `<line x1="10" y1="${y}" x2="170" y2="${y}" stroke="${PROP}" stroke-width="2" stroke-linecap="round"/>`
const chair = (x1, x2) => `<g stroke="${PROP}" stroke-width="3" stroke-linecap="round" fill="none"><line x1="${x1}" y1="72" x2="${x2}" y2="72"/><line x1="${x1}" y1="72" x2="${x1}" y2="34"/><line x1="${x1 + 2}" y1="72" x2="${x1 + 2}" y2="100"/><line x1="${x2 - 2}" y1="72" x2="${x2 - 2}" y2="100"/></g>${floor(100)}`
const arrow = (x1, y1, x2, y2) => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 5
  const p1 = [x2 - h * Math.cos(a - 0.5), y2 - h * Math.sin(a - 0.5)], p2 = [x2 - h * Math.cos(a + 0.5), y2 - h * Math.sin(a + 0.5)]
  return `<g stroke="${ACC}" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><polyline points="${p1.join(',')} ${x2},${y2} ${p2.join(',')}"/></g>`
}

// Standard skeleton: [from, to, group]. Groups listed in `hi` are drawn in the accent colour.
const BODY = [['N', 'P', 'torso'], ['P', 'K1', 'leg1'], ['K1', 'A1', 'leg1'], ['A1', 'T1', 'leg1'], ['P', 'K2', 'leg2'], ['K2', 'A2', 'leg2'], ['A2', 'T2', 'leg2'], ['N', 'E1', 'arm1'], ['E1', 'W1', 'arm1'], ['N', 'E2', 'arm2'], ['E2', 'W2', 'arm2']]

export const FIGURES = {
  quad_set: {
    caption: 'Lying, towel under the knee. Tighten the thigh and press the knee down.',
    props: mat + `<rect x="98" y="94" width="14" height="5" rx="2.5" fill="${PROP}"/>` + arrow(105, 74, 105, 84),
    hi: ['leg1'], head: 7, top: 70,
    poses: [
      { H: [26, 90], N: [40, 95], P: [78, 95], K1: [105, 91], A1: [131, 95], T1: [132, 88], E1: [56, 96], W1: [70, 97] },
      { H: [26, 90], N: [40, 95], P: [78, 95], K1: [105, 94], A1: [131, 95], T1: [132, 88], E1: [56, 96], W1: [70, 97] },
    ],
  },
  straight_leg_raise: {
    caption: 'Both legs straight. Lift one straight leg about a foot off the floor, hold, then lower.',
    props: mat, hi: ['leg1'], head: 7,
    poses: [
      { H: [26, 90], N: [40, 95], P: [78, 95], K2: [104, 96], A2: [130, 96], T2: [131, 89], K1: [104, 95], A1: [130, 95], T1: [131, 88], E1: [56, 96], W1: [70, 97] },
      { H: [26, 90], N: [40, 95], P: [78, 95], K2: [104, 96], A2: [130, 96], T2: [131, 89], K1: [102, 86], A1: [127, 77], T1: [125, 70], E1: [56, 96], W1: [70, 97] },
    ],
  },
  seated_knee_extension: {
    caption: 'Sit back in a firm chair. Slowly straighten one knee, hold, lower.',
    props: chair(58, 96), hi: ['leg1'], head: 7,
    poses: [
      { H: [72, 25], N: [70, 34], P: [70, 68], K2: [94, 69], A2: [94, 96], T2: [101, 97], K1: [96, 68], A1: [96, 96], T1: [103, 97], E1: [76, 52], W1: [87, 64] },
      { H: [72, 25], N: [70, 34], P: [70, 68], K2: [94, 69], A2: [94, 96], T2: [101, 97], K1: [96, 68], A1: [124, 67], T1: [125, 60], E1: [76, 52], W1: [87, 64] },
    ],
  },
  hamstring_stretch: {
    caption: 'Sit on the chair edge, heel on the floor. Lean forward from the hips, back straight.',
    props: chair(58, 96), hi: ['leg1'], head: 7,
    poses: [
      { H: [88, 25], N: [86, 34], P: [88, 68], K2: [110, 70], A2: [110, 96], T2: [117, 97], K1: [114, 82], A1: [140, 95], T1: [141, 88], E1: [94, 50], W1: [104, 62] },
      { H: [107, 29], N: [102, 37], P: [88, 68], K2: [110, 70], A2: [110, 96], T2: [117, 97], K1: [114, 82], A1: [140, 95], T1: [141, 88], E1: [112, 52], W1: [120, 70] },
    ],
  },
  side_lying_leg_lift: {
    caption: 'Lying on your side, bottom knee bent. Lift the top leg about a hand-span.',
    props: mat, hi: ['leg1'], head: 7,
    poses: [
      { H: [26, 88], N: [40, 92], P: [80, 92], K2: [100, 98], A2: [118, 99], T2: [118, 99], K1: [106, 91], A1: [132, 91], T1: [132, 91], E1: [58, 89], W1: [74, 90] },
      { H: [26, 88], N: [40, 92], P: [80, 92], K2: [100, 98], A2: [118, 99], T2: [118, 99], K1: [105, 84], A1: [130, 77], T1: [130, 77], E1: [58, 89], W1: [74, 90] },
    ],
  },
  bridge: {
    caption: 'Knees bent, feet flat. Squeeze your buttocks and lift your hips into a straight line.',
    props: mat, hi: ['torso', 'leg1'], head: 7,
    poses: [
      { H: [30, 92], N: [44, 95], P: [78, 95], K1: [100, 76], A1: [116, 96], T1: [124, 96], E1: [58, 97], W1: [72, 97] },
      { H: [30, 92], N: [44, 95], P: [78, 81], K1: [102, 73], A1: [116, 96], T1: [124, 96], E1: [58, 97], W1: [72, 97] },
    ],
  },
  standing_hip_extension: {
    caption: 'Hold a counter. Keep the knee straight and move one leg slowly backwards.',
    props: floor(108) + `<g stroke="${PROP}" stroke-width="3" stroke-linecap="round"><line x1="110" y1="52" x2="164" y2="52"/><line x1="158" y1="52" x2="158" y2="108"/></g>`,
    hi: ['leg1'], head: 8,
    poses: [
      { H: [83, 12], N: [82, 22], P: [82, 56], K2: [82, 82], A2: [82, 107], T2: [89, 108], K1: [83, 82], A1: [83, 107], T1: [90, 108], E1: [98, 36], W1: [114, 51] },
      { H: [83, 12], N: [82, 22], P: [82, 56], K2: [82, 82], A2: [82, 107], T2: [89, 108], K1: [73, 80], A1: [64, 105], T1: [71, 107], E1: [98, 36], W1: [114, 51] },
    ],
  },
  daily_walk: {
    caption: 'Walk on flat ground in cushioned shoes. Build up a few minutes at a time.',
    props: floor(108), hi: ['leg1'], head: 8, gait: true,
    poses: [
      { H: [91, 12], N: [90, 22], P: [88, 56], K1: [97, 81], A1: [104, 106], T1: [111, 107], K2: [82, 81], A2: [72, 105], T2: [78, 108], E1: [84, 40], W1: [79, 55], E2: [96, 40], W2: [103, 53] },
      { H: [91, 12], N: [90, 22], P: [88, 56], K1: [82, 81], A1: [72, 105], T1: [78, 108], K2: [97, 81], A2: [104, 106], T2: [111, 107], E1: [96, 40], W1: [103, 53], E2: [84, 40], W2: [79, 55] },
    ],
  },
  pelvic_tilt: {
    caption: 'Knees bent. Tighten your stomach and gently flatten your lower back into the floor.',
    props: mat + arrow(62, 74, 62, 84), hi: ['torso'], head: 7, top: 70,
    bones: [['N', 'L', 'torso'], ['L', 'P', 'torso'], ['P', 'K1', 'leg1'], ['K1', 'A1', 'leg1'], ['A1', 'T1', 'leg1'], ['N', 'E1', 'arm1'], ['E1', 'W1', 'arm1']],
    poses: [
      { H: [30, 92], N: [44, 95], L: [62, 89], P: [80, 95], K1: [102, 76], A1: [118, 96], T1: [126, 96], E1: [58, 97], W1: [72, 97] },
      { H: [30, 92], N: [44, 95], L: [62, 96], P: [80, 95], K1: [102, 76], A1: [118, 96], T1: [126, 96], E1: [58, 97], W1: [72, 97] },
    ],
  },
  bird_dog: {
    caption: 'On hands and knees, back flat. Reach one arm forward and the opposite leg back.',
    props: floor(104), hi: ['arm1', 'leg1'], head: 7,
    poses: [
      { H: [116, 63], N: [104, 74], P: [70, 78], E2: [104, 89], W2: [104, 103], K2: [70, 103], A2: [44, 103], T2: [44, 103], E1: [105, 89], W1: [105, 103], K1: [71, 103], A1: [45, 103], T1: [45, 103] },
      { H: [116, 63], N: [104, 74], P: [70, 78], E2: [104, 89], W2: [104, 103], K2: [70, 103], A2: [44, 103], T2: [44, 103], E1: [121, 71], W1: [138, 68], K1: [45, 77], A1: [19, 76], T1: [19, 76] },
    ],
  },
  chin_tuck: {
    caption: 'Sit tall. Draw your chin straight back without tipping the head down.',
    props: `<line x1="56" y1="38" x2="150" y2="38" stroke="${PROP}" stroke-width="1.5" stroke-dasharray="4 4"/>` + arrow(122, 22, 108, 22),
    hi: ['neck'], head: 11, top: 14,
    bones: [['N', 'P', 'torso'], ['N', 'Nk', 'neck'], ['N', 'E1', 'arm1'], ['E1', 'W1', 'arm1']],
    poses: [
      { H: [104, 40], Nk: [99, 50], N: [90, 60], P: [90, 106], E1: [97, 84], W1: [106, 101] },
      { H: [93, 40], Nk: [91, 50], N: [90, 60], P: [90, 106], E1: [97, 84], W1: [106, 101] },
    ],
  },
  neck_isometric: {
    caption: 'Palm on forehead. Press head and hand together so nothing moves. Repeat each side.',
    props: arrow(126, 30, 117, 30) + arrow(98, 22, 108, 22),
    hi: ['arm1'], head: 11, top: 14,
    bones: [['N', 'P', 'torso'], ['N', 'Nk', 'torso'], ['N', 'E1', 'arm1'], ['E1', 'W1', 'arm1']],
    poses: [
      { H: [96, 40], Nk: [93, 50], N: [90, 60], P: [90, 106], E1: [112, 72], W1: [111, 41] },
      { H: [96, 40], Nk: [93, 50], N: [90, 60], P: [90, 106], E1: [111, 72], W1: [109, 41] },
    ],
  },
  shoulder_blade_squeeze: {
    caption: 'Seen from behind. Squeeze the shoulder blades back and down, without shrugging.',
    props: arrow(70, 50, 80, 50) + arrow(130, 50, 120, 50),
    hi: ['blade'], head: 9,
    bones: [['Nn', 'P', 'torso'], ['SL', 'Nn', 'torso'], ['Nn', 'SR', 'torso'], ['SL', 'EL', 'arm'], ['EL', 'WL', 'arm'], ['SR', 'ER', 'arm'], ['ER', 'WR', 'arm'], ['HL', 'HR', 'torso']],
    blobs: [['BL', 6, 10, 'blade'], ['BR', 6, 10, 'blade']],
    poses: [
      { H: [100, 17], Nn: [100, 30], P: [100, 98], SL: [78, 36], SR: [122, 36], EL: [72, 64], WL: [70, 90], ER: [128, 64], WR: [130, 90], HL: [88, 98], HR: [112, 98], BL: [88, 52], BR: [112, 52] },
      { H: [100, 17], Nn: [100, 30], P: [100, 98], SL: [79, 38], SR: [121, 38], EL: [75, 65], WL: [73, 91], ER: [125, 65], WR: [127, 91], HL: [88, 98], HR: [112, 98], BL: [94, 54], BR: [106, 54] },
    ],
  },
}

const fmt = (n) => Math.round(n * 10) / 10

export function figureSvg(slug, { animate = true, title = '' } = {}) {
  const f = FIGURES[slug]
  if (!f) return ''
  const [p0, p1] = f.poses
  const bones = (f.bones || BODY).filter(([a, b]) => p0[a] && p0[b])
  const hi = new Set(f.hi || [])
  const dur = f.gait ? '1.6s' : '4s'
  // start -> hold -> end -> hold -> back to start (gait: smooth back and forth)
  const kt = f.gait ? '0;0.5;1' : '0;0.15;0.45;0.75;1'
  const vals = (a, b) => (f.gait ? [a, b, a] : [a, a, b, b, a]).join(';')
  const anim = (attr, a, b) => (animate && a !== b ? `<animate attributeName="${attr}" values="${vals(fmt(a), fmt(b))}" keyTimes="${kt}" dur="${dur}" repeatCount="indefinite" calcMode="linear"/>` : '')
  const at = (p) => (animate ? p0 : p1)  // without animation, show the end position
  const colour = (g) => (hi.has(g) ? ACC : INK)

  // Faint outline of the end position
  const ghost = f.gait ? '' : bones.map(([a, b]) => `<line x1="${p1[a][0]}" y1="${p1[a][1]}" x2="${p1[b][0]}" y2="${p1[b][1]}" stroke="${INK}" stroke-opacity=".14" stroke-width="3.2" stroke-linecap="round"/>`).join('')

  // Draw non-highlighted parts first so the moving part sits on top
  const order = [...bones].sort((x, y) => Number(hi.has(x[2])) - Number(hi.has(y[2])))
  const lines = order.map(([a, b, g]) => {
    const s = at(), A = s[a], B = s[b]
    return `<line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}" stroke="${colour(g)}" stroke-width="3.4" stroke-linecap="round">` +
      anim('x1', p0[a][0], p1[a][0]) + anim('y1', p0[a][1], p1[a][1]) + anim('x2', p0[b][0], p1[b][0]) + anim('y2', p0[b][1], p1[b][1]) + '</line>'
  }).join('')
  const blobs = (f.blobs || []).map(([k, rx, ry, g]) => {
    const c = at()[k]
    return `<ellipse cx="${c[0]}" cy="${c[1]}" rx="${rx}" ry="${ry}" fill="${colour(g)}" fill-opacity=".85">` + anim('cx', p0[k][0], p1[k][0]) + anim('cy', p0[k][1], p1[k][1]) + '</ellipse>'
  }).join('')
  const h = at().H
  const head = `<circle cx="${h[0]}" cy="${h[1]}" r="${f.head || 7}" fill="none" stroke="${INK}" stroke-width="3">` + anim('cx', p0.H[0], p1.H[0]) + anim('cy', p0.H[1], p1.H[1]) + '</circle>'

  // Crop to the figure: top of the highest point (or f.top) to just below the floor
  const ys = [...Object.entries(p0), ...Object.entries(p1)].map(([k, v]) => v[1] - (k === 'H' ? (f.head || 7) : 0))
  const y0 = Math.max(0, Math.min(f.top ?? 999, Math.min(...ys) - 8))
  const y1 = Math.min(112, Math.max(...ys) + 10)
  const label = title || f.caption
  return `<svg viewBox="0 ${fmt(y0)} 180 ${fmt(y1 - y0)}" role="img" aria-label="${label.replace(/"/g, '&quot;')}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block">` +
    `<title>${label.replace(/</g, '&lt;')}</title>${f.props || ''}${ghost}${blobs}${lines}${head}</svg>`
}

export function figureCaption(slug) {
  return FIGURES[slug]?.caption || ''
}
