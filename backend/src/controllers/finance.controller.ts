import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getFinancialReport = async (req: Request, res: Response) => {
  try {
    // 1. Total Revenue (Income from Sales category)
    const revenueResult = await prisma.financialLedger.aggregate({
      where: { type: 'INCOME', category: 'SALES_REVENUE' },
      _sum: { amount: true }
    });
    const totalRevenue = revenueResult._sum.amount || 0;

    // 2. Total Expenses
    const expenseResult = await prisma.financialLedger.aggregate({
      where: { type: 'EXPENSE' },
      _sum: { amount: true }
    });
    const totalExpense = expenseResult._sum.amount || 0;

    // 3. Calculate Gross Profit from Sales Items (PRD Logic 3)
    // Formula: Sum( (price_at_buy - cost_at_buy) * qty )
    const orderItemsResult = await prisma.$queryRaw<any[]>`
      SELECT 
        SUM(( "priceAtBuy" - "costAtBuy" ) * "qty") as gross_profit
      FROM "OrderItem"
    `;
    const grossProfit = orderItemsResult[0]?.gross_profit || 0;

    // 4. Net Profit (Gross Profit - Operations Expense or Total Expenses)
    // Category: OPERATIONAL_EXPENSE
    const operationalResult = await prisma.financialLedger.aggregate({
      where: { type: 'EXPENSE', category: 'OPERATIONAL_EXPENSE' },
      _sum: { amount: true }
    });
    const totalOperational = operationalResult._sum.amount || 0;
    
    // Net Profit = Gross Profit - Operational Expense
    const netProfit = Number(grossProfit) - Number(totalOperational);

    res.json({
      revenue: totalRevenue,
      expenses: totalExpense,
      grossProfit: Number(grossProfit),
      operationalExpenses: totalOperational,
      netProfit: netProfit
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate financial reports', details: error });
  }
};

export const createLedgerEntry = async (req: Request, res: Response) => {
  try {
    const { type, category, amount, referenceId, description } = req.body;
    const ledger = await prisma.financialLedger.create({
      data: { type, category, amount, referenceId, description }
    });
    res.status(201).json(ledger);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create entry' });
  }
};

export const getLedgerEntries = async (req: Request, res: Response) => {
  try {
    const entries = await prisma.financialLedger.findMany({
      orderBy: { transactionDate: 'desc' }
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
};
