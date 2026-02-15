import { prisma } from "../exports/prisma";
import type { Request, Response } from "express";

export async function getProductById(
  req: Request,
  res: Response,
): Promise<void> {
  const { productId } = req.params;

  if (!productId) {
    res.status(400).json({
      success: false,
      error: "Product ID is required",
    });
    return;
  }

  try {
    const product = await prisma.productDetails.findUnique({
      where: { id: productId as string, userId: req.user?.id },
    });

    if (!product) {
      res.status(404).json({
        success: false,
        error: "Product does not exist",
      });
      return;
    }

    res.json({
      success: true,
      data: product,
    });
    return;
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while fetching the product",
    });
    return;
  }
}

export async function createProduct(
  req: Request,
  res: Response,
): Promise<void> {
  const { name, purchasePrice, sellingPrice, expiryDate } = req.body;

  if (!name || !purchasePrice || !sellingPrice || !expiryDate) {
    res.status(400).json({
      success: false,
      error:
        "All fields (name, purchasePrice, sellingPrice, expiryDate) are required",
    });
    return;
  }

  try {
    const newProduct = await prisma.productDetails.create({
      data: {
        name,
        purchasePrice,
        sellingPrice,
        expiryDate: new Date(expiryDate).toISOString(),
        userId: req.user?.id,
      },
    });

    res.status(201).json({
      success: true,
      data: newProduct,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while creating the product",
    });
  }
}

export async function updateProduct(
  req: Request,
  res: Response,
): Promise<void> {
  const { productId } = req.params;
  const { name, purchasePrice, sellingPrice, expiryDate } = req.body;

  if (!productId) {
    res.status(400).json({
      success: false,
      error: "Product ID is required",
    });
    return;
  }

  try {
    const updatedProduct = await prisma.productDetails.update({
      where: { id: productId as string, userId: req.user?.id },
      data: {
        name,
        purchasePrice,
        sellingPrice,
        expiryDate,
      },
    });

    res.json({
      success: true,
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while updating the product",
    });
  }
}

export async function deleteProduct(
  req: Request,
  res: Response,
): Promise<void> {
  const { productId } = req.params;

  if (!productId) {
    res.status(400).json({
      success: false,
      error: "Product ID is required",
    });
    return;
  }

  try {
    await prisma.productDetails.delete({
      where: { id: productId as string, userId: req.user?.id },
    });

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while deleting the product",
    });
  }
}
