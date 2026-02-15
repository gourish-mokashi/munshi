import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { createProduct, deleteProduct, getProductById, updateProduct } from "../controllers/productControllers";

const productRouter: ExpressRouter = Router();

productRouter.get("/:productId", getProductById);

productRouter.post("/new/", createProduct);

productRouter.put("/:productId", updateProduct);

productRouter.delete("/:productId", deleteProduct);

export default productRouter;