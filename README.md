This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Env setup

```
# Client-side: Defines the agents available in the UI and their basic non-sensitive properties.
# Format: alias:provider:model[:roleName1,roleName2,...] (roles are optional and comma-separated if multiple)
# Example: NEXT_PUBLIC_ACTIVE_AGENTS="gemini-pro:gemini:gemini-1.5-pro-latest:ItineraryPlanner,BudgetAdvisor|deepseek-chat:deepseek:deepseek-chat"
NEXT_PUBLIC_ACTIVE_AGENTS=

# Server-side: Full agent configurations including API keys.
# This variable is NOT prefixed with NEXT_PUBLIC_ and should only be accessible on the server.
# It's a JSON string representing an array of agent configurations.
# Example: SERVER_AGENTS_CONFIG='[{"alias":"gemini-pro","provider":"gemini","model":"gemini-1.5-pro-latest","apiKey":"YOUR_GEMINI_KEY","roleNames":["ItineraryPlanner","BudgetAdvisor"]},{"alias":"deepseek-chat","provider":"deepseek","model":"deepseek-chat","apiKey":"YOUR_DEEPSEEK_KEY"}]'
SERVER_AGENTS_CONFIG=

# Server-side API keys for direct provider access (used by the /api/[provider].ts route as fallbacks 
# or if SERVER_AGENTS_CONFIG doesn't specify a key for a particular provider/model combination).
# These are NOT prefixed with NEXT_PUBLIC_.
GEMINI_API_KEY=
DEEPSEEK_API_KEY=
OPENAI_API_KEY=


# Firebase Configuration 
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

```
## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
