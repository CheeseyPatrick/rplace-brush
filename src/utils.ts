import { sendIpcMessage } from "shared-ipc"

export const log = {
   info: (...args: any[]) => console.log("[rplace.live Brush]", ...args),
   warn: (...args: any[]) => console.warn("[rplace.live Brush]", ...args),
   error: (...args: any[]) => console.error("[rplace.live Brush]", ...args),
   debug: (...args: any[]) => console.debug("[rplace.live Brush]", ...args),
}

log.info("Loading rplace.live Brush...")

async function disableDisableDevtool() {
   // Disables disable-devtool
   const _originalSetInterval = window.setInterval
   window.setInterval = function (fn, delay, ...args) {
      const src = typeof fn === "function" ? fn.toString() : ""

      if (src.includes("ondevtoolclose")) {
         // If true, then this is the interval that disable-devtool uses to keep going. We will not call the function, and instead we will simply return a dummy number
         return 999999999
      }

      return _originalSetInterval.call(this, fn, delay, ...args)
   }
}
disableDisableDevtool().catch(() =>
   log.error("Failed to disable disable-devtool"),
)

async function captureWorkers() {
   // Captures all Worker's made for later use
   window.workers = []

   const OriginalWorker = window.Worker
   window.Worker = function (...args: ConstructorParameters<typeof Worker>) {
      const worker = new OriginalWorker(...args)
      log.debug("Captured worker:", worker)
      window.workers.push(worker)
      return worker
   } as unknown as typeof Worker

   window.Worker.prototype = OriginalWorker.prototype
}
captureWorkers().catch(() => log.error("Failed to edit the Worker constructor"))

export function sendMessage<K extends keyof RplaceMessages>(
   type: K,
   data: RplaceMessages[K],
) {
   // A function to send a message to the rplace.live server by sending it as an IPC message to the Worker who then sends it to the server
   if (window.workers.length === 0) {
      throw new Error(
         `Error during sendMessage<${type}>: There are no workers to send to`,
      )
   }

   for (const worker of window.workers) sendIpcMessage(worker, type, data)
}
window.sendMessage = sendMessage

export function getWidth() {
   const canvasWidth = (
      document.getElementById("canvas") as HTMLCanvasElement | null
   )?.width
   const width = canvasWidth || 1000
   return width
}

export function coordinatesToPosition(x: number, y: number) {
   const width = getWidth()
   return y * width + x
}

export function positionToCoordinates(position: number) {
   const width = getWidth()
   return {
      x: position % width,
      y: Math.floor(position / width),
   }
}
