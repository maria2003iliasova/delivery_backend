import {Request, Router} from "express";
import {authMiddleware} from "../lib/auth";
import UsersService from "../services/Users.service";

const route = Router()

route.patch("/me", authMiddleware(), async (req: Request & { user: any }, res) => {
    const data = await UsersService.updateOneById(req.user, req.body)
    return res.status(200).json(data)
})

export default route