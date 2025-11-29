# Social Anti-Fake News — Full-Stack Guide

This repo contains the frontend (React + Vite) and backend (Node.js + Express + Prisma + SQLite). Below covers running, config, seed accounts, and key features. Fill in team/student IDs/deploy links as needed.

## Team Info
- Course/Class: SE331
- Team: Wei Yang Jiejie Team
- Members/Student IDs:
  - Wei Yang Jiejie 20232055
  - Li Muxin 20232059
  - Liang Qianqian 20232053
- Frontend repo/deploy: `https://github.com/WeiYangjunjie/weiyangjunjie-anti-fake-news` / `<deploy URL>`
- Backend repo/deploy: `https://github.com/WeiYangjunjie/weiyangjunjie-anti-fake-news` / `<deploy URL>`
- Demo video (~5 minutes): `demo-walkthrough.mov`

## Tech Stack
- Frontend: React 19, React Router, Axios, Vite, Tailwind CDN (can switch to local Tailwind)
- Backend: Node.js, Express, Prisma (SQLite), Zod, JWT, Multer (local uploads)

## Quick Start (local dev)
1) After cloning, install dependencies  
```bash
cd backend && npm install
cd ../frontend && npm install
```
2) Backend env vars (in `backend/.env`, sample)  
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev-secret-change-me"
API_BASE_URL="http://localhost:3000"
```
3) DB migration and seed  
```bash
cd backend
npm run migrate
npm run seed
```
4) Run backend  
```bash
npm run dev        # http://localhost:3000
```
5) Frontend env vars (optional, defaults to proxy to 3000)  
Set in `frontend/.env`:  
```
VITE_API_BASE_URL="http://localhost:3000"
```
6) Run frontend  
```bash
cd frontend
npm run dev        # default port 5173
```

## Seed Accounts
- Admin: `admin@example.com` / `password123`
- Member: `member@example.com` / `password123`
- Reader: `reader@example.com` / `password123`

## Key Features
- Auth: register/login/JWT persistence, avatar upload.  
- News: list search + pagination + status filter, detail, submit (Member/Admin), soft delete/restore (Admin).  
- Voting & comments: vote/comment after login with live refresh; admins can delete comments.  
- Admin console: user list with role upgrade, news visibility management.  
- Uploads: `/upload` supports image upload; static files served via `/uploads`.  
- i18n: English/Chinese toggle.

## Deployment Tips
- Backend: ensure `uploads/` directory exists and set `API_BASE_URL` to the public address.  
- Frontend: build with `npm run build`, deploy static assets, set `VITE_API_BASE_URL` to the backend.  
- If using a reverse proxy, expose `/auth /users /news /comments /upload /uploads`.

## Pre-Submission Checklist
- [ ] List pagination/filter/search works; deleted news hidden from normal users.  
- [ ] Detail page vote/comment counts match admin; removing comments decreases counts.  
- [ ] Voting prevents duplicates; prompts login when not authenticated.  
- [ ] Submit/register/login forms validate and show errors correctly.  
- [ ] Admin can restore/hide news, upgrade members, delete comments.  
- [ ] Image uploads succeed and display in details/avatars.  
- [ ] README filled with team IDs, repos, deploy links, video link.
