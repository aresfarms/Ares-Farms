export function getAccessLevel(subscription: any) {
  if (!subscription) return "FREE";

  switch (subscription.plan) {
    case "REPORT_ACCESS":
      return "REPORT_ACCESS";
    case "PAID_NEWSLETTER":
      return "PAID_NEWSLETTER";
    case "ENVIRONMENTAL_CERTIFIED":
      return "ENVIRONMENTAL_CERTIFIED";
    default:
      return "FREE";
  }
}

export function canAccess(user: any, required: string) {
  const level = getAccessLevel(user?.subscriptions?.[0]);

  const hierarchy = [
    "FREE",
    "PAID_NEWSLETTER",
    "REPORT_ACCESS",
    "ENVIRONMENTAL_CERTIFIED",
  ];

  return hierarchy.indexOf(level) >= hierarchy.indexOf(required);
}
