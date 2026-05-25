# StrawberrySMP - Project Handover Guide

Welcome! This guide provides everything you need to manage, maintain, and deploy the StrawberrySMP platform.

## 1. System Overview
StrawberrySMP is a React-based community dashboard designed for Minecraft server management. It features:
*   **User Approval System:** A secure, admin-controlled registration flow.
*   **Marketplace & Trading:** Secure shop and transaction system with automatic stock management.
*   **Live Infrastructure:** Real-time messaging, notifications, and live Minecraft maps.

## 2. Technical Stack
*   **Frontend:** React (Vite/TypeScript) + Tailwind CSS + Framer Motion.
*   **Backend/Database:** Supabase (PostgreSQL).
*   **Hosting:** Cloudflare Pages (Frontend) + Supabase (Database/Auth).

## 3. Database Initialization (The "One-Click" Setup)
To set up a fresh database, use the `supabase/master_reset.sql` file included in the repository.
1. Log in to your [Supabase Dashboard](https://app.supabase.com).
2. Go to **SQL Editor** > **New Query**.
3. Copy all code from `supabase/master_reset.sql` and click **Run**.
4. **Note:** This script handles all tables, security policies, and automation (auto-deletion of old messages/trades).

## 4. Environment Variables
You must create a `.env` file in the root folder with the following keys from your Supabase Project settings:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 5. Administrative Workflow
*   **Managing Registrations:** Use the **"Admin Panel" > "Approvals"** tab to manage new players. Pending users are automatically blocked from accessing features until approved.
*   **Moderating Users:** In the **"Users"** tab, you can toggle roles, ban players, or change their approval status.
*   **Marketplace:** Transactions are handled automatically by a secure backend function. Use the **"Trade History"** page to audit the server economy.

## 6. Live Map Integration
The live map is proxied through a **Cloudflare Worker** to ensure security and prevent Iframe errors. 
*   **Local Testing:** The app uses a direct URL to the map server.
*   **Production:** The app automatically switches to your Cloudflare Worker URL defined in `src/pages/DynaMapPage.tsx`.

## 7. Deployment
This project is configured for **Cloudflare Pages**.
1. Connect your GitHub repository to Cloudflare Pages.
2. Set the **Build command** to: `npm run build`
3. Set the **Output directory** to: `dist`
4. **Environment Variables:** Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Cloudflare Pages settings under "Environment Variables".



## 8. Troubleshooting
*   **Email Rate Limit Exceeded:** If you get this error during login, you can either wait an hour, use a "plus" alias (e.g., `email+test@gmail.com`), or manually confirm the user in the database via the SQL Editor using the `DO` block method.
*   **Access Denied / 403 Errors:** These are usually due to RLS policies. Check the user's `approval_status` in the Admin Panel to ensure they are set to `approved`.
*   **Map Not Loading:** Ensure the Cloudflare Worker URL is correct and active. If testing locally, ensure your development environment allows connections to the map server port.
*   **Build Errors:** If the build fails due to TypeScript errors, run `npm run build` locally to identify specific issues and fix them before pushing to production.
*   **Real-time not updating:** Ensure the `profiles` table is enabled for Realtime in your Supabase Dashboard under **Database > Replication**.

---

### Need Support?
*   **System Maintenance:** Ensure the `pg_cron` extension is enabled in Supabase for automated cleanup tasks.
*   **Permissions:** All security is handled via Database Policies (RLS)—if a user reports an "Access Denied" error, check their `approval_status` in the Admin Panel.
