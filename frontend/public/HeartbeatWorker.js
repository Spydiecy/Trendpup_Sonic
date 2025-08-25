// Simple HeartbeatWorker placeholder
let heartbeatInterval;

self.addEventListener('message', function(e) {
  const { type } = e.data;
  
  if (type === 'start') {
    heartbeatInterval = setInterval(() => {
      self.postMessage({ type: 'heartbeat' });
    }, 5000);
  } else if (type === 'stop') {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  }
});

self.addEventListener("beforeunload", () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
});
