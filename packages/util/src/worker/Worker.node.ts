import { Worker as NodeWorker, isMainThread, parentPort } from "worker_threads";
import { pathToFileURL } from "url";

class WorkerPolyfill extends NodeWorker {
  constructor(scriptUrl: string | URL, options?: WorkerOptions) {
    if (typeof scriptUrl === "string") {
      scriptUrl = pathToFileURL(scriptUrl);
    }
    super(scriptUrl, options);
  }

  addEventListener(event: "message" | "error", listener: (...args: any[]) => void) {
    if (event === "message") this.on("message", listener);
    if (event === "error") this.on("error", listener);
  }

  removeEventListener(event: "message" | "error", listener: (...args: any[]) => void) {
    if (event === "message") this.off("message", listener);
    if (event === "error") this.off("error", listener);
  }
}

const Worker = isMainThread ? WorkerPolyfill : parentPort;
export { Worker, parentPort };
