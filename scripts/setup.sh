#!/bin/bash
set -e

echo "Setting up my-app monorepo..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Node.js is required. Install via https://nodejs.org"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "pnpm is required. Run: npm install -g pnpm"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required for local Supabase. Install via https://docker.com"; exit 1; }

echo "Prerequisites check passed"

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Set up git hooks
echo "Setting up Husky git hooks..."
pnpm exec husky install

# Copy env files if they don't exist
if [ ! -f apps/nextjs/.env.local ]; then
  cp apps/nextjs/.env.example apps/nextjs/.env.local
  echo "Created apps/nextjs/.env.local -- fill in your values"
fi

if [ ! -f apps/expo/.env.local ]; then
  cp apps/expo/.env.example apps/expo/.env.local
  echo "Created apps/expo/.env.local -- fill in your values"
fi

# Start local Supabase
echo "Starting local Supabase..."
pnpm supabase start

# Generate types from local schema
echo "Generating Supabase TypeScript types..."
pnpm supabase:types

# Run migrations
echo "Applying database migrations..."
pnpm --filter @my-app/api db:migrate

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Fill in missing values in apps/nextjs/.env.local and apps/expo/.env.local"
echo "  2. Run 'pnpm dev' to start all apps"
echo "  3. Open http://localhost:3000 for the web app"
echo "  4. Open http://localhost:54423 for Supabase Studio"
