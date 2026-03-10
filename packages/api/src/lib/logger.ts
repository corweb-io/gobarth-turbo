import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

export const logger = pino({
  level: isProduction ? "info" : "debug",
  ...(isProduction
    ? {
        transport: {
          target: "pino-axiom",
          options: {
            dataset: process.env.AXIOM_DATASET ?? "",
            token: process.env.AXIOM_TOKEN ?? "",
          },
        },
      }
    : {
        transport: {
          target: "pino-pretty",
          options: { colorize: true },
        },
      }),
});
