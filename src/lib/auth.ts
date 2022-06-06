import {verifyToken} from "./utils";
import UsersService from "../services/Users.service";
import {JwtPayload} from "jsonwebtoken";
import {ADMIN} from "../constants/roles";
import {NextFunction, Request, Response} from "express";
import {Order, User} from "@prisma/client";

interface IOptions {
    isAdmin?: boolean
    isRequired?: boolean
}

interface IAuthMiddleware {
    (options?: IOptions | null): any
}

export const authMiddleware: IAuthMiddleware = (options: IOptions) => {
    const isRequired = options?.isRequired || true
    const isAdmin = options?.isAdmin || false
    return async (req: any, res: any, next) => {
        let accessToken;
        if (req.headers.authorization) {
            const [type, token] = req.headers.authorization.split(" ")
            if (type !== "Bearer") {
                if (isRequired) return res.status(401).json({error: "Токен авторизации имеет не верную форму"})
                else accessToken = null
            }
            accessToken = token
        }
        if (!accessToken) {
            if (isRequired) return res.status(401).json({error: "Нет токена авторизации"})
            else return next()
        }
        try {
            const tokenData = verifyToken(accessToken) as JwtPayload
            if (!tokenData) {
                if (isRequired) return res.status(401).json({error: "Не правильный токен авторизации"})
                else return next()
            }
            const userData = await UsersService.findOneById(tokenData.id)
            if (!userData) {
                if (isRequired) return res.status(401).json({error: "Пользователя с таким id нет в базе данных"})
                else return next()
            }
            if (userData) req.user = userData
            if (isAdmin && userData.role !== ADMIN) return res.status(403).json({error: "Нет доступа"})
            return next()
        } catch (e) {
            console.error(e)
            if (isRequired) return res.status(401).json({error: "Не правильный токен авторизации"})
            else return next()
        }
    }
}