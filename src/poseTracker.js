// Camera coach: on-device pose tracking and rep counting.
// Video never leaves the phone. MediaPipe Pose Landmarker runs in the browser (WebAssembly),
// loaded from a CDN only when the patient turns on the camera coach.

const MP_VERSION = '0.10.14'
const MP_BUNDLE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/vision_bundle.mjs`
const MP_WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`
const MP_MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

// MediaPipe landmark indices
export const LM = { nose: 0, lShoulder: 11, rShoulder: 12, lElbow: 13, rElbow: 14, lWrist: 15, rWrist: 16, lHip: 23, rHip: 24, lKnee: 25, rKnee: 26, lAnkle: 27, rAnkle: 28 }
export const SKELETON = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]]

let landmarkerPromise = null
export function loadPoseLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FilesetResolver, PoseLandmarker } = await import(/* @vite-ignore */ MP_BUNDLE)
      const vision = await FilesetResolver.forVisionTasks(MP_WASM)
      const make = (delegate) => PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MP_MODEL, delegate }, runningMode: 'VIDEO', numPoses: 1,
      })
      try { return await make('GPU') } catch { return await make('CPU') }
    })().catch((e) => { landmarkerPromise = null; throw e })
  }
  return landmarkerPromise
}

// ── geometry ────────────────────────────────────────────────────────────────
export function angle(a, b, c) {  // angle ABC in degrees
  const v1 = [a.x - b.x, a.y - b.y], v2 = [c.x - b.x, c.y - b.y]
  const d = Math.hypot(...v1) * Math.hypot(...v2)
  if (!d) return 0
  const cos = Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / d))
  return (Math.acos(cos) * 180) / Math.PI
}
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, visibility: Math.min(a.visibility ?? 1, b.visibility ?? 1) })
const legIdx = (side) => (side === 'right' ? [LM.rShoulder, LM.rHip, LM.rKnee, LM.rAnkle] : [LM.lShoulder, LM.lHip, LM.lKnee, LM.lAnkle])

// ── what the camera can measure, per exercise ───────────────────────────────
// metric(landmarks, side) -> number (degrees); `up`/`down` thresholds with a gap between
// them (hysteresis) so jitter near one threshold cannot double-count a rep.
// `dir: 'above'` means the working position is a large value; 'below' a small one.
export const TRACKING = {
  seated_knee_extension: {
    setup: 'Sit side-on to the camera so your whole leg is visible.',
    needs: (s) => legIdx(s).slice(1),
    metric: (lm, s) => { const [, h, k, a] = legIdx(s); return angle(lm[h], lm[k], lm[a]) },
    dir: 'above', up: 150, down: 115, low: 'Straighten the knee a little more',
  },
  straight_leg_raise: {
    setup: 'Lie side-on to the camera with your whole body in view.',
    needs: (s) => legIdx(s),
    metric: (lm, s) => { const [sh, h, , a] = legIdx(s); return angle(lm[sh], lm[h], lm[a]) },
    dir: 'below', up: 158, down: 170, low: 'Lift the straight leg a little higher',
  },
  bridge: {
    setup: 'Lie side-on to the camera, knees bent, whole body in view.',
    needs: (s) => legIdx(s).slice(0, 3),
    metric: (lm, s) => { const [sh, h, k] = legIdx(s); return angle(lm[sh], lm[h], lm[k]) },
    dir: 'above', up: 158, down: 140, low: 'Lift your hips a little higher',
  },
  standing_hip_extension: {
    setup: 'Stand side-on to the camera, holding a counter, whole body in view.',
    needs: (s) => legIdx(s),
    metric: (lm, s) => { const [sh, h, , a] = legIdx(s); return 180 - angle(lm[sh], lm[h], lm[a]) },
    dir: 'above', up: 14, down: 7, low: 'Take the leg back a little further, keep your back straight',
  },
  side_lying_leg_lift: {
    setup: 'Lie on your side facing the camera, whole body in view.',
    needs: () => [LM.lHip, LM.rHip, LM.lAnkle, LM.rAnkle],
    metric: (lm) => angle(lm[LM.lAnkle], mid(lm[LM.lHip], lm[LM.rHip]), lm[LM.rAnkle]),
    dir: 'above', up: 22, down: 10, low: 'Lift the top leg a little higher',
  },
}
export const canTrack = (slug) => Boolean(TRACKING[slug])

export function visible(lm, idxs, min = 0.5) {
  return idxs.every((i) => lm[i] && (lm[i].visibility ?? 1) >= min)
}

// ── rep counter ─────────────────────────────────────────────────────────────
// Feed it one metric value per frame with a timestamp (ms). A rep counts when the patient
// reaches the working position, holds it for holdMs, then returns to the start position.
export function createRepCounter({ dir, up, down, holdMs = 0 }) {
  const isUp = (v) => (dir === 'above' ? v >= up : v <= up)
  const isDown = (v) => (dir === 'above' ? v <= down : v >= down)
  let phase = 'down', since = 0, reps = 0, held = false
  return {
    get reps() { return reps },
    get phase() { return phase },
    update(v, t) {
      let event = null
      if (phase === 'down' && isUp(v)) { phase = 'up'; since = t; held = holdMs === 0; event = 'reached' }
      else if (phase === 'up') {
        // The hold only counts while they stay in the working position (5° of slack for jitter)
        const inHold = dir === 'above' ? v >= up - 5 : v <= up + 5
        if (!held && !inHold) since = t
        if (!held && inHold && t - since >= holdMs) { held = true; event = 'held' }
        if (isDown(v)) {
          if (held) { reps += 1; event = 'rep' } else event = 'early'
          phase = 'down'
        }
      }
      const holdLeft = phase === 'up' && !held ? Math.max(0, Math.ceil((holdMs - (t - since)) / 1000)) : 0
      return { reps, phase, event, holdLeft }
    },
    reset() { phase = 'down'; reps = 0; held = false },
  }
}

// Draw the skeleton over a mirrored video frame
export function drawSkeleton(ctx, lm, w, h, colour = '#3FE08F') {
  ctx.clearRect(0, 0, w, h)
  if (!lm) return
  ctx.lineWidth = Math.max(3, w / 160); ctx.strokeStyle = colour; ctx.fillStyle = '#fff'; ctx.lineCap = 'round'
  const P = (i) => [(1 - lm[i].x) * w, lm[i].y * h]  // mirrored to match the selfie view
  for (const [a, b] of SKELETON) {
    if ((lm[a].visibility ?? 1) < 0.4 || (lm[b].visibility ?? 1) < 0.4) continue
    ctx.beginPath(); ctx.moveTo(...P(a)); ctx.lineTo(...P(b)); ctx.stroke()
  }
  for (const i of [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) {
    if ((lm[i].visibility ?? 1) < 0.4) continue
    ctx.beginPath(); ctx.arc(...P(i), Math.max(3, w / 140), 0, Math.PI * 2); ctx.fill()
  }
}
