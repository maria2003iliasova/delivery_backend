import prisma from "../lib/prisma";

class CategoryService {
    async create(title) {
        return await prisma.category.create({
            data: {
                title
            }
        })
    }

    async getAll() {
        return await prisma.category.findMany({})
    }
}

export default new CategoryService()