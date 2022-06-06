import prisma from "../lib/prisma";
import FoodService from "./Food.service";
import {ErrorHandler} from "../lib/errorHandler";
import {USER} from "../constants/roles";

class OrdersService {
    async create(user, orderDTO) {
        const {
            foodList, address, phone, name
        } = orderDTO
        const food = await FoodService.findFoodInList(foodList)
        const mappedFood = foodList.filter(withCount => food.some(f => f.id === withCount.id)).map(f => ({foodId: f.id, count: f.count}))
        if (mappedFood.length < 1) throw new ErrorHandler(401, "Не указано ни одного блюда")
        if (mappedFood.some(f => isNaN(f.count) || f.count < 1)) throw new ErrorHandler(401, "Не верно указано количество одного из блюд")
        return await prisma.order.create({
            data: {
                address, phone, name, userId: user?.id, food_list: {
                    createMany: {
                        data: mappedFood
                    }
                }
            }
        })
    }

    async updateOneById(user, id, orderUpdateDTO) {
        const candidate = await prisma.order.findUnique({
            where: {id: Number(id)}, include: {user: true}
        })
        if (!candidate) throw new ErrorHandler(401, "Такого заказа не существует")
        if (candidate.userId !== user.id && user.role === USER) throw new ErrorHandler(401, "Вы не можете изменить этот заказ")
        return await prisma.order.update({
            where: {id: Number(id)},
            data: {
                address: orderUpdateDTO.address,
                paid: orderUpdateDTO.paid,
                status: orderUpdateDTO.status
            },
            include: {
                food_list: {
                    select: {
                        count: true,
                        food: true
                    }
                }
            }
        })
    }

    async getAll() {
        return await prisma.order.findMany({
            orderBy: {
                created_at: "desc"
            },
            include: {
                food_list: {
                    select: {
                        count: true,
                        food: true
                    }
                }
            }
        })
    }

    async getUserOrders(user: any) {
        return await prisma.order.findMany({
            orderBy: {
                created_at: "desc"
            },
            where: {
                userId: user.id
            }
        })
    }
}

export default new OrdersService()