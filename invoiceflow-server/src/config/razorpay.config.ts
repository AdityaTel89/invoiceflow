import Razorpay from 'razorpay'

export const razorpayClient = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export const RAZORPAY_CONFIG = {
  routeEnabled: process.env.RAZORPAY_ROUTE_ENABLED === 'true',
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET!,
  keyId: process.env.RAZORPAY_KEY_ID!,
}

export default razorpayClient
