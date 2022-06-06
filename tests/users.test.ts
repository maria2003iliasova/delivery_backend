import { prismaMock } from './singleton'
import {User} from "@prisma/client"
import UsersService from "../src/services/Users.service";

const user: User = {
    id: 0,
    email: 'some@email.ru',
    username: 'maria',
    password: '1234',
    phone: null,
    email_confirmed: null,
    email_confirm_code: null,
    updated_at: new Date(),
    created_at: new Date(),
    role: 'USER'
}

test("Должно создать нового пользователя", async () => {
    // const hashedPassword = await bcrypt.hash(user.password, 10)
    prismaMock.user.create.mockResolvedValue(user)

    await expect(UsersService.create(user.username, user.email, user.password)).resolves.toEqual(user)
})

test("Должно обновить пользователя", async () => {
    prismaMock.user.create.mockResolvedValue(user)
    prismaMock.user.update.mockResolvedValue(user)

    const {password, ...info} = user

    await expect(UsersService.updateOneById({id: user.id}, user)).resolves.toEqual(info)
})