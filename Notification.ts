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
  console.log(subscription);

  let userSubscriptions: any = await Redis.getKey(`pnsub_${userEmail}`);
  userSubscriptions = userSubscriptions ? JSON.parse(userSubscriptions) : [];
  userSubscriptions.push(subscription);

  await Redis.setWithExpiry(
    `pnsub_${userEmail}`,
    JSON.stringify(userSubscriptions),
    259200 // 3days
  );
}

export async function popPnSubscription(userEmail: string) {
  console.log("calling popPnSubscription");
  console.log(await Redis.getKey(`pnsub_${userEmail}`));
  let userSubscriptions: any = await Redis.getKey(`pnsub_${userEmail}`);
  if (!userSubscriptions) return;

  userSubscriptions = userSubscriptions ? JSON.parse(userSubscriptions) : [];

  console.log("old userSubscriptions");
  console.log(userSubscriptions);

  userSubscriptions = userSubscriptions.pop();

  console.log("upd userSubscriptions");
  console.log(userSubscriptions);

  await Redis.setWithExpiry(
    `pnsub_${userEmail}`,
    JSON.stringify(userSubscriptions),
    259200 // 3days
  );

  console.log(await Redis.getKey(`pnsub_${userEmail}`));
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
    console.log("Internal Push..");
    console.log(userEmail, data);

    let userSubscriptions: any = await Redis.getKey(`pnsub_${userEmail}`);
    if (!userSubscriptions) return;
    userSubscriptions = userSubscriptions ? JSON.parse(userSubscriptions) : [];

    console.log("userSubscriptions");
    console.log(userSubscriptions);
    console.log("userSubscriptions[0]");
    console.log(userSubscriptions[0]);

    if (userSubscriptions.length)
      WebPush.sendNotification(userSubscriptions[0], JSON.stringify(data));
  } catch (error) {
    console.log("Web Notification Failed!");
    console.log(error);
  }
}

export default WebPush;
