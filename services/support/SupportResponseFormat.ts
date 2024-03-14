import { Response } from "express";

class TransactionResponseFormat {
  public static resolveAccountDetails(res: Response, actionData: any): Response {
    const { account_number, account_name, bank_id } = actionData;

    const response: any = {};
    const statusCode = 200;
    const success = true;
    const message = "ok";
    const data: any = {};

    data["account_number"] = account_number;
    data["account_name"] = account_name;

    response.success = success;
    response.message = message;
    response.data = data;

    res.status(statusCode);
    res.json(response);

    return res;
  }

  public static getBanks(res: Response, actionData: any): Response {
    const bankdetails = actionData.map((bank: any) => {
      const { id, name, slug, code, type, active } = bank;
      return {
        id,
        name,
        slug,
        code,
        type,
        active
      };
    });

    const response: any = {};
    const statusCode = 200;
    const success = true;
    const message = "ok";

    const data: any = bankdetails;

    response.success = success;
    response.message = message;
    response.data = data;

    res.status(statusCode);
    res.json(response);

    return res;
  }

  public static calculateCharge(res: Response, actionData: any): Response {
    const response: any = {};
    const statusCode = 200;
    const success = true;
    const message = "ok";
    const data: any = {};

    data["charge"] = actionData;

    response.success = success;
    response.message = message;
    response.data = data;

    res.status(statusCode);
    res.json(response);

    return res;
  }
}

export default TransactionResponseFormat;
