import axios from "axios";
import {Request, Router} from "express";
import VKService from "../services/VK.service";
import UsersService from "../services/Users.service";
import jwt from "jsonwebtoken";

const route = Router()

const buildQueryString = (items) => {
    const joined = items
        .map((it) => {
            const key = Object.keys(it)[0];
            return `${key}=${encodeURI(it[key])}`;
        })
        .join('&');
    return joined.length > 0 ? '?' + joined : '';
}

const getAccessToken = async (code) => {
    const {email, access_token, user_id} = await callApi(
        'post',
        `https://oauth.vk.com/access_token${buildQueryString([
            {code: code},
            {client_id: process.env.VK_CLIENT_ID},
            {client_secret: process.env.VK_SECRET},
            {redirect_uri: 'http://localhost:5000/vk/complete'},
        ])}`
    );
    return {
        email,
        access_token,
        user_id,
    };
};

const getUserInfo = async (accessToken) => {
    const data = await callApi(
        'post',
        `https://api.vk.com/method/users.get${buildQueryString([
            {access_token: accessToken},
            {fields: ['screen_name', 'nickname', 'name'].join(',')},
        ])}&v=5.103`
    );
    const {id, first_name, last_name, screen_name, nickname, email} = data.response[0];
    return {
        id: id,
        name: nickname || screen_name || first_name + ' ' + last_name,
        nickname: nickname,
        screen_name: screen_name,
        first_name: first_name,
        last_name: last_name,
        email: email
    };
};

const callApi = async (
    method,
    url,
    payload = null
) => {
    try {
        const payloadString = payload !== null ? JSON.stringify(payload) : null;

        const rc = {
            url,
            headers: {
                Accept: 'application/json',
            },
            method,
            data: null
        };

        if (payloadString) {
            rc.data = payloadString;
            rc.headers['Content-Type'] = 'application/json; charset=UTF-8';
        }

        const result = await axios(rc).then(
            (r) => {
                // console.log(r);
                return {data: r.data, status: r.status}
            },
            (e) => {
                console.log(e);
                return {status: e.response.status, error: e.response.data.error}
            }
        );

        if (!result) {
            return {};
        }

        if (result.status === 400) {
            // @ts-ignore
            const errMessage = result.error.message;
            if (errMessage) {
                console.error(errMessage);
                return {};
            }
            return {};
        }
        // @ts-ignore
        return result.data;
    } catch (error) {
        console.error('fetch api error', error);
        return {};
    }
};

route.get("/login", (req: Request & { user?: any }, res) => {

    const state = {
        callback: req.query.callback,
        ...(req.query.user ? {connect: req.query.user} : {})
    }

    const url = `https://oauth.vk.com/authorize${buildQueryString([
        {client_id: process.env.VK_CLIENT_ID},
        {redirect_uri: 'http://localhost:5000/vk/complete'},
        {response_type: 'code'},
        {scope: ['email'].join('+')},
        {state: JSON.stringify(state)},
    ])}`;
    res.redirect(url);
})

route.get("/access", async (req, res) => {
    const data = await VKService.exchangeToken(req.query.code)
    return res.status(200).json(data)
})

route.get("/complete", async (req, res, next) => {
    const code = req.query['code'] || '';
    // @ts-ignore
    const state = JSON.parse(req.query.state)
    if (!code) {
        console.debug('Cannot authorize no code')
        return res.send('Cannot authorize no code');
    }
    const data = await getAccessToken(String(code));
    if (!data.access_token) {
        console.debug('Unable to get access token')
        return res.send('Unable to get access token');
    }

    const userInfo = await getUserInfo(data.access_token);
    const savedData = await VKService.create(userInfo)
    if (state.connect) {
        const candidate = await UsersService.findOneByUsername(state.connect)
        if (candidate) {
            if (!candidate.vk) {
                await VKService.connect(candidate.id, savedData.id)
            }
        }
    }

    const url = new URL(state.callback)
    url.search = null
    const search = new URLSearchParams()
    const jwtCode = jwt.sign({
        id: savedData.id
    }, process.env.VK_SECRET)
    search.set("code", jwtCode)
    url.search = search.toString()

    res.redirect(url.toString() || process.env.BASE_URL)
})

export default route