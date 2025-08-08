if ! command -v tmux &> /dev/null; then
  echo "tmux is not installed. Please install tmux first."
  exit 1
fi



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



if ! command -v npm &> /dev/null; then
  echo "npm not found. Installing latest Node.js LTS via nvm..."
  nvm install --lts
else
  echo "npm is already installed."
fi



if ! command -v pnpm &> /dev/null; then
  echo "pnpm not found. Installing pnpm..."
  npm install -g pnpm
else
  echo "pnpm is already installed."
fi



if ! tmux has-session -t frontend 2>/dev/null; then
  tmux new-session -d -s frontend "bash -c 'while true; do cd $HOME/trendpup/frontend && pnpm start; echo \"frontend crashed. Restarting in 3s...\"; sleep 3; done'"
  echo "Started tmux session: frontend"
else
  echo "tmux session 'frontend' already exists."
fi



if ! tmux has-session -t backend 2>/dev/null; then
  tmux new-session -d -s backend "bash -c 'while true; do cd $HOME/trendpup/backend && pnpm exec concurrently \"node dist/twitter_scraper.js\" \"node dist/ai_analyzer.js\" \"node dist/api-server.js\"; echo \"backend crashed. Restarting in 3s...\"; sleep 3; done'"
  echo "Started tmux session: backend"
else
  echo "tmux session 'backend' already exists."
fi



if ! tmux has-session -t scraper 2>/dev/null; then
  tmux new-session -d -s scraper "bash -c 'while true; do cd $HOME/trendpup/backend && pnpm exec node dist/token_scraper.js; echo \"token scraper crashed. Restarting in 3s...\"; sleep 3; done'"
  echo "Started tmux session: scraper"
else
  echo "tmux session 'scraper' already exists."
fi



if ! tmux has-session -t agent 2>/dev/null; then
  tmux new-session -d -s agent "bash -c 'while true; do cd $HOME/trendpup/ && source venv/bin/activate && adk run agent; echo \"agent crashed. Restarting in 3s...\"; sleep 3; done'"
  echo "Started tmux session: scraper"
else
  echo "tmux session 'agent' already exists."
fi



sleep 1
tmux ls