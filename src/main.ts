import "./utils"
import { MouseEffect } from "./mouseEffect"
import { BrushPanel } from "./panel"
import { performOperation } from "./performOperation"

window.addEventListener("DOMContentLoaded", async () => {
   const panel = new BrushPanel()
   panel.mount()
   const mouseEffect = new MouseEffect()

   mouseEffect.onRectangleSelect((data) => performOperation(data, panel))

   window.addEventListener("beforeunload", () => {
      panel.unmount()
      mouseEffect.destroy()
   })
})
