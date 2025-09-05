if ! command -v tmux &> /dev/null; then
  echo "tmux is not installed. Please install tmux first."
  exit 1
fi



if ! tmux has-session -t frontend 2>/dev/null; then
  tmux new-session -d -s frontend "bash -c 'while true; do cd $HOME/trendpup/frontend && pnpm start; echo \"frontend crashed. Restarting in 3s...\"; sleep 3; done'"
  echo "Started tmux session: frontend"
else
  echo "tmux session 'frontend' already exists."
fi



if ! tmux has-session -t mcp 2>/dev/null; then
  tmux new-session -d -s mcp "bash -c 'while true; do cd $HOME/trendpup/mcp && pnpm start:http; echo \"mcp crashed. Restarting in 3s...\"; sleep 3; done'"
  echo "Started tmux session: mcp"
else
  echo "tmux session 'mcp' already exists."
fi


if ! tmux has-session -t agents 2>/dev/null; then
  tmux new-session -d -s agents "bash -c 'while true; do cd $HOME/trendpup && source venv/bin/activate && adk api_server agents --allow_origins=\"*\"; echo \"agents crashed. Restarting in 3s...\"; sleep 3; done'"
  echo "Started tmux session: agents"
else
  echo "tmux session 'agents' already exists."
fi



if ! tmux has-session -t backend 2>/dev/null; then
  tmux new-session -d -s backend "bash -c 'while true; do cd $HOME/trendpup/backend && pnpm start; echo \"backend crashed. Restarting in 3s...\"; sleep 3; done'"
  echo "Started tmux session: backend"
else
  echo "tmux session 'backend' already exists."
fi



if ! tmux has-session -t scraper 2>/dev/null; then
  tmux new-session -d -s scraper "bash -c 'while true; do cd $HOME/trendpup/backend && pnpm start:scraper; echo \"scraper crashed. Restarting in 3s...\"; sleep 3; done'"
  echo "Started tmux session: scraper"
else
  echo "tmux session 'scraper' already exists."
fi



sleep 1
tmux ls