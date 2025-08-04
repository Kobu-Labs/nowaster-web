import { UserApi } from "@/api";
import { verifyWebhook } from "@clerk/nextjs/webhooks";

export async function POST(req: Request) {
  try {
    const evt = await verifyWebhook(req);

    const { id } = evt.data;
    const eventType = evt.type;
    console.log(
      `Received webhook with ID ${id} and event type of ${eventType}`,
    );
    console.log("Event data:", evt.data);

    if (eventType === "user.created") {
      if (!evt.data.username) {
        console.error("Username is required");
        return new Response("Username is required", { status: 400 });
      }

      await UserApi.create({
        id: evt.data.id,
        username: evt.data.username,
        avatarUrl: evt.data.image_url,
      });

      return new Response("User created", { status: 200 });
    }

    if (eventType === "user.updated") {
      if (!evt.data.username) {
        console.error("Username is required");
        return new Response("Username is required", { status: 400 });
      }

      await UserApi.update({
        id: evt.data.id,
        username: evt.data.username,
        avatarUrl: evt.data.image_url,
      });

      return new Response("User updated", { status: 200 });
    }

    return new Response("Webhook received", { status: 200 });
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }
}
