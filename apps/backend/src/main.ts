import Fastify from "fastify";
import mongoose from "mongoose";
import { predictionsRoutes } from "./routes/prediction.js";

const fastify = Fastify({ logger: true });

fastify.register(predictionsRoutes, { prefix: "/api" });

const startServer = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/sportscentral");
    fastify.log.info("✅ MongoDB allSet");

    const PORT = Number(process.env.PORT) || 3000;
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    fastify.log.info(`✅ Server running at http://0.0.0.0:${PORT}`);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    fastify.log.error(`❌ Server error: ${errorMessage}`);
    process.exit(1);
  }
};

startServer();