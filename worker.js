import { parentPort } from "worker_threads";
import { pathToFileURL } from "url";

async function callPrettierFunction({ functionName, args, prettierPath }) {
  const prettier = await import(pathToFileURL(prettierPath));
  return prettier[functionName](...args);
}

parentPort.addListener(
  "message",
  async ({ signal, port, functionName, args, prettierPath }) => {
    const response = {};

    try {
      response.result = await callPrettierFunction({
        functionName,
        args,
        prettierPath,
      });
    } catch (error) {
      response.error = error;
      response.errorData = { ...error };
    }

    try {
      port.postMessage(response);
    } catch {
      port.postMessage({
        error: new Error("Cannot serialize worker response"),
      });
    } finally {
      port.close();
      Atomics.store(signal, 0, 1);
      Atomics.notify(signal, 0);
    }
  },
);
