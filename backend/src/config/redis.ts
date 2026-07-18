import dotenv from "dotenv"
import Redis from "ioredis";

export const redis = new Redis(process.env.REDIS_URL!);


