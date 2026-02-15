#!/usr/bin/env node
import "dotenv/config";
import { prisma } from "./exports/prisma";



const commands = {
  "get-products": getProducts,
  "get-stock": getStock,
  "get-transactions": getTransactions,
  "get-analytics": getAnalytics,
  "get-summary": getSummary,
  "search-product": searchProduct,
  "get-low-stock": getLowStock,
  "get-expiring": getExpiring,
  "get-top-selling": getTopSelling,
  "get-low-selling": getLowSelling,
  "get-payment-breakdown": getPaymentBreakdown,
  "create-product": createProduct,
  "update-product": updateProduct,
  "delete-product": deleteProduct,
  "update-stock": updateStock,
  "help": showHelp,
};

async function getProducts(args: string[]) {
  const userId = args[0] as string | undefined;
  const limit = args[1] ? parseInt(args[1]) : undefined;
  
  if(!userId){
    return { error: "User ID is required" };
  }
  // only include name, purchase price, selling price, and expiry date for each product, along with current stock quantity
  const products = await prisma.productDetails.findMany({

      where: {
        userId: userId,
      },
    select: {
      id: true,
      name: true,
      purchasePrice: true,
      sellingPrice: true,
      expiryDate: true,
      productStocks: {
        select: {
          quantity: true,
        },
      },
    },
    ...(limit !== undefined && { take: limit }),
  });
  
  return {
    count: products.length,
    products,
  };
}

async function getStock(args: string[]) {
  const userId = args[0];
  const productId = args[1];
  if(!userId) {
    return { error: "User ID is required" };
  }
  
  if (productId) {
    const stock = await prisma.currentStock.findUnique({
      where: { productId, userId },
      select: {
        quantity: true,
        productId: true,
        product: {
            select: {
                name: true,
            },
        },
      },
    });
    return stock;
  }
  
  const allStock = await prisma.currentStock.findMany({
    where: { userId },
    select: {
      quantity: true,
      productId: true,
      product: {
        select: {
          name: true,
        },
      },
    },
  });
  
  return {
    count: allStock.length,
    stock: allStock,
  };
}

async function getTransactions(args: string[]) {
  const userId = args[0];
  const days = args[1] ? parseInt(args[1]) : 7;
  const limit = args[2] ? parseInt(args[2]) : 50;

  if(!userId) {
    return { error: "User ID is required" };
  }
  
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: userId,
      createdAt: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
    },
    select: {
        id: true,
        totalAmount: true,
        paymentMethod: true,
        items: {
            select: {
                productId: true,
                quantity: true,
                product: {
                    select: {
                        name: true,
                    },
                },
            },
        },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  
  const totalAmount = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
  
  return {
    count: transactions.length,
    totalAmount,
    transactions,
  };
}

async function getAnalytics(args: string[]) {
  const userId = args[0];
  const period = args[1] || "daily"; // daily, monthly, yearly
  
  if(!userId) {
    return { error: "User ID is required" };
  }
  if (period === "daily") {
    const dailyRows = await prisma.$queryRaw<
      { day: string; total: number; count: bigint }[]
    >`
      SELECT
        DATE("createdAt") as day,
        SUM("totalAmount") as total,
        COUNT(*) as count
      FROM "Transaction"
      WHERE "createdAt" >= CURRENT_DATE - INTERVAL '30 days' AND "userId" = ${userId}
      GROUP BY day
      ORDER BY day DESC
    `;
    
    return {
      period: "daily",
      data: dailyRows.map(r => ({
        date: r.day,
        revenue: Number(r.total),
        transactionCount: Number(r.count),
      })),
    };
  }
  
  if (period === "monthly") {
    const monthlyRows = await prisma.$queryRaw<
      { month: number; year: number; total: number; count: bigint }[]
    >`
      SELECT
        EXTRACT(MONTH FROM "createdAt") as month,
        EXTRACT(YEAR FROM "createdAt") as year,
        SUM("totalAmount") as total,
        COUNT(*) as count
      FROM "Transaction"
      WHERE "createdAt" >= CURRENT_DATE - INTERVAL '12 months' AND "userId" = ${userId}
      GROUP BY year, month
      ORDER BY year DESC, month DESC
    `;
    
    return {
      period: "monthly",
      data: monthlyRows.map(r => ({
        month: r.month,
        year: r.year,
        revenue: Number(r.total),
        transactionCount: Number(r.count),
      })),
    };
  }
  
  return { error: "Invalid period. Use: daily, monthly, yearly" };
}

async function getSummary(args: string[]) {
  const userId = args[0];
  if (!userId) {
    return { error: "User ID is required" };
  }
  
  const [productCount, stockCount, transactionCount] = await Promise.all([
    prisma.productDetails.count({ where: { userId } }),
    prisma.currentStock.count({ where: { userId } }),
    prisma.transaction.count({ where: { userId } }),
  ]);
  
  const currentStock = await prisma.currentStock.findMany({
    include: { product: true },
    where: { userId },
  });
  
  const totalInventoryValue = currentStock.reduce(
    (sum, s) => sum + s.quantity * s.product.purchasePrice,
    0
  );
  
  const totalSellingValue = currentStock.reduce(
    (sum, s) => sum + s.quantity * s.product.sellingPrice,
    0
  );
  
  const totalRevenue = await prisma.transaction.aggregate({
    _sum: { totalAmount: true },
    where: { userId },
  });
  
  const lowStock = currentStock.filter(s => s.quantity < 10);
  const outOfStock = currentStock.filter(s => s.quantity === 0);
  
  return {
    products: productCount,
    stockItems: stockCount,
    totalTransactions: transactionCount,
    totalRevenue: totalRevenue._sum.totalAmount || 0,
    inventoryValue: totalInventoryValue,
    potentialSellingValue: totalSellingValue,
    potentialProfit: totalSellingValue - totalInventoryValue,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
  };
}

async function searchProduct(args: string[]) {
  const userId = args[0];
  if (!userId) {
    return { error: "User ID is required" };
  }

  const searchTerm = args.join(" ");
  
  if (!searchTerm) {
    return { error: "Please provide a search term" };
  }
  
  const products = await prisma.productDetails.findMany({
    where: {
      name: {
        contains: searchTerm,
        mode: 'insensitive',
      },
      userId: userId,
    },
    select: {
      id: true,
      name: true,
      purchasePrice: true,
      sellingPrice: true,
      expiryDate: true,
      productStocks: {
        select: {
          quantity: true,
        },
      },
    },
  });
  
  return {
    searchTerm,
    count: products.length,
    products,
  };
}

async function getLowStock(args: string[]) {
  const userId = args[0];
  if (!userId) {
    return { error: "User ID is required" };
  }
  const threshold = args[1] ? parseInt(args[1]) : 10;
  
  const lowStock = await prisma.currentStock.findMany({
    where: {
      userId: userId,
      quantity: {
        lt: threshold,
      },
    },
    select: {
      quantity: true,
      productId: true,
      product: {
        select: {
          name: true,
        },
      },
    },
  });
  
  return {
    threshold,
    count: lowStock.length,
    items: lowStock,
  };
}

async function getExpiring(args: string[]) {
  const userId = args[0];
  if (!userId) {
    return { error: "User ID is required" };
  }
  const days = args[1] ? parseInt(args[1]) : 30;
  const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  
  const expiring = await prisma.productDetails.findMany({
    where: {
      userId: userId,
      expiryDate: {
        lte: futureDate,
        gte: new Date(),
      },
    },
    select: {
      id: true,
      name: true,
      expiryDate: true,
      productStocks: {
        select: {
          quantity: true,
        },
      },
    },
  });
  
  return {
    daysAhead: days,
    count: expiring.length,
    products: expiring.map(p => ({
      ...p,
      daysUntilExpiry: Math.floor(
        (new Date(p.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
    })),
  };
}

async function getTopSelling(args: string[]) {
  const userId = args[0];
  if (!userId) {
    return { error: "User ID is required" };
  }
  const limit = args[1] ? parseInt(args[1]) : 10;
  
  const topProducts = await prisma.transactionItem.groupBy({
    where: { userId },
    by: ['productId'],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit,
  });
  
  const productsWithDetails = await Promise.all(
    topProducts.map(async (item) => {
      const product = await prisma.productDetails.findUnique({
        where: { id: item.productId, userId: userId },
        select: {
          id: true,
          name: true,
          productStocks: {
            select: {
              quantity: true,
            },
          },
        },
      });
      return {
        product,
        totalSold: item._sum.quantity,
      };
    })
  );
  
  return {
    count: productsWithDetails.length,
    topSelling: productsWithDetails,
  };
}

async function getLowSelling(args: string[]) {
  const userId = args[0];
  if (!userId) {
    return { error: "User ID is required" };
  }
  const limit = args[1] ? parseInt(args[1]) : 10;
  
  const lowProducts = await prisma.transactionItem.groupBy({
    where: { userId },
    by: ['productId'],
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'asc' } },
    take: limit,
  });
  
  const productsWithDetails = await Promise.all(
    lowProducts.map(async (item) => {
      const product = await prisma.productDetails.findUnique({
        where: { id: item.productId, userId: userId },
        select: {
          id: true,
          name: true,
          productStocks: {
            select: {
              quantity: true,
            },
          },
        },
      });
      return {
        product,
        totalSold: item._sum.quantity,
      };
    })
  );
  
  return {
    count: productsWithDetails.length,
    lowSelling: productsWithDetails,
  };
}

async function getPaymentBreakdown(args: string[]) {
  const userId = args[0];
  if (!userId) {
    return { error: "User ID is required" };
  }
  const days = args[1] ? parseInt(args[1]) : 30;
  
  const breakdown = await prisma.transaction.groupBy({
    by: ['paymentMethod'],
    where: {
      userId: userId,
      createdAt: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
    },
    _sum: { totalAmount: true },
    _count: { paymentMethod: true },
  });
  
  return {
    days,
    breakdown: breakdown.map(b => ({
      method: b.paymentMethod,
      totalAmount: b._sum.totalAmount,
      transactionCount: b._count.paymentMethod,
    })),
  };
}

async function createProduct(args: string[]) {

  if (args.length < 5) {
    return { 
      error: "Missing required arguments", 
      usage: "create-product <userId> <name> <purchasePrice> <sellingPrice> <expiryDate> [initialStock]",
      example: "create-product user123 'Rice Bag' 50 75 2026-12-31 100"
    };
  }
  
  const userId = args[0]!;
  const name = args[1]!;
  const purchasePrice = args[2]!;
  const sellingPrice = args[3]!;
  const expiryDate = args[4]!;
  const initialStock = args[5];
  
  const product = await prisma.productDetails.create({
    data: {
      userId: userId,
      name,
      purchasePrice: parseFloat(purchasePrice),
      sellingPrice: parseFloat(sellingPrice),
      expiryDate: new Date(expiryDate),
      productStocks: {
        create: {
          userId: userId,
          quantity: initialStock ? parseInt(initialStock) : 0,
        },
      },
    },
    include: {
      productStocks: true,
    },
  });
  
  return {
    success: true,
    message: "Product created successfully",
    product,
  };
}

async function updateProduct(args: string[]) {
  // Expected format: productId [field=value] [field=value] ...
  if (args.length < 3) {
    return { 
      error: "Missing required arguments", 
      usage: "update-product <userId> <productId> <field=value> [field=value] ...",
      fields: ["name", "purchasePrice", "sellingPrice", "expiryDate"],
      example: "update-product user123 abc123 name='New Name' sellingPrice=100"
    };
  }
  
  const [userId, productId, ...updates] = args;
  
  const updateData: any = {};
  
  for (const update of updates) {
    const [field, value] = update.split('=');
    if (!field || !value) continue;
    
    if (field === 'name') {
      updateData.name = value.replace(/['"]/g, '');
    } else if (field === 'purchasePrice') {
      updateData.purchasePrice = parseFloat(value);
    } else if (field === 'sellingPrice') {
      updateData.sellingPrice = parseFloat(value);
    } else if (field === 'expiryDate') {
      updateData.expiryDate = new Date(value);
    }
  }
  
  if (Object.keys(updateData).length === 0) {
    return { error: "No valid fields to update" };
  }
  
  const product = await prisma.productDetails.update({
    where: { id: productId, userId: userId },
    data: updateData,
    include: {
      productStocks: true,
    },
  });
  
  return {
    success: true,
    message: "Product updated successfully",
    product,
  };
}

async function deleteProduct(args: string[]) {
  // Expected format: productId
  if (args.length < 2) {
    return { 
      error: "Missing required arguments", 
      usage: "delete-product <userId> <productId>",
      example: "delete-product user123 abc123"
    };
  }
  
  const userId = args[0]!;
  const productId = args[1]!;
  
  // First, delete the associated stock
  await prisma.currentStock.deleteMany({
    where: { productId },
  });
  
  // Then delete the product
  const product = await prisma.productDetails.delete({
    where: { id: productId, userId: userId },
  });
  
  return {
    success: true,
    message: "Product deleted successfully",
    deletedProduct: {
      id: product.id,
      name: product.name,
    },
  };
}

async function updateStock(args: string[]) {
  // Expected format: productId quantity
  if (args.length < 3) {
    return { 
      error: "Missing required arguments", 
      usage: "update-stock <userId> <productId> <quantity>",
      example: "update-stock user123 abc123 50"
    };
  }
  
  const userId = args[0]!;
  const productId = args[1]!;
  const quantity = args[2]!;
  
  const stock = await prisma.currentStock.upsert({
    where: { productId, userId },
    update: {
      quantity: parseInt(quantity),
    },
    create: {
      productId,
      quantity: parseInt(quantity),
      userId,
    },
    include: {
      product: {
        select: {
          name: true,
        },
      },
    },
  });
  
  return {
    success: true,
    message: "Stock updated successfully",
    stock,
  };
}

function showHelp() {
  return {
    description: "Stock Management CLI Tool - Database wrapper for AI agents",
    commands: {
      "get-products <userId> [limit]": "Get all products (optional limit)",
      "get-stock <userId> [productId]": "Get stock info (all or specific product)",
      "get-transactions <userId> [days] [limit]": "Get recent transactions (default: 7 days, 50 limit)",
      "get-analytics <userId> [period]": "Get analytics (daily/monthly/yearly)",
      "get-summary <userId>": "Get business summary overview",
      "search-product <userId> <term>": "Search products by name",
      "get-low-stock <userId> [threshold]": "Get low stock items (default threshold: 10)",
      "get-expiring <userId> [days]": "Get expiring products (default: 30 days)",
      "get-top-selling <userId> [limit]": "Get top selling products (default: 10)",
      "get-low-selling <userId> [limit]": "Get low selling products (default: 10)",
      "get-payment-breakdown <userId> [days]": "Get payment method breakdown (default: 30 days)",
      "create-product <userId> <name> <purchasePrice> <sellingPrice> <expiryDate> [initialStock]": "Create a new product",
      "update-product <userId> <productId> <field=value> ...": "Update product details",
      "delete-product <userId> <productId>": "Delete a product",
      "update-stock <userId> <productId> <quantity>": "Update stock quantity",
      "help": "Show this help message",
    },
    examples: [
      "node dist/cli.js get-summary user123",
      "node dist/cli.js get-products user123 5",
      "node dist/cli.js search-product user123 rice",
      "node dist/cli.js get-low-stock user123 5",
      "node dist/cli.js get-transactions user123 14 100",
      "node dist/cli.js get-analytics user123 monthly",
      "node dist/cli.js create-product user123 'Rice Bag' 50 75 2026-12-31 100",
      "node dist/cli.js update-product user123 abc123 sellingPrice=80",
      "node dist/cli.js update-stock user123 abc123 150",
      "node dist/cli.js get-low-selling user123 10",
      "node dist/cli.js delete-product user123 abc123",
    ],
  };
}

async function main() {
  const [, , command, ...args] = process.argv;
  
  if (!command || !commands[command as keyof typeof commands]) {
    console.log(JSON.stringify(showHelp(), null, 2));
    process.exit(1);
  }
  
  try {
    const result = await commands[command as keyof typeof commands](args);
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (error: any) {
    console.error(JSON.stringify({ 
      error: "Command execution failed", 
      message: error.message 
    }, null, 2));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
