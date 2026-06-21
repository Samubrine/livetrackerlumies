import { mapNotificationFeedItem } from "@/lib/dashboard";
import { listNotifications } from "@/lib/db/notifications";

export async function GET() {
  const notifications = await listNotifications();

  return Response.json({
    notifications: notifications.map(mapNotificationFeedItem),
  });
}
