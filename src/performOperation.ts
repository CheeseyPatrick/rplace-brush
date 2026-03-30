import type { BrushPanel } from "./panel"
import { coordinatesToPosition, log, sendMessage } from "./utils"

window.cooldown = 2000
window.cooldownExpireTime = 0
fetchCooldown().then((cooldown) => (window.cooldown = cooldown))

export async function fetchCooldown() {
   try {
      const resp = await fetch("https://server.rplace.live")
      if (!resp.ok) throw new Error()
      const data = (await resp.json()) as RPlaceStatus
      if (data?.canvas?.cooldown) {
         return data.canvas.cooldown + 50
      } else return 2067
   } catch (err) {
      return 2067
   }
}

window.currentOperation =
   "676767hahahahahaMUSTARDDDDDDDDDDDDsaywallahibrosaywallahi"

async function sleep(time: number) {
   await new Promise((resolve) => setTimeout(resolve, time))
}

export async function performOperation(data: RectangleData, panel: BrushPanel) {
   const myOperationId = `${data.startX}${data.startY}${data.endX}${data.endY}${data.currentColor}${Math.ceil(Math.random() * 200000)}`
   window.currentOperation = myOperationId

   const canvas = document.getElementById("canvas") as HTMLCanvasElement
   const ctx = canvas.getContext("2d")!
   const [targetR, targetG, targetB] = data.currentColor.split(",").map(Number)

   const recentlyPlaced = new Set<string>()
   const key = (p: { x: number; y: number }) => `${p.x},${p.y}`

   while (true) {
      const width = data.endX - data.startX + 1
      const height = data.endY - data.startY + 1
      const imageData = ctx.getImageData(
         data.startX,
         data.startY,
         width,
         height,
      ).data

      const wrongPixels: { x: number; y: number }[] = []
      let totalPixels: number = 0

      for (let x = data.startX; x <= data.endX; x++) {
         for (let y = data.startY; y <= data.endY; y++) {
            const localX = x - data.startX
            const localY = y - data.startY
            const i = (localY * width + localX) * 4
            const [r, g, b] = [imageData[i], imageData[i + 1], imageData[i + 2]]

            if (r !== targetR || g !== targetG || b !== targetB) {
               wrongPixels.push({ x, y })
            }
            totalPixels++
         }
      }

      if (wrongPixels.length === 0) {
         panel.setOperation(null)
         break
      }

      panel.setOperation({
         color: `rgb(${data.currentColor})`,
         text: /*html*/ `<div><span style="color:rgb(0, 255, 55);">${data.startX}, ${data.startY}</span> → <span style="color:rgb(0, 255, 55);">${data.endX}, ${data.endY}</span></div><div><span style="color:rgb(85, 88, 255);">${totalPixels - wrongPixels.length}/${totalPixels}</span></div>`,
         eta: Date.now() + window.cooldown * wrongPixels.length,
      })

      const preferredPixels = wrongPixels.filter(
         (p) => !recentlyPlaced.has(key(p)),
      )
      const pick =
         preferredPixels.length > 0
            ? preferredPixels[
                 Math.floor(Math.random() * preferredPixels.length)
              ]!
            : wrongPixels[Math.floor(Math.random() * wrongPixels.length)]!

      const position = coordinatesToPosition(pick.x, pick.y)

      // Wait only however long is left on the cooldown, if anything
      const waitTime = window.cooldownExpireTime - Date.now()
      if (waitTime > 0) await sleep(waitTime)
      if (window.currentOperation !== myOperationId) return

      // Place immediately, then set when the next placement is allowed
      sendMessage("putPixel", { position, colour: data.colorIndex })
      window.cooldownExpireTime = Date.now() + window.cooldown

      recentlyPlaced.add(key(pick))
      if (recentlyPlaced.size > 2) {
         recentlyPlaced.delete(recentlyPlaced.values().next().value!)
      }
   }
}
