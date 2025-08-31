import { UserApi } from "@/api";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);

    const eventType = evt.type;

    if (eventType === "user.created") {
      if (!evt.data.username) {
        return new Response("Username is required", { status: 400 });
      }

      await UserApi.create({
        avatarUrl: evt.data.image_url,
        id: evt.data.id,
        username: evt.data.username,
      });

      return new Response("User created", { status: 200 });
    }

    if (eventType === "user.updated") {
      if (!evt.data.username) {
        return new Response("Username is required", { status: 400 });
      }

      await UserApi.update({
        avatarUrl: evt.data.image_url,
        id: evt.data.id,
        username: evt.data.username,
      });

      return new Response("User updated", { status: 200 });
    }

    return new Response("Webhook received", { status: 200 });
  } catch {
    return new Response("Error verifying webhook", { status: 400 });
  }
}
