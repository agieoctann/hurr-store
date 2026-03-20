import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../lib/prisma';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users', details: error });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { role } = req.body;
    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true, createdAt: true },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user', details: error });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  try {
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted successfully' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    // PostgreSQL cascade: try manual cascade
    try {
      const orders = await prisma.order.findMany({ where: { userId: id }, select: { id: true } });
      for (const o of orders) {
        await prisma.orderItem.deleteMany({ where: { orderId: o.id as string } });
      }
      await prisma.order.deleteMany({ where: { userId: id } });
      await prisma.address.deleteMany({ where: { userId: id } });
      await prisma.user.delete({ where: { id } });
      res.json({ message: 'User deleted successfully' });
    } catch {
      res.status(500).json({ error: 'Failed to delete user', details: msg });
    }
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, phone: true, role: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, phone, password } = req.body;

    const data: Record<string, unknown> = {};
    if (name  !== undefined) data.name  = name;
    if (phone !== undefined) data.phone = phone;
    if (password) data.passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile', details: error });
  }
};
