import type { Plugin } from "vite";

/** Hardcoded in client/index.html as the default stream; replaced at build time. */
export const DEFAULT_GA_MEASUREMENT_ID = "G-NSDJ4NSEDH";

/** Set `VITE_GA_MEASUREMENT_ID` (or `GA_MEASUREMENT_ID`) to match the web stream under your GA4 property. */
export function injectGaMeasurementId(): Plugin {
  const id =
    process.env.VITE_GA_MEASUREMENT_ID?.trim() ||
    process.env.GA_MEASUREMENT_ID?.trim() ||
    DEFAULT_GA_MEASUREMENT_ID;
  return {
    name: "inject-ga-measurement-id",
    transformIndexHtml(html) {
      return html.split(DEFAULT_GA_MEASUREMENT_ID).join(id);
    },
  };
}
