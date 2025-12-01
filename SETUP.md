# Setup Instructions for Clerk + Convex

Follow these steps to complete the migration setup:

## 1. Convex Setup

The Convex initialization has started locally. To deploy to production:

1. Visit https://dashboard.convex.dev
2. Create a new project or login
3. Run: `npx convex dev` and follow prompts to link your project
4. Copy the `NEXT_PUBLIC_CONVEX_URL` from the dashboard
5. Add to `.env.local`:
   ```
   NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
   ```

## 2. Clerk Setup

1. Visit https://dashboard.clerk.com
2. Create a new application
3. Get your API keys from the dashboard
4. Add to `.env.local`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

## 3. Stripe Setup (Optional - for billing)

1. Visit https://dashboard.stripe.com
2. Get your API keys
3. Add to `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## 4. Configure Clerk + Convex Integration

In your Convex dashboard:
1. Go to Settings → Authentication
2. Add Clerk as an auth provider
3. Enter your Clerk domain

## 5. Run the Application

```bash
# Terminal 1: Start Convex
bun run convex:dev

# Terminal 2: Start Next.js
bun run dev
```

## Next Steps

- Test authentication flow at `/sign-in`
- Create a document from `/dashboard`
- Verify data is saving to Convex
