import prisma from "../lib/prisma";
import {USER} from "../constants/roles";

class UsersService {

    async updateOneById(user, data) {
        const {password, ...userInfo} = await prisma.user.update({
            where: {id: user.id},
            data: {
                ...data,
                email_confirmed: data.email_confirmed ? data.email_confirmed : (
                    data.email ? data.email !== user.email ? null : user.email_confirmed : user.email_confirmed
                )
            }
        })
        return userInfo
    }

    async findOneByUsername(username: string) {
        return await prisma.user.findUnique({
            where: {username},
            include: {
                vk: true
            }
        })
    }

    async create(username: string, email: string, password: string, role = USER) {
        return await prisma.user.create({
            data: {
                username, email, password, role: role as "ADMIN" | "USER"
            }
        })
    }

    async findOneById(id: any) {
        return await prisma.user.findUnique({
            where: {id},
            include: {
                vk: true
            }
        })
    }

    async findOneByEmail(toSearch: any) {

        return await prisma.user.findUnique({
            where: {
                email: toSearch
            }
        })
    }
}

export default new UsersService()