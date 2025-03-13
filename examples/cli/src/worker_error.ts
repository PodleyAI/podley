self.onerror = function (...args) {
  console.error("Worker Error:", args);
};

self.onunhandledrejection = function (event) {
  console.error("Worker Unhandled Rejection:", event.reason);
};
