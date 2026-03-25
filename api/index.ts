import "dotenv/config";
import express, { type Request, type Response } from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
// Pre-compiled in Vercel `buildCommand`; no .d.ts for `.mjs` output.
// @ts-expect-error TS7016 — intentional; see server/_vercel_exports.ts
import { appRouter, createContext, stripe, handleWebhookEvent, ENV } from "./_server.mjs";

const app = express();

// Stripe webhook MUST be registered BEFORE express.json() to preserve raw body
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"];
    if (!sig) {
      res.status(400).send("No signature");
      return;
    }
    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        ENV.stripeWebhookSecret
      );
      const result = await handleWebhookEvent(event);
      res.json(result);
    } catch (err) {
      console.error("[Stripe Webhook] Error:", err);
      res.status(400).send(`Webhook Error: ${err}`);
    }
  }
);

// Configure body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

export default app;
