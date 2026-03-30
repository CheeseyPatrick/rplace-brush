import { humanizer } from "humanize-duration"

const humanizeinger = humanizer({
   language: navigator.language.slice(0, 2) || "en",
})

export let isOperationActive: boolean = false

export class BrushPanel {
   private panel: HTMLDivElement
   private observer: MutationObserver

   private currentOperation: string
   private eta: number | null

   private updateInterval?: number
   private lastOperation: number

   constructor() {
      this.currentOperation = "Loading..."
      this.eta = Date.now() + 5000
      this.lastOperation = Date.now()

      this.panel = document.createElement("div")
      this.panel.style.cssText = `
         position: fixed;
         top: 16px;
         left: 16px;
         min-width: 220px;
         max-width: 280px;
         background: #1a1a1a;
         border: 0.5px solid #2e2e2e;
         border-radius: 12px;
         padding: 14px 16px;
         font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
         z-index: 9999;
      `
      this.updateHtml()

      this.observer = new MutationObserver(() => this.updateVisibility())

      this.setOperation(null)
   }

   private updateVisibility(): void {
      this.panel.style.display =
         document.body.id === "out" ? "none" : "inline-block"
   }

   private updateHtml() {
      if (!this.panel) return
      let noOperation = Date.now() - this.lastOperation >= 5000 ? true : false
      noOperation ? (isOperationActive = false) : (isOperationActive = true)
      let timeUntil: string = "N/A"
      if (this.eta && !noOperation) {
         const number = Math.ceil((this.eta - Date.now()) / 1000) * 1000
         timeUntil = String(humanizeinger(number))
      }
      const newHTML = /*html*/ `
         <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span style="font-size:13px;font-weight:500;color:#e8e8e8;">rplace.live Brush Tool</span>
         </div>
         <p style="font-size:11px;color:#888;margin:0 0 12px 2px;">by CheeseyPatrick</p>
         <div style="border-top:1.5px solid #2e2e2e;padding-top:12px;display:flex;flex-direction:column;gap:8px;">
            <p style="font-size:12px;color:#555;margin:0;text-align:center;">Click and drag with rightclick</p>
            <p style="font-size:24px;color:#61a8ff;margin:0;text-align:left;">Current Operation:</p>
            <div style="font-size:16px;color:#fff;margin:0;text-align:left;" id="operation">${noOperation ? "None" : this.currentOperation}</div>
            <p style="font-size:20px;color:#61a8ff;margin:0;text-align:left;">ETA:</p>
            <div style="font-size:12px;color:#fff;margin:0;text-align:left;" id="eta"><span>${timeUntil}</span></div>
         </div>
      `
      if (newHTML.trim() !== this.panel.innerHTML.trim()) {
         this.panel.innerHTML = newHTML
      }
   }

   mount(): void {
      this.updateVisibility()
      this.observer.observe(document.body, { attributeFilter: ["id"] })
      document.body.appendChild(this.panel)
      this.updateInterval = setInterval(() => this.updateHtml(), 500)
   }

   unmount(): void {
      this.observer.disconnect()
      this.panel.remove()
      if (this.updateInterval) clearInterval(this.updateInterval)
   }

   setOperation(
      operation: null | {
         color: string | undefined
         text: string
         eta: number
      },
   ) {
      if (operation) {
         const { color, text, eta } = operation
         if (color) {
            this.currentOperation = /*html*/ `<span><div style="width:30px;height:30px;background:${color}"></div></span> <span>${text}</span>`
         } else {
            this.currentOperation = text
         }
         this.eta = eta
      } else {
         this.currentOperation = "None"
         this.eta = null
      }
      this.lastOperation = Date.now()
      this.updateHtml()
   }
}
