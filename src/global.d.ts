interface Window {
   workers: Worker[]
   sendMessage: <K extends keyof RplaceMessages>(
      type: K,
      data: RplaceMessages[K],
   ) => void
   cooldown: number
   currentOperation: string
   cooldownExpireTime: number
}

type RectangleData = {
   currentColor: string
   colorIndex: number
   startX: number
   startY: number
   endX: number
   endY: number
}

type RplaceMessages = {
   // Connection
   stop: undefined
   connect: {
      device: string
      server: string
      vip?: string
   }

   // Pixel placement
   putPixel: { position: number; colour: number }
   requestPixelPlacers: { position: number; width: number; height: number }

   // Chat - live
   sendLiveChatMsg: { message: string; channel: string; replyId: number | null }
   requestLoadChannelPrevious: {
      channel: string
      anchorMsgId: number
      msgCount?: number
   }
   chatReport: { messageId: number; reason: string }
   chatReact: { messageId: number; reactKey: string }

   // Chat - place
   sendPlaceChatMsg: { message: string; position: number }

   // Naming
   setName: string

   // Spectating
   spectateUser: number
   unspectateUser: undefined

   // Captcha
   sendCaptchaResult: { captchaId: number; result: string }
   sendHCaptchaResult: { captchaId: number; result: string }
   sendTurnstileResult: { captchaId: number; result: string }
   sendChallengeResult: any

   // Moderation
   sendModAction: {
      action: "kick" | "mute" | "ban" | "captcha" | "delete"
      reason: string
      memberId?: number
      messageId?: number
      duration?: number
      affectsAll?: boolean
   }

   // Automation
   informAutomatedActivity: {
      windowOuterWidth: number
      windowInnerWidth: number
      windowOuterHeight: number
      windowInnerHeight: number
      localStorage: Record<string, string>
   }

   // IPC cross-frame (postsFrame)
   onlineCounter: number
   tryLoadBottomPosts: undefined
   updateDialogTop: number
}

type RPlaceStatus = {
   version: "legacy"
   uptime: number
   instance: {
      id: number
      name: string
      icon: string
   }
   canvas: {
      width: number
      height: number
      cooldown: number
   }
}
