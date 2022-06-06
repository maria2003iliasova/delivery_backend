import prisma from "../lib/prisma";
import UsersService from "./Users.service";
import {ErrorHandler} from "../lib/errorHandler";
import jwt, {JwtPayload} from "jsonwebtoken";

class VKService {

    async create(oauthDTO) {
        return await prisma.vk.upsert({
            where: {
                id: oauthDTO.id
            },
            create: {
                ...oauthDTO
            },
            update: {}
        })
    }

    async connect(userId, vkId) {
        const user = await UsersService.findOneById(userId)
        const vk = await prisma.vk.findUnique({
            where: {
                id: vkId
            }
        })
        if (!user || !vk) return true
        return await UsersService.updateOneById(user, {
            vk: {
                connect: {
                    id: vk.id
                }
            }
        })
    }

    async disconnect(userId) {
        const user = await UsersService.findOneById(userId)
        if (!user) return true
        return await UsersService.updateOneById(user, {
            vk: {
                disconnect: true
            }
        })
    }

    async exchangeToken(code) {
        try {
            const {id} = jwt.verify(code, process.env.VK_SECRET as string) as JwtPayload
            return await this.findOneById(id)
        } catch (e) {
            throw new ErrorHandler(401, "Не верный токен")
        }
    }

    async findOneById(id) {
        return await prisma.vk.findUnique({
            where: {
                id
            }
        })
    }
}

export default new VKService()