import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    // Parse JSON fields
    const parsed = products.map(p => ({
      ...p,
      sizes: p.sizes ? JSON.parse(p.sizes) : [],
      stockPerSize: p.stockPerSize ? JSON.parse(p.stockPerSize) : {},
    }));
    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products', details: error });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({
      ...product,
      sizes: product.sizes ? JSON.parse(product.sizes) : [],
      stockPerSize: product.stockPerSize ? JSON.parse(product.stockPerSize) : {},
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      name, description, category, imageUrl, brand, material,
      color, weight, sizes, stockPerSize, discount,
      costPrice, sellingPrice, stock, minStock,
    } = req.body;
    const product = await prisma.product.create({
      data: {
        name, description, category, imageUrl, brand, material,
        color, weight,
        sizes: sizes ? JSON.stringify(sizes) : null,
        stockPerSize: stockPerSize ? JSON.stringify(stockPerSize) : null,
        discount: discount ?? 0,
        costPrice, sellingPrice, stock, minStock,
      },
    });
    res.status(201).json({
      ...product,
      sizes: product.sizes ? JSON.parse(product.sizes) : [],
      stockPerSize: product.stockPerSize ? JSON.parse(product.stockPerSize) : {},
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product', details: error });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const {
      name, description, category, imageUrl, brand, material,
      color, weight, sizes, stockPerSize, discount,
      costPrice, sellingPrice, stock, minStock,
    } = req.body;
    const product = await prisma.product.update({
      where: { id },
      data: {
        name, description, category, imageUrl, brand, material,
        color, weight,
        sizes: sizes !== undefined ? JSON.stringify(sizes) : undefined,
        stockPerSize: stockPerSize !== undefined ? JSON.stringify(stockPerSize) : undefined,
        discount: discount ?? undefined,
        costPrice, sellingPrice, stock, minStock,
      },
    });
    res.json({
      ...product,
      sizes: product.sizes ? JSON.parse(product.sizes) : [],
      stockPerSize: product.stockPerSize ? JSON.parse(product.stockPerSize) : {},
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    // Delete order items referencing this product first
    await prisma.orderItem.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};
