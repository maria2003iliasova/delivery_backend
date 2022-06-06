import {Request, Router} from "express";
import {authMiddleware} from "../lib/auth";
import OrdersService from "../services/Orders.service";

const route = Router()

route.patch("/update/:id", authMiddleware(), async (req: Request & { user: any }, res) => {
    const data = await OrdersService.updateOneById(req.user, req.params.id, req.body)
    return res.status(200).json(data)
})

route.post("/create", authMiddleware({isRequired: false}), async (req: Request & { user: any }, res) => {
    const data = await OrdersService.create(req.user, req.body)
    return res.status(200).json(data)
})

route.get("/all", authMiddleware({isAdmin: true}), async (req, res) => {
    const data = await OrdersService.getAll()
    return res.status(200).json(data)
})

route.get("/", authMiddleware(), async (req: Request & { user: any }, res) => {
    const data = await OrdersService.getUserOrders(req.user)
    return res.status(200).json(data)
})

export default route