# 🎨 Whiteboard — Collaborative Visual Workspace

A modern, real-time collaborative whiteboard inspired by Miro. Built with Next.js, Liveblocks, NeonDB, and deployed on Vercel.

## Features

- **Real-time collaboration** — See others' cursors and edits live via Liveblocks
- **Sticky Notes** — Color-coded notes with inline editing
- **Shapes** — Rectangle, ellipse, triangle, diamond, star
- **Text blocks** — Free-form text anywhere on the canvas
- **Lines & Connectors** — Connect ideas visually
- **Frames** — Group elements into sections
- **Images** — Drag and drop images onto the board
- **Infinite canvas** — Pan and zoom with mouse/trackpad/keyboard
- **Undo / Redo** — Full history powered by Liveblocks
- **Keyboard shortcuts** — V (select), H (hand), N (note), T (text), S (shape), etc.
- **Auth** — Email/password + GitHub/Google OAuth

## Tech Stack

| Layer          | Technology                |
| -------------- | ------------------------- |
| Frontend       | Next.js 14, React 18, TypeScript |
| Styling        | Tailwind CSS              |
| State          | Zustand (local), Liveblocks (shared) |
| Database       | NeonDB (PostgreSQL)       |
| ORM            | Prisma                    |
| Auth           | NextAuth.js               |
| Realtime       | Liveblocks                |
| Monorepo       | Turborepo + pnpm          |
| Deployment     | Vercel                    |

## Project Structure

```
whiteboard/
├── apps/
│   └── web/                    # Next.js app
│       ├── app/                # App router pages & API routes
│       ├── components/         # Board canvas, toolbar, elements
│       ├── hooks/              # Custom hooks
│       └── lib/                # Auth config, Liveblocks client
├── packages/
│   ├── db/                     # Prisma schema + NeonDB client
│   ├── editor/                 # Canvas state, element factories, utils
│   ├── types/                  # Shared TypeScript types
│   └── ui/                     # Shared UI components (Button, Input, etc.)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- A [NeonDB](https://neon.tech) database
- A [Liveblocks](https://liveblocks.io) account
- (Optional) GitHub/Google OAuth apps

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/whiteboard.git
cd whiteboard
pnpm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in your credentials:

```env
# NeonDB
DATABASE_URL="postgresql://user:pass@ep-xxx.region.neon.tech/whiteboard?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="openssl rand -base64 32"  # generate this
NEXTAUTH_URL="http://localhost:3000"

# Liveblocks
LIVEBLOCKS_SECRET_KEY="sk_dev_..."
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY="pk_dev_..."

# Optional OAuth
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

### 3. Setup Database

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to NeonDB
pnpm db:push
```

### 4. Run Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Build & Check

```bash
pnpm build
pnpm typecheck
pnpm lint
```

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: collaborative whiteboard"
git remote add origin https://github.com/YOUR_USERNAME/whiteboard.git
git push -u origin main
```

### 2. Connect to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. **Root Directory**: `apps/web`
4. **Build Command**: `cd ../.. && pnpm build --filter=@whiteboard/web`
5. **Install Command**: `cd ../.. && pnpm install`
6. Add all environment variables from `.env.example`
7. Deploy!

### 3. Update NEXTAUTH_URL

Set `NEXTAUTH_URL` to your Vercel domain: `https://your-app.vercel.app`

## Keyboard Shortcuts

| Key    | Action       |
| ------ | ------------ |
| V      | Select tool  |
| H      | Hand (pan)   |
| N      | Sticky note  |
| T      | Text         |
| S      | Shape        |
| L      | Line         |
| F      | Frame        |
| E      | Eraser       |
| Space  | Temporary hand tool |
| ⌘Z     | Undo         |
| ⌘⇧Z    | Redo         |
| ⌘+     | Zoom in      |
| ⌘-     | Zoom out     |
| ⌘0     | Reset zoom   |
| Delete | Delete selected |
| Escape | Deselect     |

## Architecture Notes

- **Board state** lives in Liveblocks shared storage (real-time synced)
- **Local UI state** (camera, active tool, selection) lives in Zustand
- **Element creation** uses factory functions in `packages/editor`
- **Canvas math** (screen↔canvas coords, zoom) is in `packages/editor/utils`
- **Auth** uses NextAuth.js with JWT strategy for Vercel compatibility
- **DB** only stores board metadata & users — element data is in Liveblocks

## License

MIT
