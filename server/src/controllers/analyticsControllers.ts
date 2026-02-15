import { prisma } from "../exports/prisma";
import type { Request, Response } from "express";

// Helper to prevent NaN and Infinity errors
const calculateAnalytics = (currentRows: any[], previousRows: any[]) => {
    const currentSum = currentRows.reduce((s, r) => s + (Number(r.total) || 0), 0);
    const prevSum = previousRows.reduce((s, r) => s + (Number(r.total) || 0), 0);

    let percentageChange = 0;
    if (prevSum > 0) {
        percentageChange = +(((currentSum - prevSum) / prevSum) * 100).toFixed(1);
    } else if (currentSum > 0) {
        percentageChange = 100;
    }

    return {
        totalRevenue: currentSum,
        percentageChange: Math.abs(percentageChange),
        isPositive: currentSum >= prevSum,
    };
};

export async function getSalesAnalytics(req: Request, res: Response): Promise<void> {
    try {
        const filter = req.query["filter"] as string || "daily";
        let data;

        if (filter === "weekly") data = await getSalesAnalyticsByWeek(req.user?.id);
        else if (filter === "monthly") data = await getSalesAnalyticsByMonth(req.user?.id);
        else data = await getSalesAnalyticsByYear(req.user?.id);

        res.json({ success: true, data });
    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
}

async function getSalesAnalyticsByWeek(userId: string) {
    const rows = await prisma.$queryRaw<{ day: Date; total: number }[]>`
        SELECT DATE_TRUNC('day', "createdAt") as day, SUM("totalAmount") as total
        FROM "Transaction"
        WHERE "createdAt" >= CURRENT_DATE - INTERVAL '13 days' AND "userId" = ${userId}
        GROUP BY day ORDER BY day ASC
    `;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create complete arrays for current period (last 7 days) and previous period (7 days before that)
    const currentPeriod = [];
    const currentPeriodRows = [];
    const previousPeriodRows = [];
    
    // Current period: last 7 days (today - 6 to today)
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const dayData = rows.find(r => {
            const rowDate = new Date(r.day);
            rowDate.setHours(0, 0, 0, 0);
            return rowDate.getTime() === date.getTime();
        });
        
        const total = dayData ? Number(dayData.total) || 0 : 0;
        
        currentPeriod.push({
            value: total,
            label: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date)
        });
        
        currentPeriodRows.push({ total });
    }
    
    // Previous period: 7 days before current period (today - 13 to today - 7)
    for (let i = 13; i >= 7; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const dayData = rows.find(r => {
            const rowDate = new Date(r.day);
            rowDate.setHours(0, 0, 0, 0);
            return rowDate.getTime() === date.getTime();
        });
        
        const total = dayData ? Number(dayData.total) || 0 : 0;
        previousPeriodRows.push({ total });
    }
    
    return { 
        currentPeriod, 
        ...calculateAnalytics(currentPeriodRows, previousPeriodRows) 
    };
}

async function getSalesAnalyticsByMonth(userId: string) {
    const rows = await prisma.$queryRaw<{ month: number; year: number; total: number }[]>`
        SELECT EXTRACT(MONTH FROM "createdAt") as month, EXTRACT(YEAR FROM "createdAt") as year, SUM("totalAmount") as total
        FROM "Transaction"
        WHERE "createdAt" >= CURRENT_DATE - INTERVAL '2 years' AND "userId" = ${userId}
        GROUP BY year, month ORDER BY year, month
    `;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-12

    // Create complete 12-month array (last 12 months from today)
    const currentPeriod = [];
    const currentPeriodRows = [];
    const previousPeriodRows = [];

    // Current period: last 12 months
    for (let i = 11; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - 1 - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        const monthData = rows.find(r => Number(r.year) === year && Number(r.month) === month);
        const total = monthData ? Number(monthData.total) || 0 : 0;
        
        currentPeriod.push({
            value: total,
            label: months[month - 1]
        });
        
        currentPeriodRows.push({ total });
    }

    // Previous period: 12 months before current period
    for (let i = 23; i >= 12; i--) {
        const date = new Date(currentYear, currentMonth - 1 - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        const monthData = rows.find(r => Number(r.year) === year && Number(r.month) === month);
        const total = monthData ? Number(monthData.total) || 0 : 0;
        
        previousPeriodRows.push({ total });
    }

    return {
        currentPeriod,
        ...calculateAnalytics(currentPeriodRows, previousPeriodRows)
    };
}

async function getSalesAnalyticsByYear(userId: string) {
    const rows = await prisma.$queryRaw<{ year: number; total: number }[]>`
        SELECT EXTRACT(YEAR FROM "createdAt") as year, SUM("totalAmount") as total
        FROM "Transaction"
        WHERE "createdAt" >= CURRENT_DATE - INTERVAL '10 years' AND "userId" = ${userId}
        GROUP BY year ORDER BY year ASC
    `;

    // Create complete last 5 year array (fill missing years with 0)
    const currentYear = new Date().getFullYear();
    const currentPeriod = [];
    const currentPeriodRows = [];
    const previousPeriodRows = [];
    
    // Current period: last 5 years
    for (let i = 4; i >= 0; i--) {
        const year = currentYear - i;
        const yearData = rows.find(r => Number(r.year) === year);
        const total = yearData ? Number(yearData.total) || 0 : 0;
        
        currentPeriod.push({
            value: total,
            label: String(year)
        });
        
        currentPeriodRows.push({ total });
    }

    // Previous period: 5 years before current period
    for (let i = 9; i >= 5; i--) {
        const year = currentYear - i;
        const yearData = rows.find(r => Number(r.year) === year);
        const total = yearData ? Number(yearData.total) || 0 : 0;
        
        previousPeriodRows.push({ total });
    }

    return {
        currentPeriod,
        ...calculateAnalytics(currentPeriodRows, previousPeriodRows)
    };
}

async function getTopSellingProduct(filter: string, userId: string) {
    try {
        const topProducts = await prisma.transactionItem.groupBy({
            where: {
                createdAt: {
                    gte: filter === "weekly" ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) :
                         filter === "monthly" ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) :
                         new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
                },
                userId: userId,
            },
            by: ['productId'],
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 1,
        });
    
        if (!topProducts || topProducts.length === 0) {
            return null;
        }
    
        const topProductId = topProducts[0]?.productId;
        const topProduct = await prisma.productDetails.findUnique({ where: { id: topProductId } });
        const unitsSold = topProducts[0]?._sum?.quantity || 0;

        return { name: topProduct?.name || null, unitsSold };
    } catch (error) {
        throw error;
    }
}   

async function getLowSellingProduct(filter: string, userId: string) {
    try {
        const lowProducts = await prisma.transactionItem.groupBy({
            where: {
                createdAt: {
                    gte: filter === "weekly" ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) :
                         filter === "monthly" ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) :
                         new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
                },
                userId: userId,
            },
            by: ['productId'],
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'asc' } },
            take: 1,
        });
    
        if (!lowProducts || lowProducts.length === 0) {
            return null;
        }
    
        const lowProductId = lowProducts[0]?.productId;
        const lowProduct = await prisma.productDetails.findUnique({ where: { id: lowProductId } });
        const unitsSold = lowProducts[0]?._sum?.quantity || 0;
        return { name: lowProduct?.name || null, unitsSold };
    } catch (error) {
        throw error;
    }
}

export async function getGeneralAnalytics(req: Request, res: Response): Promise<void> {
    try {
        const filter = req.query["filter"] as string || "monthly";
        const userId = req.user?.id;

        const topProduct = await getTopSellingProduct(filter, userId);
        const lowProduct = await getLowSellingProduct(filter, userId);

        res.json({ success: true, data: { topProduct: topProduct, lowProduct: lowProduct } });
        return;
    }
    catch (error) {
        console.error("General Analytics Error:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
        return;
    }
}