# TrainBoost

This project is a Next.js application created using [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app) for AI-powered learning and training.

## Getting Started

### Prerequisites

Ensure you have the following installed:
- Node.js (>= 18.x)
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/esmagico/train-boost-frontend.git
   ```
2. Navigate to the project directory:
   ```sh
   cd train-boost
   ```
3. Install dependencies:
   ```sh
   npm install
   ```
   or
   ```sh
   yarn install
   ```

## Environment Variables

This project utilizes the following environment variables. Ensure you create a `.env` file in the root of the project and configure them accordingly.

### Required Environment Variables

| Variable Name | Description |
|--------------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API endpoint for course data, video content, and progress tracking. |
| `NEXT_PUBLIC_LOGIN_BASE_URL` | Authentication service for JWT token management and user sessions. |
| `NEXT_PUBLIC_LIVEKIT_API_URL` | LiveKit server for real-time AI voice interactions and conversation sessions. |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog analytics key for user behavior tracking. |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog analytics host endpoint for data collection. |

Example `.env` file:
```env
NEXT_PUBLIC_API_BASE_URL=https://be.dev.train.pyzo.ai
NEXT_PUBLIC_LOGIN_BASE_URL=https://users.uat.trainboost.esmagico.com
NEXT_PUBLIC_LIVEKIT_API_URL=https://engine.conversations.dev.train.pyzo.ai
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key_here
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## Running the Application

To start the development server, run:
```sh
npm run dev
```
Or using yarn:
```sh
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Building the Application

To build the application for production, use:
```sh
npm run build
```
Or with yarn:
```sh
yarn build
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
