import Redis from "./libraries/redis";
import WebPush from "web-push";

const publicVapidKey =
  "BGHJ5Y0e5iWHZhnwWJTkHeCh6fgVUXPCusbTL_Whsy0DkWepjjT9KDCbt4pNnZZvtUAEIKsGY9KexBzk2FBHQv4";
const privateVapidKey = "f-0H2LZVNps4YUHo9CfcivgxWCR-cXdKLKAOd9tPUDw";

WebPush.setVapidDetails(
  "mailto:ayodeleyniyii@gmail.com",
  publicVapidKey,
  privateVapidKey
);

export async function addPnSubscription(userEmail: string, subscription: any) {
  let userSubscriptions: any = await Redis.getKey(`pnsub_${userEmail}`);
  userSubscriptions = userSubscriptions && JSON.parse(userSubscriptions.trim());
  userSubscriptions = userSubscriptions || [];

  userSubscriptions.push(subscription);

  await Redis.setWithExpiry(
    `pnsub_${userEmail}`,
    JSON.stringify(userSubscriptions),
    259200 // 3days
  );
}

export async function popPnSubscription(userEmail: string) {
  let userSubscriptions: any = await Redis.getKey(`pnsub_${userEmail}`);
  if (!userSubscriptions) return;
  userSubscriptions = userSubscriptions && JSON.parse(userSubscriptions.trim());
  userSubscriptions = userSubscriptions || [];
  userSubscriptions.pop();

  await Redis.setWithExpiry(
    `pnsub_${userEmail}`,
    JSON.stringify(userSubscriptions),
    259200 // 3days
  );

  let userSubscriptions2: any = await Redis.getKey(`pnsub_${userEmail}`);
}

export async function Push(
  userEmail: string,
  data: {
    from: string;
    body: string;
    icon: string;
  }
) {
  try {
    let userSubscriptions: any = await Redis.getKey(`pnsub_${userEmail}`);
    if (!userSubscriptions) return;
    userSubscriptions = userSubscriptions ? JSON.parse(userSubscriptions) : [];

    if (userSubscriptions.length)
      WebPush.sendNotification(
        userSubscriptions[userSubscriptions.length - 1],
        JSON.stringify(data)
      );
  } catch (error) {
    console.log("Web Notification Failed!");
    console.log(error);
  }
}

export default WebPush;
