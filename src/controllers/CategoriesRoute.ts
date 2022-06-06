import {Router, Request} from "express";
import {authMiddleware} from "../lib/auth";
import CategoryService from "../services/Category.service";

const route = Router()

route.get("/", async (req, res) => {
    const categories = await CategoryService.getAll()
    return res.status(200).json(categories)
})

route.post("/create", authMiddleware({isAdmin: true}), async (req: Request & {user: any}, res) => {
    const data = await CategoryService.create(req.body.title)
    return res.status(200).json(data)
})

export default route