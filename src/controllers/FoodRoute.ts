import {Request, Router} from "express";
import {authMiddleware} from "../lib/auth";
import FoodService from "../services/Food.service";

const route = Router()

route.delete("/:id", authMiddleware({isAdmin: true}), async (req, res) => {
    const data = await FoodService.deleteOneById(req.params.id)
    return res.status(200).json(data)
})

route.patch("/update/:id", authMiddleware({isAdmin: true}), async (req: Request & {user: any}, res) => {
    const data = await FoodService.updateOneById(req.params.id, req.body)
    return res.status(200).json(data)
})

route.get("/", async (req, res) => {
    const data = await FoodService.getAll()
    return res.status(200).json(data)
})

route.post("/create", authMiddleware({isAdmin: true}), async (req, res) => {
    const data = await FoodService.create(req.body)
    return res.status(200).json(data)
})

export default route