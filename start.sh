#!/bin/bash

# Check for tmux
if ! command -v tmux &> /dev/null; then
  echo "tmux is not installed. Please install tmux first."
  exit 1
fi

# Check for nvm
if [ -z "$NVM_DIR" ]; then
  export NVM_DIR="$HOME/.nvm"
fi
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  echo "nvm not found. Installing nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
else
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  echo "nvm is already installed."
fi

# Check for npm
if ! command -v npm &> /dev/null; then
  echo "npm not found. Installing latest Node.js LTS via nvm..."
  nvm install --lts
else
  echo "npm is already installed."
fi

# Check for pnpm
if ! command -v pnpm &> /dev/null; then
  echo "pnpm not found. Installing pnpm..."
  npm install -g pnpm
else
  echo "pnpm is already installed."
fi

# Check for bun
if ! command -v bun &> /dev/null; then
  echo "bun not found. Installing bun..."
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
else
  echo "bun is already installed."
fi

# Convert .env.example to .env if needed
if [ -f "$HOME/Trendpup_PL_Genesis/scraper/.env.example" ] && [ ! -f "$HOME/Trendpup_PL_Genesis/scraper/.env" ]; then
  mv "$HOME/Trendpup_PL_Genesis/scraper/.env.example" "$HOME/Trendpup_PL_Genesis/scraper/.env"
  echo "Moved scraper .env.example to .env"
fi
if [ -f "$HOME/Trendpup_PL_Genesis/eliza/trendpup/.env.example" ] && [ ! -f "$HOME/Trendpup_PL_Genesis/eliza/trendpup/.env" ]; then
  mv "$HOME/Trendpup_PL_Genesis/eliza/trendpup/.env.example" "$HOME/Trendpup_PL_Genesis/eliza/trendpup/.env"
  echo "Moved eliza/trendpup .env.example to .env"
fi

# Start frontend session with auto-restart
if ! tmux has-session -t frontend 2>/dev/null; then
  tmux new-session -d -s frontend "bash -c 'while true; do cd $HOME/Trendpup_PL_Genesis/frontend && pnpm install && pnpm run dev --turbo; echo \"frontend crashed. Restarting in 3s...\"; sleep 3; done'"
  echo "Started tmux session: frontend"
  # Wait for the server to start and trigger compilation
  sleep 10
  curl -s http://localhost:3000 > /dev/null
  echo "Triggered frontend compilation."
else
  echo "tmux session 'frontend' already exists."
fi

# Wait for 3 minutes before starting other sessions
sleep 180

# Start scraper session with auto-restart
if ! tmux has-session -t scraper 2>/dev/null; then
  tmux new-session -d -s scraper "bash -c 'while true; do cd $HOME/Trendpup_PL_Genesis/scraper && pnpm install && pnpm exec playwright install && pnpm exec playwright install-deps && pnpm build && pnpm start; echo \"scraper crashed. Restarting in 3s...\"; sleep 3; done'"
  echo "Started tmux session: scraper"
else
  echo "tmux session 'scraper' already exists."
fi

# Start agent session with auto-restart
if ! tmux has-session -t agent 2>/dev/null; then
  tmux new-session -d -s agent "bash -c 'while true; do cd $HOME/Trendpup_PL_Genesis/eliza/trendpup && bun install && bun run dev; echo \"agent crashed. Restarting in 3s...\"; sleep 3; done'"
  echo "Started tmux session: agent"
else
  echo "tmux session 'agent' already exists."
fi

# List sessions
sleep 1
tmux ls
