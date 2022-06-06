import prisma from "../lib/prisma";
import {ErrorHandler} from "../lib/errorHandler";

class FoodService {

    async deleteOneById(id) {
        return await prisma.food.delete({
            where: {id: Number(id)}
        })
    }

    async updateOneById(id, foodUpdateDTO) {
        const {
            title, price, description, thumbnailId, categories
        } = foodUpdateDTO
        const candidate = await prisma.food.findUnique({
            where: {id: Number(id)}
        })
        if (!candidate) throw new ErrorHandler(401, "Такого блюда нет в базе данных")
        return await prisma.food.update({
            where: {id: Number(id)},
            data: {
                title, price, description, thumbnailId, categories: {
                    set: categories.map(c => ({id: c}))
                },
            },
            include: {
                categories: true
            }
        })
    }

    async create(foodDTO) {
        const {
            title, price, description, thumbnailId, categories
        } = foodDTO
        return await prisma.food.create({
            data: {
                title, price, description, thumbnailId, categories: {
                    connect: categories.map(c => ({id: c}))
                }
            },
            include: {
                categories: true
            }
        })
    }

    async getAll() {
        return await prisma.food.findMany({
            include: {
                categories: true
            }
        })
    }

    async findFoodInList(foodList: any) {
        return await prisma.food.findMany({
            where: {
                id: {
                    in: foodList.map(f => f?.id || -1)
                }
            },
            select: {
                id: true
            }
        })
    }
}

export default new FoodService()