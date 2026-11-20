# NIELIT Boys Hostel, Gorakhpur: Hostel Portal

Node + Express + MongoDB, plain JavaScript front end (no build step). Deploys on Vercel.

## Three roles
| role | signs in with | can do |
|---|---|---|
| **Hostel Warden** | warden password | everything: students and room allotment, attendance, leave (also approves student applications), issues, fees, permanent leaving, approves resident / guard accounts, downloads all data |
| **Hostel Resident** | NDU roll number + own password | sees own profile and room, applies for leave online, raises issues (written application mandatory), follows the status and number of each |
| **Guard** | guard ID + own password | sees approved leaves (today / next 3 days) and can search one student at the gate |

### How accounts work
1. A resident or guard taps **Create an account** on the sign-in page, fills the form and takes a **live photo of the ID card** with the camera (no gallery upload). Residents must use a roll number that already exists in the warden's student list.
2. The warden opens **Accounts**, compares the ID photo with the person (and with the photo on record), and approves or rejects. Nobody can sign in before approval.
3. The warden can disable an account, or reset a forgotten password. When a student is recorded as permanently left, the login is disabled automatically (undo re-enables it).

Note: a browser cannot prove a photo is live. The warden's check of the ID photo is the real control.

### Leave and issues
* Student applies (dates + reason, photo optional) -> gets **LV-YYYY-NNNN** -> warden approves or rejects with a remark -> only approved leave counts in attendance, sheet and home, and only approved leave is visible to the guard.
* Leaves entered by the warden (with the physical application photo) are approved at once. Overlapping leaves are blocked.
* Student raises an issue (written application, at least 15 characters; photo optional) -> gets **CMP-YYYY-NNNN** -> warden resolves with a note -> student sees status and note.

## Folder structure
```
api/index.js              Vercel entry (loads server/app.js)
server/
  app.js                  public routes (login, register) -> then login -> database -> account active -> role allowed -> routes
  auth.js                 sign-in, signed session token (role + id), account checks
  permissions.js          ROLES and what each can do   <- edit this to change access
  db.js env.js util.js
  lib/                    dates, leaves (rules), refund (SOP), numbers (LV/CMP), password (scrypt)
  routes/                 register, accounts, students, attendance, leaves, complaints, exits, fees, export, my (resident), gate (guard), images
public/
  index.html              page shell: sign-in / create account, header, nav, camera overlay
  css/                    base, components, layout, features/<tab>.css
  js/core/                state, utils, ui, api, auth (sign-in, roles), router (tabs per role), camera
  js/features/            dashboard, attendance, sheet, leave (+applications), exits, students, complaints, fees, accounts, data, hostel, resident, gate
  assets/                 logo, photos, PDFs, mess menu (see assets/README.txt)
tests/                    api.test.js (+ fakeMongo.js), ui.test.js
```

## Environment variables (Vercel > Settings > Environment Variables)
| name | what |
|---|---|
| MONGODB_URI | MongoDB Atlas connection string |
| SESSION_SECRET | long random text, 30+ characters |
| WARDEN_PASSWORD | the warden's password |

Redeploy after changing a variable.

## Change access / add a tab
* Access: edit `server/permissions.js`. Format `resource:read` / `resource:write`; the resource is the first part of the API path. In a screen use `data-need="leaves:write"` (element removed) or `data-edit="fees:write"` (read-only inside).
* New tab: add a route file + one `require` in `server/app.js`; a feature file defining `V.<id>`; a row in `TABS` (`core/router.js`, with the roles that may see it); script/css lines in `index.html`.

## Run locally / tests
```
npm install
cp .env.example .env        # fill it in
npm start                   # http://localhost:3000
npm test                    # server tests (no database needed)
npm i --no-save jsdom && node tests/ui.test.js     # screen tests
```

## Upgrading from the previous version
* The database stays as it is. Old leaves count as approved; old issues get numbers the first time the list is opened.
* Residents can register only if their NDU roll number is in the Students list (give temporary-roll students their real roll with Edit).
* Everyone signs in again once. The old ASSISTANT_PASSWORD / VIEWER_PASSWORD variables are no longer used.
