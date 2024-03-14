import { Request, Response, NextFunction } from "express";
import PaystackService from "../PaystackService";
import SupportResponseFormat from "./SupportResponseFormat";
import TransactionCharge from "./TransactionCharge";

const paystackService = new PaystackService();

class SupportController {
  public static async resolveAccountDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { account_number, bank_code } = req.body;
      const action = await paystackService.resolveAccountDetails(account_number, bank_code);
      return SupportResponseFormat.resolveAccountDetails(res, action);
    } catch (e) {
      next(e);
    }
  }

  public static async getBanks(req: Request, res: Response, next: NextFunction) {
    try {
      const action = await paystackService.listBankCodes();
      return SupportResponseFormat.getBanks(res, action);
    } catch (e) {
      next(e);
    }
  }

  public static async calculateCharge(req: Request, res: Response, next: NextFunction) {
    try {
      const { transaction_type, amount } = req.body;

      let action: any = null;

      if (transaction_type === "transfer")
        action = TransactionCharge.calculateTransferCharge(amount);

      if (transaction_type === "withdraw")
        action = TransactionCharge.calculateWithdrawCharge(amount);

      return SupportResponseFormat.calculateCharge(res, action);
    } catch (e) {
      next(e);
    }
  }
}

export default SupportController;
