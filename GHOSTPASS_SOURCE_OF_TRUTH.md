# GhostPass Single Source of Truth + AI Build Contract

**Solana Mobile Track Hackathon | Version 1.0**

## Purpose

This document is the canonical product, technical, build, debugging, and judging specification for GhostPass. Feed this file to every AI agent and teammate so all work follows the same goal, same MVP scope, and same verification process.

## Top-Level Decisions

| Decision | Final Direction |
|---|---|
| Product category | Location-locked secret experience platform, not only a confession app. |
| Core loop | Create a GhostPass -> hide it at a GPS location -> user unlocks nearby with Solana wallet -> secret reveal -> proof badge. |
| Build priority | Working APK and polished demo first; production decentralization second. |
| Blockchain approach | Solana devnet + Mobile Wallet Adapter + Memo transactions for creation/unlock proofs. |
| Demo fallback | Required. App must still demonstrate flow if wallet, GPS, or devnet fails. |
| Scope guardrail | No major AR, push notifications, custom Solana program, or production encryption unless core MVP is already working. |

**Hand this document to Claude Code, ChatGPT, Cursor, Windsurf, or any other agent before asking them to build, review, debug, or pitch the app.**

---

## 1. Hackathon Requirements This Spec Must Satisfy

The app must be a functional Android APK that meaningfully interacts with Solana, integrates the Solana Mobile tech stack, and uses Mobile Wallet Adapter for wallet signing when wallet signing is used. The project also needs a GitHub repo, demo video/presentation, and concise written explanation. Submission materials must include open-source code, short summary, full description, technical description, Canva slides, README, screenshots, demo video, and an explanation of blockchain interaction.

| Requirement Area | GhostPass Compliance Plan |
|---|---|
| Android APK | Build React Native/Expo or Solana Mobile template app for Android; produce APK for submission. |
| Solana interaction | Create and unlock GhostPasses through Solana devnet Memo transactions. Store transaction signatures in the app. |
| Mobile Wallet Adapter | Use Solana Mobile Wallet Adapter-compatible flow for wallet connection/signing where feasible. |
| Mobile-native features | GPS-based distance gate; optional camera-style reveal overlay; QR only if core flow is already stable. |
| Presentation criteria | Design for a 30-second demo: create, discover, location-gate, wallet sign, secret reveal, proof badge. |
| README/submission | Include setup, architecture, screenshots, demo video, blockchain explanation, known limitations, and roadmap. |

---

## 2. Product Definition

**Product name:** GhostPass

**One-sentence pitch:** GhostPass turns the physical world into a programmable layer for temporary secret experiences - invites, confessions, art drops, scavenger hunts, community notes, and proof-of-presence badges unlocked through Solana Mobile.

**Plain-language description:** Creators leave temporary digital secrets at real-world GPS locations. Explorers physically go near the location, connect their Solana wallet, sign an unlock proof, and reveal the secret before it expires.

**Critical positioning rule:** GhostPass is not a confession-only app. Confession is one emotionally memorable use case inside a broader location-locked secret experience platform.

| GhostPass Type | Use Case | Example Secret Reveal |
|---|---|---|
| Secret Invite | Private event or afterparty unlock | You found the rooftop invite. Entry phrase: “Ghost Builder.” |
| Confession | Anonymous or creator-authored local message | Someone here almost gave up today - but shipped anyway. |
| Treasure Clue | Geocache/scavenger hunt clue | Next clue: look for the blue mural near the east exit. |
| Art Drop | Hidden poem, image, music, AR-style reveal | Unlock a hidden digital poster/song/poem tied to a physical place. |
| Community Note | Secret signal for a group or fandom | Builders nearby: meet at table 7 at 8 PM. |
| Event Badge | Proof-of-presence collectible | You were there for the EasyA Builder Drop. |

---

## 3. Winning Strategy

- **Novel but simple:** The concept should feel magical, but the implemented loop must be very small and reliable.
- **Mobile-first:** GPS and physical presence are core, not decorative.
- **Beginner-friendly:** Users should not need to understand crypto to understand the experience.
- **Meaningful Solana use:** Solana provides ownership/proof/scarcity/unlock events, not just a logo.
- **Demo resilience:** Judging conditions are unpredictable; demo mode is mandatory.
- **Emotional hook:** The confession/secret reveal mechanic makes the app memorable; the type selector proves the broader platform potential.

---

## 4. Non-Negotiable MVP Scope

| Feature | MVP Decision | Reason |
|---|---|---|
| Wallet connect/signing | Must have | Required by track and central to proof of unlock. |
| GPS location gate | Must have | Makes the app mobile-native and distinct. |
| Create GhostPass form | Must have | Needed to prove creator-side flow. |
| Type selector | Must have | Prevents the app from becoming confession-only. |
| Nearby feed | Must have | Easier than map and enough for demo. |
| Unlock flow | Must have | Core user value. |
| Secret reveal screen | Must have | Emotional/demo moment. |
| Proof badge/passport | Must have | Shows post-unlock value and proof-of-being-there. |
| Solana Memo transactions | Must have if feasible | Fastest meaningful on-chain implementation. |
| Demo fallback mode | Must have | Protects demo from wallet/GPS/devnet failures. |
| Real ARCore | Cut | Too risky for today; use camera-style visual overlay if time allows. |
| Push notifications | Cut | Not needed to win MVP. |
| Custom Solana program | Cut | Too slow/risky for same-day build. |
| Production encryption | Cut or simulated | Use content hashes/proofs; do not overclaim. |
| Monetization | Roadmap only | Not needed for judging demo. |

---

## 5. Core User Flows

### 5.1 Creator Flow

1. Open GhostPass.
2. Connect Solana wallet.
3. Tap Create GhostPass.
4. Choose type: Secret Invite, Confession, Treasure Clue, Art Drop, Community Note, or Event Badge.
5. Enter title, clue/teaser, secret reveal text, expiration, max unlocks, and location.
6. Sign creation transaction.
7. App stores metadata locally and records a Solana devnet proof transaction.
8. Created GhostPass appears in the feed with countdown and remaining unlocks.

### 5.2 Explorer Flow

1. Open nearby GhostPass feed.
2. Select a GhostPass with teaser, distance, type, expiration, and unlock count.
3. App checks current GPS distance against unlock radius.
4. If too far, show distance gate and hint.
5. If near enough, enable unlock button.
6. User signs unlock transaction.
7. App records unlock proof and reveals secret content.
8. User receives Proof-of-Being-There badge in passport/profile.

---

## 6. Screens and UI Requirements

| Screen | Purpose | Required Elements |
|---|---|---|
| Landing / Connect | Introduce app and connect wallet | Pitch line, Connect Wallet button, Demo Mode button. |
| Feed | Show available GhostPasses | Type, title, clue, distance, expiration, unlocks left, status. |
| Create | Creator makes a pass | Type selector, title, clue, secret reveal, radius, expiration, max unlocks, create/sign button. |
| Detail / Distance Gate | Prepare unlock | Distance, countdown, clue, disabled/enabled unlock button, reason if locked. |
| Secret Reveal | Reward moment | Animated reveal, secret content, transaction signature, badge prompt. |
| Passport | Post-unlock proof | Badges with pass type, title, date, shortened wallet/signature. |
| Demo Tools | Fallback for judging | Seed demo data, simulate near location, simulate wallet/devnet if necessary, clearly labeled. |

---

## 7. Technical Architecture

| Layer | Preferred Choice | Notes |
|---|---|---|
| App framework | React Native / Expo or official Solana Mobile React Native template | Use the fastest path that supports Android APK and Mobile Wallet Adapter. |
| Blockchain network | Solana devnet | Avoid mainnet risk during hackathon. |
| Wallet | Solana Mobile Wallet Adapter-compatible integration | Required for wallet signing if feasible. Provide honest fallback if blocked. |
| On-chain proof | Solana Memo Program | Use memo transactions for create/unlock records. |
| Data storage | Local storage / AsyncStorage / simple JSON | Acceptable for demo; production can use decentralized/encrypted storage. |
| Location | Device GPS permission + haversine distance calculation | Gate unlock based on radius. Include demo override. |
| Reveal visual | Camera-style overlay or animated reveal | Do not attempt full AR unless MVP is finished. |
| QR | Optional stretch | Helpful but not required for the core demo. |

---

## 8. Data Model

```ts
type GhostPass = {
  id: string;
  type: 'Secret Invite' | 'Confession' | 'Treasure Clue' | 'Art Drop' | 'Community Note' | 'Event Badge';
  title: string;
  clue: string;
  secretReveal: string;        // Off-chain/local only for MVP
  creatorWallet: string;
  latitude: number;            // Local/off-chain only; avoid exact private coords on-chain
  longitude: number;           // Local/off-chain only; avoid exact private coords on-chain
  locationHash: string;        // Approximate location label/geohash for on-chain memo
  radiusMeters: number;
  expiresAt: string;           // ISO timestamp
  maxUnlocks: number;
  unlockCount: number;
  contentHash: string;
  createTxSignature?: string;
  unlockTxSignatures: string[];
  createdAt: string;
};

type ProofBadge = {
  id: string;
  passId: string;
  passType: GhostPass['type'];
  title: string;
  unlockedAt: string;
  wallet: string;
  unlockTxSignature?: string;
};
```

---

## 9. Solana Memo Payloads

**Rule:** Do not put private confession text, exact sensitive GPS coordinates, or secret content directly on-chain. Put proof metadata and hashes on-chain; reveal content inside the app after unlock conditions pass.

```json
// Creation memo
{
  "type": "GHOSTPASS_CREATE",
  "passId": "gp_unique_id",
  "ghostPassType": "Secret Invite | Confession | Treasure Clue | Art Drop | Community Note | Event Badge",
  "title": "Short public title",
  "locationHash": "approx_location_or_geohash",
  "expiresAt": "ISO timestamp",
  "maxUnlocks": 20,
  "contentHash": "hash_of_secret_content"
}

// Unlock memo
{
  "type": "GHOSTPASS_UNLOCK",
  "passId": "gp_unique_id",
  "wallet": "wallet_public_key",
  "timestamp": "ISO timestamp"
}
```

---

## 10. Privacy, Safety, and Honesty Constraints

- Do not claim secrets truly self-destruct from the internet. Say the pass expires in the app and access window closes.
- Do not claim GPS is fraud-proof. Say GPS is a mobile-native proximity gate for the MVP.
- Do not store private confession text directly on-chain.
- Do not store exact private GPS coordinates on-chain unless there is a strong reason; use approximate location hash or label.
- Do not claim full decentralization if content is stored locally/off-chain.
- For production roadmap, mention encrypted storage, device attestation, anti-spoofing, and creator controls.

---

## 11. Local Environment Checklist for AI Builder

| Tool | Status to Check | Why Needed |
|---|---|---|
| Git | `git --version` | Version control and GitHub submission. |
| Node.js LTS | `node -v` | React Native/Expo tooling. |
| Package manager | `npm -v` / `yarn -v` / `pnpm -v` | Install app dependencies. |
| Java JDK | `java -version` | Android build dependency. |
| Android Studio | Installed and SDK configured | Emulator, SDK, APK build. |
| Android SDK/platform tools | `adb version` | Run/debug Android app. |
| Android emulator/device | `adb devices` | Test APK. |
| Expo tooling | `npx expo --version` or project-specific | Fast app build path if using Expo. |
| Solana CLI | `solana --version` (optional) | Useful for devnet checks; not always required. |
| MWA-compatible wallet/fake wallet | Installed on emulator/device if possible | Wallet signing tests. |

---

## 12. Step-by-Step Build Plan with Gates

| Phase | Goal | Completion Gate |
|---|---|---|
| 0. Environment | Inspect Mac setup and install/identify missing tools | AI reports installed/missing tools and exact next commands. |
| 1. Project boots | Create app project and run Android shell | Android app opens without crash. |
| 2. Navigation | Create screen structure | All screens reachable from app. |
| 3. Wallet | Connect wallet/display public key | Wallet public key or honest fallback appears. |
| 4. Local create | Create GhostPass locally | New pass appears in feed with correct type. |
| 5. GPS gate | Location permission and distance check | Unlock only enables within radius or demo override. |
| 6. Create proof | Send Solana create memo | Create transaction signature stored/displayed. |
| 7. Unlock proof | Send Solana unlock memo | Unlock transaction signature stored/displayed. |
| 8. Reveal | Display secret reveal after unlock | Reveal works for at least Confession and Secret Invite/Treasure Clue examples. |
| 9. Passport | Show proof badges | Badge appears after unlock. |
| 10. Demo fallback | Seed demo and bypass fragile dependencies | Judges can see flow even if wallet/GPS/devnet fails. |
| 11. Submission assets | README/screenshots/demo script | Repo explains setup, Solana use, limitations, and demo. |

---

## 13. Continuous Debugging and Self-Check Rubric

Every AI agent must run this checklist after every phase and before expanding scope. If any answer is no, the agent must fix or explicitly flag the issue before moving forward.

1. Does the app still build?
2. Does the Android app still open?
3. Does navigation still work?
4. Does the new feature work without crashing?
5. Did any previous feature break?
6. Is the user flow still demoable in 30 seconds?
7. Is the app still a broad secret-experience platform, not only confessions?
8. Is Confession still present as one strong use case?
9. Are Secret Invite, Treasure Clue, Art Drop, Community Note, and Event Badge still represented?
10. Is Solana used meaningfully, not decoratively?
11. Is Mobile Wallet Adapter integrated or honestly marked as a current blocker?
12. Is private content kept off-chain?
13. Is exact/sensitive GPS information avoided on-chain?
14. Is there a demo fallback if wallet, GPS, or devnet fails?
15. Have unnecessary features been avoided?
16. Can this phase be explained clearly to judges?

---

## 14. Agent Collaboration Model

| Agent Role | Primary Responsibility | Must Not Do |
|---|---|---|
| Claude Code / Main Builder | Create repo, implement app, run commands, debug build errors. | Must not expand scope or skip phase gates. |
| ChatGPT / Product-Judge Reviewer | Check product clarity, judging alignment, pitch, README, and architecture decisions. | Must not suggest features that risk the MVP unless marked stretch. |
| Cursor/Windsurf / Code Reviewer | Inspect repo, catch broken imports, type errors, UI wiring issues. | Must not rewrite architecture unless asked. |
| Presentation Agent | Create Canva outline, demo script, submission text. | Must not change product positioning away from this spec. |
| QA Agent | Run self-check rubric and generate bug list. | Must not add code before identifying failing gates. |

---

## 15. Master Prompt for Main Coding AI

Paste this into Claude Code or the primary coding agent after uploading this document.

```text
You are the lead AI software engineer for GhostPass.

Use the uploaded GhostPass Single Source of Truth as the source of truth. Do not expand scope unless explicitly approved.

Build a functional Android MVP for the Solana Mobile Track. The core loop is:
Create a GhostPass -> hide it at a GPS location -> user unlocks nearby with Solana wallet -> secret reveal -> proof-of-being-there badge.

GhostPass is a location-locked secret experience platform, not only a confession app. Include a type selector: Secret Invite, Confession, Treasure Clue, Art Drop, Community Note, Event Badge.

Use React Native/Expo or the official Solana Mobile React Native template if it is the fastest reliable path. Use Solana devnet. Use Mobile Wallet Adapter for wallet signing where feasible. Use Memo transactions for create/unlock proofs unless a simpler official Solana Mobile-compatible approach is available.

Do not put private secret content or exact sensitive GPS coordinates directly on-chain. Store content locally/off-chain for MVP; put proof metadata/hashes and transaction signatures on-chain.

Build in phases. After every phase, run the self-check rubric and report:
- What changed
- Files created/edited
- Commands run
- How to test
- What passed
- What failed or remains risky
- Whether we can safely move to the next phase

Stop and ask for direction if Android setup is impossible, MWA is blocked after focused debugging, the project stops building, or the app drifts into being only a confession app.
```

---

## 16. Prompt for Reviewer / Cross-Check AI

```text
You are a strict hackathon reviewer for GhostPass.

Review the current implementation against the GhostPass Single Source of Truth. Do not propose new features unless they directly improve the MVP or demo reliability.

Evaluate:
1. Does the implemented app match the core loop?
2. Is GhostPass framed as a broad secret-experience platform, not just confessions?
3. Are the six GhostPass types represented?
4. Is Solana used meaningfully?
5. Is Mobile Wallet Adapter implemented or honestly documented as a blocker?
6. Are private content and sensitive GPS details kept off-chain?
7. Does the app have a demo fallback?
8. Is the demo understandable in 30 seconds?
9. What is the single highest-priority bug or gap to fix next?

Return a prioritized list: Blockers, Important Fixes, Nice-to-Have, Do Not Build Today.
```

---

## 17. Demo Assets and Script

### 17.1 Seed Demo GhostPasses

| Type | Title | Clue | Secret Reveal |
|---|---|---|---|
| Confession | Builder Ghost Confession | Only real builders nearby can read this. | Someone here almost gave up today - but shipped anyway. That is the ghost in the machine. |
| Secret Invite | After-Hours Builder Drop | A temporary invite hidden near the hackathon floor. | You found the secret builder invite. Entry phrase: “Proof of Vibe.” |
| Treasure Clue | Ghost Trail: Clue 1 | The next signal is near the brightest screen. | Next clue: find the person with the purple laptop sticker. |
| Event Badge | EasyA Builder Presence | Claim proof that you were here. | You were physically present for the GhostPass demo. |

### 17.2 30-Second Demo Script

“I create a GhostPass called Builder Ghost Confession and hide it at this location. The app records a creation proof on Solana. Now another user nearby opens the feed, sees the pass, and the unlock button only activates when they are close enough. They sign with their Solana wallet, the unlock proof is recorded, the secret reveal appears, and they receive a proof-of-being-there badge.”

---

## 18. 3-Minute Presentation Structure

| Time | Content | Key Message |
|---|---|---|
| 0:00-0:30 | Team intro | Who built it and why this team understands beginner-friendly crypto experiences. |
| 0:30-1:00 | Problem | Crypto apps are intimidating and mostly financial; mobile phones are social, physical, and location-aware. |
| 1:00-1:30 | Solution/vision | GhostPass creates temporary location-locked secret experiences. |
| 1:30-2:00 | Demo | Create -> nearby feed -> GPS gate -> wallet unlock -> secret reveal -> proof badge. |
| 2:00-2:30 | Blockchain use | Solana records creation/unlock proofs, scarcity, access windows, and portable proof-of-presence. |
| 2:30-3:00 | Roadmap | Events, creator drops, encrypted media, city hunts, token-gated communities, monetization. |

---

## 19. Submission Checklist

- Functional Android APK.
- Open-source GitHub repository.
- Clear README with setup instructions.
- README includes demo video link.
- README includes screenshots of UI.
- README explains Solana interaction and Mobile Wallet Adapter use.
- Technical description lists SDKs and why Solana Mobile makes the app possible.
- Short summary under 150 characters.
- Full product description.
- Canva slide link with team/problem/solution/demo/blockchain/roadmap sections.
- Demo video with audio explaining app, repo structure, and working functionality.
- Known limitations documented honestly.

---

## 20. Roadmap Only - Do Not Build Today Unless MVP Is Done

- Encrypted decentralized media storage.
- Compressed NFTs or custom Solana program for passes/badges.
- Creator monetization and paid secret drops.
- True ARCore placement and spatial anchors.
- Push notifications for nearby drops.
- Anti-spoofing and device attestation.
- Map view with city-wide Ghost Trails.
- QR-based group unlocks.
- Sunrise/sunset expiration rules.
- Movement-away self-destruct behavior.

---

## 21. Final Build Doctrine

**The winning MVP is not the largest version of GhostPass. It is the smallest magical version that works.** Do not chase production complexity. Do not let any AI agent turn this into a generic NFT, wallet, map, or confession-only app. The product must remain a playful, mobile-native, location-locked secret experience platform with meaningful Solana proof and a reliable demo.
