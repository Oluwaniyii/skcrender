import { Router } from "express";
import SupportController from "./SupportController";

const router: Router = Router();

router.post("/verify-account", SupportController.resolveAccountDetails);
router.get("/banks", SupportController.getBanks);
router.post("/calculate-charge", SupportController.calculateCharge);

export default router;
