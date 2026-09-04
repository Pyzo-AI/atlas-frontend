# AGENTS.md — Atlas Frontend

Learner-facing web app for **Pyzo Atlas** (AI training coach). Users open a "presentation"
(module), watch a trainer video synced against a slide video, ask questions of a voice AI
agent, take assessments, and earn certificates. This repo is **frontend only** — all
business logic lives in the Atlas/Compass backend behind `NEXT_PUBLIC_API_BASE_URL`.

`package.json` still says `"name": "train-boost"`; TrainBoost is the old product name and
survives in storage keys and asset filenames. Don't "fix" it.

---

## 1. Stack, commands, conventions

- **Next.js 15.3 App Router**, **React 19**, JavaScript (`.jsx`) — *not* TypeScript.
  Only 3 files are TS (`utils/apiClient.ts`, `errorHandler.ts`, `toastService.ts`) and
  there is no `tsconfig.json`, only `jsconfig.json` with the `@/* → src/*` alias.
- **Tailwind CSS v4** (`@import "tailwindcss"` + `@theme` tokens in `globals.css`). No
  `tailwind.config.js` — do not add one.
- **Redux Toolkit + RTK Query** for all state and server data.
- **Prettier**: 120 cols, double quotes, semicolons, `bracketSameLine: true`.
- **ESLint**: `next/core-web-vitals` only. `npm run lint` is not wired into CI.
- Scripts: `npm run dev` (turbopack), `npm run dev:local` (port 3002, webpack — use this
  when a locally linked `@esmagico/pyzo-auth-sdk` must resolve), `npm run build`, `npm start`.
- **There are no tests of any kind** and no test runner. Do not add a test suite as part
  of an unrelated change.

---

## 2. Directory map

```
src/
  app/[locale]/            every route is locale-prefixed
    page.js                → components/pages/Home
    lectures/[id]/page.jsx the whole learning experience (688 lines, 3 layouts)
    certificates/page.jsx
    analytics/page.jsx
    login/page.jsx         thin wrapper over <PyzoLoginScreen> from the auth SDK
    api/hls/route.js       HLS manifest proxy (see §7)
    layout.js              provider pyramid + fonts + metadata
  middleware.js            locale detection / redirect
  components/
    VideoPlayer.jsx        2194 lines. video.js wrapper. THE most fragile file here.
    VideoPlayerContainer.jsx  progress/telemetry/seek-guard layer over VideoPlayer
    auth/PrivateRoute.jsx  client-side auth gate + cross-tab session sync
    layout/                Header, Sidebar, LayoutWrapper, ResponsiveContainer
    sections/              VideoPanel, PPTSection, SlideVideoSection, VideoPlaylist,
                           InModuleAssessment, ChatUI, QuestionModeAI/User,
                           AILearningAssistant, PortraitLectureView, ProductRecommendationGallery
    modals/ common/ ui/ providers/
  store/
    api/                   6 RTK Query slices, all on one shared baseQuery
    features/              video, resultModal, feedbackModal, image, notifications, organization
    utils/token.js         token read + JWT payload decode
  lib/livekit.js           LiveKitService singleton (voice agent transport)
  services/notificationService.js  socket.io singleton
  hooks/ utils/ config/ i18n/ providers/ styles/ assets/
```

---

## 3. Routing and i18n — the most common source of bugs

Locales are `["en", "de"]`, default `en`. `middleware.js` redirects any un-prefixed path
to `/{locale}{path}`, honours `?lang=`/`?language=`, and persists the choice in the
`NEXT_LOCALE` cookie. Its matcher skips `api`, `_next/*`, `assets`, `admin`, and anything
containing a dot.

**Therefore `usePathname()` always returns a locale-prefixed path** (`/en/lectures/12`).

- Navigate with **`useLocalizedRouter()`** (`hooks/useLocalizedRouter.js`), never raw
  `useRouter().push`. It prefixes the locale for you. `localizePath()` is exposed for
  `<Link href>`.
- Match routes with `pathname.includes("/lectures/")`, or strip the locale first
  (`Sidebar.isActive` does `pathname.replace(/^\/[a-z]{2}(\/|$)/, "/")`).
  `pathname.startsWith("/lectures")` is **always false** — `Header.jsx:115` already has
  this bug; don't copy it.
- Translations: `useTranslation()` + `t("section.key")`. `i18n/locales/en.json` and
  `de.json` are at **exact key parity (226 keys)**. Any new key must land in both files,
  or German users get a raw key string. `TranslationProvider` creates a fresh i18next
  instance per render tree from the `[locale]` route param.
- Plenty of older components still contain hardcoded English (all of the role-play UI in
  `InModuleAssessment.jsx`, several toasts). That is technical debt, not a convention.

---

## 4. Auth

All auth is delegated to **`@esmagico/pyzo-auth-sdk`** (private GitHub package; needs
`NPM_TOKEN` to install). Product name string is `"atlas"`; Keycloak is the IdP.

- `PrivateRoute` wraps the entire app inside `layout.js`. On every path change it reads
  tokens, calls `refreshSession()` to pick up fresh permissions, then
  `hasProductAccess(token, "atlas")`. No access → `<AccessDeniedScreen>`; no token →
  redirect to `/login?redirect=…`. `/login` bypasses the gate.
- `usePyzoSessionSync` handles cross-tab login/logout/user-change against a shared
  `*.pyzo.ai` session cookie. On **`onUserChange` it clears user-scoped localStorage keys
  and hard-reloads** — this exists because none of that browser state is keyed by user.
  The list is `USER_SCOPED_STORAGE_KEYS` in `PrivateRoute.jsx`. **Any new
  per-learner localStorage key must be added there** or the next account inherits it.
  (`feedbackModalState` is currently missing from that list.)
- `utils/auth.js` owns `logout()` (tracks `session_end` in PostHog, then SDK logout →
  Keycloak revoke) and token refresh with a 30s expiry buffer.
- `store/utils/token.js` → `getTokens()`, `getUserDetailsFromToken()` (decodes the JWT
  payload; `sub`, `preferred_username`, `email`, `name`, `roles`). Always browser-only.

---

## 5. Data layer

Six RTK Query slices in `store/api/`, all sharing `baseQueryWithReauthAndRetry` from
`baseQuery.js` (SDK-provided `createPyzoBaseQuery` — injects auth headers, retries on 401,
logs out on refresh failure, treats `/login` as public).

| Slice | Endpoints |
|---|---|
| `questionsApi` | presentations list, `presentations/{id}/slides`, quiz, learner activities (video progress), assessment start/submit, assessment summary, feedback, QA, conversation history, interview link, submission results |
| `analyticsApi` | `api/users/analytics/presentations`, `…/assessments` (both **POST**) |
| `certificatesApi` | certificates list (**POST via `builder.mutation`**), generate certificate, user metadata |
| `liveKitApi` | `presentations/session`, `session/`, chatbot conversations |
| `notificationApi` | list + mark-as-read, with `Notification` tag invalidation |
| `organizationsApi` | `/api/organizations/config` — the feature-flag payload |

Notes that matter when adding endpoints:
- Only `questionsApi` and `notificationApi` use `tagTypes`. `questionsApi` has a single
  coarse `"Question"` tag — invalidating it refetches slides, quiz, assessments and
  summary together. `InModuleAssessment` deliberately fires
  `questionsApi.util.invalidateTags(["Question"])` on tab-visibility change to refresh
  role-play `in_progress`.
- Registering a new API slice requires **three** edits in `store/index.js`: reducer,
  `middleware.concat`, and the import. Miss one and you get a runtime store error.
- Errors surface through **`getApiErrorMessage(error, fallback)`** from
  `utils/errorHandler.ts` fed into `toast.error(...)`. Use it — it already walks the
  four backend error shapes plus fetch/parse errors.
  `store/utils/apiErrorHandler.js` is an older, unused duplicate; don't extend it.
- `utils/apiClient.ts` (+ its `NEXT_PUBLIC_API_URL`), `utils/deviceDetection.js` and
  `hooks/useFullscreenOnLandscape.js` are **dead code**. Nothing imports them.

---

## 6. `videoSlice` — the lecture state machine

`store/features/videoSlice.js` is shared mutable state across ~10 components, and most
regressions in this repo come from writing to it out of order. Fields worth knowing:

- `currentVideoIndex` — trainer/primary video index. **Index into `data.data`, not a
  slide number.** `slide` is the server-side slide id and they are not interchangeable.
- `pptVideoIndex` — slide-side index. Diverges from `currentVideoIndex` while the user
  browses the playlist; `syncPptToVideoPanel()` snaps it back when playback starts.
- `currentVideoTime`, `isVideoPlaying`, `autoPlayEnabled` — playback.
- `isQuestionMode` — voice agent session is live. Blanks the video/assistant UI, blocks
  clicks on the slide, and disconnects on exit.
- `showChat` — chat panel open.
- `selectedAssessmentId` — non-null ⇒ `SlideVideoSection` renders `InModuleAssessment`
  **in place of the slide video**, and `VideoPanel` blurs/pauses. Clearing it resumes.
- `slideNumbers`, `productRecommendations` — pushed from LiveKit data packets.
- `answerPptIndex` — slide override while replaying an answer.
- `completedAssessmentIds`, `isUserMuted`, `isAgentVoiceMuted`.

Everything here is **in-memory only** and reset on reload. Cross-reload persistence uses
localStorage: `video_progress`, `assessmentProgress`, `resultModalState`,
`feedbackModalState`, `trainboost_conversation_history`.

---

## 7. The lecture page — three layouts, one component tree

`app/[locale]/lectures/[id]/page.jsx` fetches `presentations/{id}/slides` once
(`useGetAllVideoQuery`) and derives the whole configuration from that response:

`is_skippable` → `canSkipVideo` · `assessment_details[0].id` → final assessment ·
`assessment_details[0].passing_score` (default 100) · `interaction_mode ===
"pyzo_train_convo_ai"` → `liveKitAgentEnabled` · `presentation_query` →
`showQueryRelatedSlides` · `enable_product_recommendations` ·
`trainer_video === null` → `isOnlyVideoMode` · `current_slide_number` /
`current_slide_duration` → resume point.

It then branches on viewport into **three** renderings that must all keep working:

1. **portrait mobile/tablet** (`isPortrait && width ≤ 1024`) → `PortraitLectureView`
   (draggable PiP VideoPanel, inline ChatUI, `hideChatUI`/`hideAIAssistant` flags).
2. **landscape phone/tablet** (`width ≤ 1024`) → `FullscreenController` + 70/30 split,
   body scroll locked, height driven by `--app-height`.
3. **desktop** → 70/30 `PPTSection` + `VideoPanel`.

The non-portrait desktop/landscape tree:

```
PPTSection (70%) ── SlideVideoSection ── VideoPlayer          (muted slide video)
                 │                    └─ InModuleAssessment  (when selectedAssessmentId)
                 └─ VideoPlaylist
VideoPanel (30%) ── VideoPlayerContainer ── VideoPlayer       (trainer video, audible)
                 ├─ AILearningAssistant / QuestionModeAI / QuestionModeUser
                 └─ ChatUI
```

**Video↔slide sync contract.** `VideoPanel` reports `{currentTime, isPlaying,
currentVideoIndex, duration}` upward via `onVideoStateChange`; the page mirrors it into
`pptSyncState` and passes it down to `PPTSection` → `SlideVideoSection`, which seeks the
slide video **only** on a master jump > 1.0s or a drift > 10.0s. That threshold is
deliberate: every manual seek flushes the MSE buffer, so tightening it causes visible
stalling. Pausing flows the other way through imperative refs
(`videoPanelRef.pauseVideo()`, `pptSectionRef.pauseSlideVideo()`).

`useAppHeight()` maintains `--app-height` from `visualViewport` because iOS Safari lies
about `vh`/`dvh`/`100%` after the mic dialog appears. Mobile layouts size off
`var(--app-height, 100dvh)`, never `vh`.

The lecture page also monkey-patches `router.push/back/replace` and listens on
`beforeunload`/`pagehide`/`unload`/`visibilitychange`/`popstate` plus a 5-minute interval,
all to flush buffered progress via `submitVideoProgress`. It is redundant on purpose
(browsers fire different subsets); each handler must stay idempotent.

---

## 8. Video playback (`VideoPlayer.jsx`)

A video.js wrapper carrying every browser workaround the product has accumulated. Read
before touching:

- **HLS auth.** Streams are AES-encrypted HLS. Desktop/iPad go through **VHS with
  `overrideNative: true`** and an XHR hook that appends `?token=` **to key requests only**.
  iPhone/iPod cannot use MSE, so they use native HLS via the
  `/api/hls?url=…&token=…` proxy, which rewrites `EXT-X-KEY` URIs, absolutises segment
  URLs and re-proxies nested playlists. Platform detection lives in `isSafari`,
  `isIPhoneOrIPod`, `isIPad`, `hasMSESupport`, `needsNativeHLS` — narrow, ugly, and load-bearing.
  ⚠️ The route file is at `app/[locale]/api/hls/route.js`, so it serves `/{locale}/api/hls`,
  while the player requests `/api/hls`. Verify against a real iPhone before assuming
  either path is correct.
- **`canSkipVideo === false`** (forward-seek lock) is enforced in **five independent
  places**: the video.js `seeking` handler restores `previousTime`; the progress control
  is hidden behind a `.no-seek` overlay with capture-phase event blockers; keyboard
  shortcuts are filtered (J still skips back); a native `seeking`/`seeked` listener guards
  iOS Safari; and `VideoPlayerContainer.handleSeeking` re-clamps. Removing any one of them
  reopens a way for learners to skip mandatory content. Test with `is_skippable: false`.
- **The initialisation effect depends only on `[src, isClient]`** but closes over
  `canSkipVideo`, `controls`, `autoPlay`, `showRemainingDuration` and more. Changing one of
  those props without changing `src` will not re-run it. Callers work around this by
  remounting with a `key` (`key={`trainer-video-${index}-${src}`}`). Do not "fix" the
  dependency array without checking every mount site — a full re-init disposes the player
  and restarts playback.
- Roughly 1500 lines of injected `<style jsx global>` CSS retheme the video.js control bar
  per breakpoint. Changes here are visual-regression-prone across desktop / landscape /
  portrait.
- Seek-into-the-future is reported to PostHog as `video_skip`; backward skips arrive
  through the explicit `onSkipBackward` callback and are excluded from that event.

Resume-position handling is **currently disabled on purpose**: three sites compute a
`startTime` from `duration_viewed` and then hardcode `0` with the comment
*"as quick fix it is set to 0 sec upper commented code is correct one"*
(`lectures/[id]/page.jsx`, `VideoPanel.handleVideoEnd`, the index-change effect). Treat
that as intentional until product says otherwise.

---

## 9. Assessments

Two kinds, distinguished only by where the id came from:
- **Middle / slide assessment** — `videos[i].slide_assessments[0].id`. Fires when that
  slide's video ends. On submit: no result modal, `selectedAssessmentId → null`,
  `autoPlayEnabled → true`, advance to the next video.
- **Final assessment** — `data.assessment_details[0].id`. Fires after the last video.
  On submit: fetch `getAssessmentSummary`, then show `ResultModal` with the summary
  numbers (not the raw submit response), gated on `passingScore`.

`isFinalAssessment` is computed as `assessmentDetails.some(a => a.id === selectedAssessmentId)`.
Both branches call `markAssessmentCompleted` (Redux) **and** `setAssessmentCompleted`
(localStorage, keyed by presentation) — `VideoPlaylist` reads the localStorage copy to grey
out completed items before the server catches up. Keep both writes together.

**Role-play assessments** (`type: ROLE_PLAY`) are a separate branch: they must *not*
auto-`/start` on mount (`shouldSkipAutoStart`), require an explicit confirmation modal,
open `interview_link` in a new tab, and lock for 30 minutes while `in_progress` is true.
Returning to the tab invalidates the `Question` tag to refresh that flag.

If a module has no assessment at all, `VideoPanel`/`SlideVideoSection` show a synthetic
`ResultModal` with `score={100} passingScore={0} isNoAssessmentModule`.

`components/providers/ResultModalProvider` only renders on paths containing
`/assessment/`, and no such route exists — that global modal is effectively dead.

---

## 10. The AI agent — two mutually exclusive transports

`liveKitAgentEnabled` (from `interaction_mode`) selects one of two stacks inside
`VideoPanel`. Both must keep working:

- **ElevenLabs** (`useConversation` from `@elevenlabs/react`) — legacy path. Manages its
  own mic, replays conversation context via `sendContextualUpdate`, and drives
  `QuestionModeUser`.
- **LiveKit** (`lib/livekit.js` singleton `liveKitService`) — current path. `createSession`
  returns `{livekit_url, token, room_name}`; the service connects, publishes mic, attaches
  agent audio elements to `document.body`, and tracks agent state
  (`idle`/`listening`/`thinking`/`speaking`) from `ActiveSpeakersChanged`.

**LiveKit data-channel packet contract** — parsed in `livekit.js` and again in
`VideoPanel`/`FloatingChatbot`. A new packet type must be handled in every consumer or it
is silently dropped:

| `type` | Effect |
|---|---|
| `agent_state` | sets agent state (a late `listening` never overrides `thinking`) |
| `slide_redirect` + `slide_number` | pauses video, `setCurrentVideoIndex` to the matching slide |
| `product_recommendations` | `setProductRecommendations` (shown only if `enable_product_recommendations`) |
| `user_response` / `agent_response` | appended to `liveMessages` for ChatUI |
| `status` + `message: "call_ending"` | disconnect, exit question mode; `reason: "limit_reached"` toasts |
| bare `slide_number` | referenced-slide overlay |

`liveKitService` is a **module singleton**, so `VideoPanel` and `FloatingChatbot` share one
room. Whoever mounts last wins the `setOnDataReceived` / `onConnectionStateChanged`
callbacks, and both unmount paths call `disconnect()`. Never leave a mounted consumer
without a disconnect in its cleanup.

Conversation history: ElevenLabs turns persist to `trainboost_conversation_history`
(capped at `MAX_HISTORY_MESSAGES = 50`, expired after 7 days, last 10 replayed as context —
see `config/conversationConfig.js`). LiveKit history is server-side and paginated in
`ChatUI` with manual scroll-height restoration — that scroll logic is delicate.

---

## 11. Notifications

`services/notificationService.js` is a socket.io singleton with **reference counting**
(`connectionCount`) against `${NEXT_PUBLIC_API_BASE_URL}/notifications`, token passed in
both `auth` and `query`. `hooks/useNotifications(token)` subscribes, refetches page 1 on
every (re)connect to backfill missed items, mirrors into `notificationsSlice`, and raises
a native `Notification` when permitted. Mounted once, from `Header`. Mounting a second
consumer without matching `connect`/`disconnect` calls will tear the socket down for the
first.

---

## 12. Organization feature flags

`Header` fetches `/api/organizations/config` (skipped until a token exists);
`organizationSlice` mirrors the result into the store via `extraReducers` matchers so other
components can read it without refetching. Consumers use **negated flags**:

`disable_sidebar` · `disable_logo` · `disable_notification` · `disable_course_search` ·
`disable_course_filters` · `disable_course_header_row` · `disable_no_course_found`

Absent config ⇒ everything enabled. Read them as `orgConfig?.disable_x`, never assume the
object exists. `LayoutWrapper` and `Sidebar` read from the slice; `Header` reads the query
result directly.

---

## 13. PostHog analytics

`utils/posthog.js` initialises at import time (browser only, `person_profiles:
"identified_only"`); `hooks/usePostHog()` gives `capture`/`identify`/`reset`.
`PrivateRoute` identifies the user on load.

Existing event names — reuse rather than inventing near-duplicates:
`module_start`, `slide_view`, `video_play`, `video_pause`, `video_complete`, `video_skip`,
`video_skip_backward`, `video_speed_change`, `qna_interaction`, `slide_redirect`,
`assessment_start`, `assessment_submit`, `session_end`, `session_timeout`.
Convention: include `user_id` (JWT `sub`), `module_id`, and an ISO `timestamp`. **Never put
tokens, emails or free-text answers into event properties.**

---

## 14. Styling

Design tokens are Tailwind v4 `@theme` custom properties in
`app/[locale]/globals.css` — `--color-primary` (#2762ea), `--color-accent` (currently the
purple set; the blue set is commented out just above it), `--color-page-background`,
status colours, text scale, `--color-border-light`, gradients. Use the token utilities
(`bg-page-background`, `text-primary-text`, `border-border-light`) rather than new hex
literals; a good deal of the existing code ignores this rule.
`styles/fullscreen.css` covers fullscreen/landscape. Fonts: Lato (default), Montserrat,
Geist via `next/font`.

---

## 15. Build, deploy, environment

- `next.config.js` sets `output: "standalone"`, wildcard `images.remotePatterns`, and a
  webpack fallback stubbing `fs`/`path`/`child_process` plus a `node:` prefix rewrite for
  posthog-js. **A second config, `next.config.mjs`, also exists** (`transpilePackages`
  for the auth SDK, `instrumentationHook`). Next resolves `next.config.js` first, so the
  `.mjs` file is very likely inert — confirm which one is live before editing either.
- Dockerfile: multi-stage node:20-alpine, standalone output, non-root `nextjs` user, port
  3000. `NPM_TOKEN` is mounted as a build secret to reach the private
  `@esmagico` registry. The build **hard-fails** if any of the seven `NEXT_PUBLIC_*` build
  args is missing — adding a new build-time env var means editing `Dockerfile` (ARG + ENV
  in both `builder` and `runner`, plus the validation loop) and `docker-compose.yaml`.
- `package-lock.json` is **gitignored**, so `npm ci` never runs; the image builds with
  `npm install`. A `package.json` range bump therefore reaches production unpinned.
- CI (`.github/workflows/BuildAndPush.yaml`) runs **only** on release publish or manual
  dispatch: build → push to GHCR → `sed` the image tag into `Pyzo-AI/pyzo-k8s`. It runs
  no install, lint, typecheck, build or test on pull requests. **PR review is the only
  gate before merge.** Default branch is `dev`; `prod` is the release branch.
- Env vars, all `NEXT_PUBLIC_*` (client-visible): `API_BASE_URL`, `LOGIN_BASE_URL`,
  `KEYCLOAK_BASE_URL`, `KEYCLOAK_REALM`, `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`,
  `REDIRECT_URI`, `POSTHOG_KEY`, `POSTHOG_HOST`. `NEXT_PUBLIC_API_URL` and
  `NEXT_PUBLIC_ELEVENLABS_API_KEY` appear only in dead/commented code.

---

## 16. Landmines

1. `pathname` carries the locale prefix — `startsWith("/route")` never matches
   (`Header.jsx:115`).
2. A new locale key added to `en.json` only will render as a raw key in German.
3. New per-user localStorage key ⇒ add it to `USER_SCOPED_STORAGE_KEYS` in `PrivateRoute`.
4. `currentVideoIndex` (array index) vs `slide` (server id) — never swap them.
5. The `VideoPlayer` init effect only re-runs on `src` change; props are captured.
6. Forward-seek locking is enforced in five places; partial edits reopen skipping.
7. `liveKitService` and `notificationService` are singletons — callbacks are
   last-writer-wins and cleanup is mandatory.
8. New RTK Query slice ⇒ three edits in `store/index.js`.
9. Coarse `"Question"` tag: one invalidation refetches slides + quiz + assessments.
10. New LiveKit packet type ⇒ handle it in `livekit.js` **and** every consumer.
11. `--app-height` exists because iOS `vh` is wrong; don't replace it with `vh`/`dvh`.
12. Slide-sync thresholds (1.0s jump / 10.0s drift) protect the MSE buffer.
13. Three lecture layouts (portrait / landscape / desktop) must be checked together.
14. Adding a `NEXT_PUBLIC_*` var means Dockerfile + compose edits or the image build fails.
15. `KEYCLOAK_CLIENT_SECRET` is shipped to the browser as a `NEXT_PUBLIC_*` var. This is
    pre-existing; flag only if a change widens the exposure.
16. `/api/hls` is an unauthenticated server-side fetch of an arbitrary `url` param
    (SSRF-shaped). Pre-existing; flag only if a change extends it.
17. ~154 `console.log`/`console.warn` calls exist, many logging tokens' presence, UAs and
    payload shapes. Don't add ones that print token values or PII.
