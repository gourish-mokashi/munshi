import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { getGeneralAnalytics, getSalesAnalytics } from "../controllers/analyticsControllers";

const analyticsRouter: ExpressRouter = Router();

analyticsRouter.get("/sales", getSalesAnalytics);
analyticsRouter.get("/general", getGeneralAnalytics);

export default analyticsRouter;
    