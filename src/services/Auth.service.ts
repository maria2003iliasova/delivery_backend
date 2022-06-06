import bcrypt from "bcrypt"
import prisma from "../lib/prisma";
import {ErrorHandler} from "../lib/errorHandler";
import UsersService from "./Users.service";
import {makeid, signToken} from "../lib/utils";
import nodemailer from "nodemailer"
import jwt, {JwtPayload} from "jsonwebtoken";
import VKService from "./VK.service";

const config = {
    host: "smtp.mail.ru",
    port: 465,
    secure: true,
    auth: {
        user: 'mia03.03@mail.ru',
        pass: 'hX24fejZTe3L62a48h9n',
    }
}

export const transporter = (config) => nodemailer.createTransport(config);
const emailSender = transporter(config)

class AuthService {

    async resetPassword(code: string, password: string) {
        let verified;
        try {
            verified = jwt.verify(code, 'resetpassw0rdsecret') as JwtPayload
        } catch (e) {
            throw new ErrorHandler(401, "Не верный код")
        }
        if (!verified) throw new ErrorHandler(401, "Не верный код")
        const candidate = await UsersService.findOneById(verified.id)
        if (!candidate) throw new ErrorHandler(401, "Не верный код")
        if (verified.oldPassword !== candidate.password) throw new ErrorHandler(401, "Не верный токен")
        const hashPassword = await bcrypt.hash(password, 10)
        await UsersService.updateOneById(candidate, {
            password: hashPassword
        })
        await emailSender.sendMail({
            from: '"Maria Delivery" <mia03.03@mail.ru>', // sender address
            to: candidate.email, // list of receivers
            subject: "Восстановление пароля", // Subject line
            html: `<h3>Восстановление пароля</h3>
                   <p>Пароль был успешно изменен, если вы этого не делали - обратитесь к администратору по этой почте</p>`,
        });
        return true
    }

    async forgotPassword(toSearch: string) {
        const candidate = await UsersService.findOneByEmail(toSearch)
        if (!candidate) {
            console.log("No candidate")
            return true
        }
        if (!candidate.email_confirmed) {
            console.log("Email is not confirmed")
            return true
        }

        const jwtCode = jwt.sign({
            id: candidate.id,
            oldPassword: candidate.password
        }, "resetpassw0rdsecret", {
            expiresIn: "10m"
        })

        await emailSender.sendMail({
            from: '"Maria Delivery" <mia03.03@mail.ru>', // sender address
            to: candidate.email, // list of receivers
            subject: "Восстановление пароля", // Subject line
            html: `<h3>Восстановление пароля</h3>
                   <p>Если вы не запрашивали восстановления пароля - игнорируйте письмо</p>
                   <a href='${process.env.BASE_URL}/reset/?code=${jwtCode}'>Сссылка для восстановления</a>`,
        });

        return true
    }


    async sendVerificationEmail(user) {
        if (user.email_confirmed) throw new ErrorHandler(401, "Ваш Email уже подтвержден")

        const {email_confirm_code} = await UsersService.updateOneById(user, {
            email_confirm_code: makeid(6)
        })

        await emailSender.sendMail({
            from: '"Maria Delivery" <mia03.03@mail.ru>', // sender address
            to: user.email, // list of receivers
            subject: "Подтверждение Email", // Subject line
            html: `<h3>Подтверждение Email</h3><p>Если вы не запрашивали - игнорируйте письмо</p>
            Ваш код подтверждения: ${email_confirm_code}`,
        });

        return true
    }

    async verifyEmail(user, code) {
        if (user.email_confirmed) throw new ErrorHandler(401, "Ваш Email уже подтвержден")
        if (!code || code.length < 1) throw new ErrorHandler(401, "Не указан код")
        if (user.email_confirm_code !== code) throw new ErrorHandler(401, "Неверный код потдверждения")
        await UsersService.updateOneById(user, {
            email_confirm_code: "",
            email_confirmed: new Date()
        })
        return true
    }

    async signUp(signUpDTO) {
        if (!signUpDTO) throw new ErrorHandler(401, "Нет данных для регистрации")
        const {password, email, username} = signUpDTO
        if (!email || !username || !password) throw new ErrorHandler(401, "Не все данные указаны")
        const hashedPassword = await bcrypt.hash(password, 10)
        const candidate = await prisma.user.findFirst({
            where: {username, email}
        })
        if (candidate) throw new ErrorHandler(401, "Пользователь с таким email или username уже существует")
        const user = await UsersService.create(username, email, hashedPassword)
        if (signUpDTO.vkId) {
            await VKService.connect(user.id, signUpDTO.vkId).catch(e => {
            })
        }
        const accessToken = signToken({id: user.id, role: user.role})
        return {accessToken}
    }

    async signIn(signInDTO) {
        if (!signInDTO) throw new ErrorHandler(401, "Нет данных для авторизации")
        const {username, password} = signInDTO
        if (!username) throw new ErrorHandler(401, "Нет Логина")
        if (!password) throw new ErrorHandler(401, "Нет Пароля")
        const candidate = await UsersService.findOneByUsername(username)
        if (!candidate) throw new ErrorHandler(401, "Не верный Логин или Пароль")
        const passwordEquals = await bcrypt.compare(password, candidate.password)
        if (!passwordEquals) throw new ErrorHandler(401, "Не верный Логин или Пароль")
        const accessToken = signToken({id: candidate.id, role: candidate.role})
        return {accessToken}
    }

    async signInByVk(code) {
        if (!code) throw new ErrorHandler(401, "Нет кода авторизации")
        let id;
        try {
            const data = jwt.verify(code, process.env.VK_SECRET as string) as JwtPayload
            id = data.id
        } catch (e) {
            throw new ErrorHandler(401, "Не верный токен авторизации")
        }
        const vk = await VKService.findOneById(id)
        if (!vk) throw new ErrorHandler(401, "К этому вк ничего не привязано")
        const user = await UsersService.findOneById(vk.userId)
        if (!user) throw new ErrorHandler(401, "Пользователь не найден")
        const accessToken = signToken({id: user.id, role: user.role})
        return {accessToken}

    }
}

export default new AuthService()