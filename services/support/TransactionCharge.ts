class TransactionCharge {
  public static calculateTransferCharge(amount: number) {
    return Math.ceil((0.2 / 100) * amount);
  }
  public static calculateWithdrawCharge(amount: number) {
    return (0.5 / 100) * amount;
  }
}

export default TransactionCharge;
