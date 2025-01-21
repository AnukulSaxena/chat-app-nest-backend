import { z } from "zod";

const JwtPayloadSchema = z.object({
  userName: z.string(),
  sessionId: z.string().uuid(), 
  userId: z.string(),
  iat: z.number().int(), 
  exp: z.number().int(), 
});

type JwtPayload = z.infer<typeof JwtPayloadSchema>;

function parseJwtPayload(payload: unknown): JwtPayload {
  try {
    return JwtPayloadSchema.parse(payload); 
  } catch (error) {
    console.error("Invalid JWT payload:", error);
    throw new Error("Failed to validate JWT payload");
  }
}

export { JwtPayloadSchema, parseJwtPayload };
