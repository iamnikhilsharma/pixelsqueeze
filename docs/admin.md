# PixelSqueeze Admin Guide

The Admin Panel lets privileged users manage the platform.

## Access

1. Ask an existing admin to set `isAdmin=true` on your user in the database or via Users page.
2. Navigate to `/admin/login` and sign-in with your admin credentials.

## Navigation

| Section | Path | Purpose |
|---------|------|---------|
| Dashboard | `/admin` | KPI cards & plan distribution chart |
| Users | `/admin/users` | List / activate / deactivate users |
| Plans | `/admin/plans` | Update plan prices (monthly / annual) |
| Subscriptions | `/admin/subscriptions` | View & cancel paid subscriptions |
| Invoices | `/admin/invoices` | Download generated invoice PDFs |

The sidebar collapses on mobile (hamburger).

## Security

• All Admin API routes are protected by JWT and `isAdmin` flag via `requireAdmin` middleware.  
• Separate login endpoint: `POST /api/admin/login` – returns standard JWT with `isAdmin` encoded.  
• Front-end pages are wrapped with `AdminGuard` HOC which redirects non-admins to `/admin/login`.

## Extending

*To add a new admin page:*
1. Add link in `client/components/AdminLayout.tsx` nav array.  
2. Create page under `client/pages/admin/<page>.tsx` and wrap export with `withAdminAuth`.  
3. Add secure backend routes under `server/routes/` and register in `server/index.js`.

## API Reference

### Plans
```
GET  /api/admin/plans
PATCH /api/admin/plans/:id { monthly, annual }
```

### Subscriptions
```
GET  /api/admin/subscriptions
PATCH /api/admin/subscriptions/:id/cancel
```

### Invoices
```
GET /api/admin/invoices
```

### Stats (Dashboard)
```
GET /api/admin/stats
```
Response sample:
```json
{
  "success": true,
  "data": {
    "totalUsers": 1234,
    "activeUsers": 1180,
    "admins": 3,
    "activeSubscriptions": 412,
    "planBreakdown": {
      "starter": 300,
      "pro": 100,
      "enterprise": 12
    }
  }
}
```

---

© PixelSqueeze
