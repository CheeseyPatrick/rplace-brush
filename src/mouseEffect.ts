export class MouseEffect {
   private canvas: HTMLCanvasElement
   private overlay: HTMLCanvasElement
   private ctx: CanvasRenderingContext2D
   private observer: MutationObserver

   private currentColor: string = "255,255,255"
   private currentRectColor: string = "255,255,255"
   private currentColorIndex: number = 5
   private coloursObserver?: MutationObserver

   private lastTileX: number = -1
   private lastTileY: number = -1

   private isRightClickDrawing: boolean = false
   private rectStartTileX: number = -1
   private rectStartTileY: number = -1
   private rectEndTileX: number = -1
   private rectEndTileY: number = -1

   private restartOperationAfterPaletteColorChange: boolean = false

   private rectangleSelectionCallback?: (data: RectangleData) => void

   private onMouseMove: (e: MouseEvent) => void
   private onMouseDown: (e: MouseEvent) => void
   private onMouseUp: (e: MouseEvent) => void
   private onContextMenu: (e: MouseEvent) => void

   constructor(canvasId: string = "canvas") {
      this.canvas = document.getElementById(canvasId) as HTMLCanvasElement

      this.overlay = document.createElement("canvas")
      this.overlay.id = "mouseEffectCanvas"
      this.overlay.width = 1000
      this.overlay.height = 1000
      document.body.appendChild(this.overlay)

      this.ctx = this.overlay.getContext("2d")!

      this.syncOverlay()

      this.onMouseMove = this.handleMouseMove.bind(this)
      this.onMouseDown = this.handleMouseDown.bind(this)
      this.onMouseUp = this.handleMouseUp.bind(this)
      this.onContextMenu = this.handleContextMenu.bind(this)

      document.addEventListener("mousemove", this.onMouseMove)
      document.addEventListener("mousedown", this.onMouseDown, true)
      document.addEventListener("mouseup", this.onMouseUp, true)
      document.addEventListener("contextmenu", this.onContextMenu, true)

      this.observer = new MutationObserver(this.syncOverlay.bind(this))
      this.observer.observe(this.canvas, { attributeFilter: ["style"] })

      const coloursEl = document.getElementById("colours")

      if (coloursEl) {
         this.updateColorFromPalette(coloursEl)

         this.coloursObserver = new MutationObserver(() => {
            this.updateColorFromPalette(coloursEl)
         })

         this.coloursObserver.observe(coloursEl, {
            subtree: true,
            attributes: true,
            attributeFilter: ["class", "style"],
         })
      }
   }

   private updateColorFromPalette(coloursEl: HTMLElement): void {
      const selected = coloursEl.querySelector(".sel") as HTMLElement
      if (!selected) return

      const bg = getComputedStyle(selected).backgroundColor
      const match = bg.match(/\d+/g)
      if (!match) return

      const oldColor = this.currentColor
      this.currentColor = `${match[0]},${match[1]},${match[2]}`

      const indexAttr = selected.getAttribute("data-index")
      this.currentColorIndex = indexAttr ? parseInt(indexAttr) : -1

      if (this.restartOperationAfterPaletteColorChange) {
         if (oldColor !== this.currentColor && this.rectStartTileX !== -1) {
            this.callCallback()
            this.redrawRect()
         }
      }
   }

   private syncOverlay(): void {
      const rect = this.canvas.getBoundingClientRect()
      this.overlay.setAttribute(
         "style",
         `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;z-index:2147483647;pointer-events:none!important;`,
      )
   }

   private handleContextMenu(e: MouseEvent): void {
      if (this.isInsideCanvas(e)) {
         e.preventDefault()
         e.stopPropagation()
         e.stopImmediatePropagation()
      }
   }

   private handleMouseDown(e: MouseEvent): void {
      if (e.button !== 2) return
      if (!this.isInsideCanvas(e)) return

      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()

      const { tileX, tileY } = this.clientToTile(e)
      this.isRightClickDrawing = true
      this.rectStartTileX = tileX
      this.rectStartTileY = tileY
      this.rectEndTileX = tileX
      this.rectEndTileY = tileY
      this.currentRectColor = this.currentColor

      this.redrawRect()
   }

   private handleMouseUp(e: MouseEvent): void {
      if (e.button !== 2) return
      if (!this.isRightClickDrawing) return

      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()

      this.isRightClickDrawing = false

      const startX = Math.min(this.rectStartTileX, this.rectEndTileX)
      const startY = Math.min(this.rectStartTileY, this.rectEndTileY)
      const endX = Math.max(this.rectStartTileX, this.rectEndTileX)
      const endY = Math.max(this.rectStartTileY, this.rectEndTileY)

      this.rectStartTileX = startX
      this.rectStartTileY = startY
      this.rectEndTileX = endX
      this.rectEndTileY = endY

      this.redrawRect()
      this.callCallback()
   }

   private callCallback() {
      this.rectangleSelectionCallback?.({
         currentColor: this.currentColor,
         colorIndex: this.currentColorIndex,
         startX: this.rectStartTileX,
         startY: this.rectStartTileY,
         endX: this.rectEndTileX,
         endY: this.rectEndTileY,
      })
   }

   private handleMouseMove(e: MouseEvent): void {
      if (!this.isInsideCanvas(e)) {
         if (this.lastTileX !== -1) {
            this.lastTileX = -1
            this.lastTileY = -1
            if (!this.isRightClickDrawing) {
               this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height)
            }
         }
         return
      }

      const { tileX, tileY } = this.clientToTile(e)

      if (this.isRightClickDrawing) {
         this.lastTileX = tileX
         this.lastTileY = tileY
         this.rectEndTileX = tileX
         this.rectEndTileY = tileY
         this.redrawRect()
         return
      }

      if (tileX === this.lastTileX && tileY === this.lastTileY) return
      this.lastTileX = tileX
      this.lastTileY = tileY

      this.redraw(tileX, tileY)
   }

   private isInsideCanvas(e: MouseEvent): boolean {
      const rect = this.canvas.getBoundingClientRect()
      return (
         e.clientX >= rect.left &&
         e.clientX <= rect.right &&
         e.clientY >= rect.top &&
         e.clientY <= rect.bottom
      )
   }

   private clientToTile(e: MouseEvent): { tileX: number; tileY: number } {
      const rect = this.canvas.getBoundingClientRect()
      const scaleX = this.canvas.width / rect.width
      const scaleY = this.canvas.height / rect.height
      return {
         tileX: Math.floor((e.clientX - rect.left) * scaleX),
         tileY: Math.floor((e.clientY - rect.top) * scaleY),
      }
   }

   private redrawRect(): void {
      this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height)

      const x1 = Math.min(this.rectStartTileX, this.rectEndTileX)
      const y1 = Math.min(this.rectStartTileY, this.rectEndTileY)
      const x2 = Math.max(this.rectStartTileX, this.rectEndTileX)
      const y2 = Math.max(this.rectStartTileY, this.rectEndTileY)

      const w = x2 - x1 + 1
      const h = y2 - y1 + 1

      this.ctx.fillStyle = `rgba(${this.currentRectColor}, 0.55)`
      this.ctx.fillRect(x1, y1, w, h)
   }

   private redraw(tileX: number, tileY: number): void {
      this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height)

      if (this.rectStartTileX !== -1) {
         this.redrawRect()
      }

      for (let dx = -1; dx <= 1; dx++) {
         for (let dy = -1; dy <= 1; dy++) {
            const tx = tileX + dx
            const ty = tileY + dy

            if (
               tx < 0 ||
               ty < 0 ||
               tx >= this.canvas.width ||
               ty >= this.canvas.height
            )
               continue

            const isCenter = dx === 0 && dy === 0

            this.ctx.fillStyle = isCenter
               ? `rgba(${this.currentColor}, 1.0)`
               : `rgba(${this.currentColor}, 0.15)`

            this.ctx.fillRect(tx, ty, 1, 1)
         }
      }
   }

   clear(): void {
      this.ctx.clearRect(0, 0, this.overlay.width, this.overlay.height)
      this.lastTileX = -1
      this.lastTileY = -1
   }

   destroy(): void {
      document.removeEventListener("mousemove", this.onMouseMove)
      document.removeEventListener("mousedown", this.onMouseDown, true)
      document.removeEventListener("mouseup", this.onMouseUp, true)
      document.removeEventListener("contextmenu", this.onContextMenu, true)
      this.observer.disconnect()
      this.overlay.remove()
      this.coloursObserver?.disconnect()
   }

   onRectangleSelect(func: (data: RectangleData) => void): this {
      this.rectangleSelectionCallback = func
      return this
   }
}
