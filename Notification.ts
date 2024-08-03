import { log } from "winston";
import Redis from "./libraries/redis";
import WebPush from "web-push";
import winston from "./utils/logger/winston";

const publicVapidKey =
  "BGHJ5Y0e5iWHZhnwWJTkHeCh6fgVUXPCusbTL_Whsy0DkWepjjT9KDCbt4pNnZZvtUAEIKsGY9KexBzk2FBHQv4";
const privateVapidKey = "f-0H2LZVNps4YUHo9CfcivgxWCR-cXdKLKAOd9tPUDw";

WebPush.setVapidDetails(
  "mailto:ayodeleyniyii@gmail.com",
  publicVapidKey,
  privateVapidKey
);

export async function addPnSubscription(userEmail: string, subscription: any) {
  try {
    let userSubscriptions: any = await Redis.getKey(`pnsub_${userEmail}`);
    userSubscriptions =
      (userSubscriptions?.trim() && JSON.parse(userSubscriptions)) || [];

    userSubscriptions.push(subscription);

    await Redis.setWithExpiry(
      `pnsub_${userEmail}`,
      JSON.stringify(userSubscriptions),
      259200 // 3days
    );
  } catch (e) {
    console.log(e);
    winston.error("addPnSubscription error", e);
  }
}

export async function popPnSubscription(userEmail: string) {
  try {
    let userSubscriptions: any = await Redis.getKey(`pnsub_${userEmail}`);
    if (!userSubscriptions) return;
    userSubscriptions =
      (userSubscriptions?.trim() && JSON.parse(userSubscriptions)) || [];

    userSubscriptions = userSubscriptions.pop();

    await Redis.setWithExpiry(
      `pnsub_${userEmail}`,
      JSON.stringify(userSubscriptions),
      259200 // 3days
    );

    console.log(await Redis.getKey(`pnsub_${userEmail}`));
  } catch (e) {
    console.log(e);
    winston.error("popPnSubscription error", e);
  }
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
