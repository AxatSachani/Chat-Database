const express = require('express')
const User = require('../models/User')
const router = express.Router()
const { GroupName } = require('../models/GroupName')
const moment = require('moment')
const ForgetPass = require('../models/ForgetPass')
const Admin = require('../models/Admin')


const courier = require("@trycourier/courier").CourierClient({ authorizationToken: "pk_prod_F4TFS1C8TX47Q5NWXQP7J73RQWZ4"});

var email = function (user_name,username,otp) {
    courier.send({
        message: {
            to: {
                email: `${user_name}`,
            },
            template: "Q77MRX6Y764GYNM3NQMGFA088VET",
            data: {
                name: `${username}`,
                user: `${user_name}`,
                otp: `${otp}`,
            },
        },
    });
}

// login user
router.post('/user/login', async (req, res) => {
    var success
    const msg = 'user login'
    const user_name = req.body.user_name
    const password = req.body.password
    try {
        const user = await User.findByCredentials(user_name, password)
        success = true
        res.send({ code: 200, success: success, message: msg, data: user })
    } catch (error) {
        success = false
        res.send({ code: 400, success: success, message: error.message })
    }
})

router.post('/message', async (req, res) => {
    var success
    const msg = 'message sent'
    const group = req.body.group
    const id = req.body.id
    const message = req.body.message
    const time = moment(Date.now()).format('DD/MM/YYYY hh:mm')
    try {
        const data = { id, message, time }
        const groupName = GroupName(group)
        const groupData = await groupName.findOne({})
        groupData.message.push(data)
        await groupData.save()
        success = true
        re.send({ code: 200, success: success, message: msg, data: groupData.message })
    } catch (error) {
        success = false
        res.send({ code: 400, success: success, message: error.message })
    }
})


// user all group
router.post('/user/group', async (req, res) => {
    var success
    const msg = 'user all group'
    const user_name = req.body.user_name
    try {
        const user = await User.findOne({ user_name }).select({ _id: 0, group: 1 })
        if (!user) {
            throw new Error('invalid user name')
        }
        success = true
        res.send({ code: 200, success: success, message: msg, data: { group: user.group } })
    } catch (error) {
        success = false
        res.send({ code: 400, success: success, message: error.message })
    }
})

// cron.schedule(' * * * * *', async (req, res) => {
//     try {
//         const groups = await Group.findOne({})
//         console.log(groups.group.length);
//         for (var i = 0; i < groups.group.length; i++) {
//             console.log('here');
//             const name = GroupName(groups.group[i])
//             const ia = await name.findOne({})
//             console.log(ia.message);
//             ia.message.splice(0, ia.message.length);
//             await ia.save()
//         }
//         console.log('done')
//     } catch (error) {
//         console.log(error);
//     }
// });



// forget password
router.post('/generate-otp', async (req, res) => {
    const msg = "OTP send"
    const user_name = req.body.user_name
    const isAdmin = req.body.isAdmin
    var success
    try {
        var otp = Math.floor(Math.random() * (9572 - 1082)) + 1082
        if (isAdmin == 'true') {
            const admin = await Admin.findOne({ user_name })
            if (!admin) {
                throw new Error('invalid username')
            }
            const checkResend = await ForgetPass.findOne({ user_name })
            if (checkResend) {
                const createAt = Date.now()
                const expirAt = Date.now() + 120000
                await ForgetPass.findOneAndUpdate({ user_name }, { otp, createAt, expirAt })
                email (user_name,admin.name,otp)
            }
            else {
                const data = { user_name, otp }
                await ForgetPass(data).save()
                email (user_name,admin.name,otp)
            }
        }
        if (isAdmin == 'false') {
            const user = await User.findOne({ user_name })
            if (!user) {
                throw new Error('invalid username')
            }
            const checkResend = await ForgetPass.findOne({ user_name })
            if (checkResend) {
                const createAt = Date.now()
                const expirAt = Date.now() + 120000
                await ForgetPass.findOneAndUpdate({ user_name }, { otp, createAt, expirAt })
                email (user_name,user.name,otp)
            }
            else {
                const data = { user_name, otp }
                await ForgetPass(data).save()
                email (user_name,user.name,otp)
            }
        }

        // setTimeout(async () => {
        //     await ForgetPass.findOneAndDelete(user_name)
        //     console.log('delete');
        // }, 20000);

        success = true
        res.send({ code: 200, success: success, message: msg, data: otp })
    } catch (error) {
        success = false
        res.send({ code: 400, success: success, message: error.message })
    }
})


// forget password
router.post('/forget-password', async (req, res) => {
    var success
    const msg = 'password change'
    const password = req.body.password
    const user_name = req.body.user_name
    const isAdmin = req.body.isAdmin
    try {
        const dataCheck = await ForgetPass.findOne({ user_name })
        if (!dataCheck) {
            throw new Error('create otp first')
        }
        if (isAdmin == 'true') {
            const admin = await Admin.findOne({ user_name })
            if (!admin) {
                throw new Error('invalid username')
            }
            admin.password = password
            await admin.save()
            await ForgetPass.findOneAndDelete({ user_name })
        }
        if (isAdmin == 'false') {
            const user = await User.findOne({ user_name })
            if (!user) {
                throw new Error('invalid username')
            }
            user.password = password
            await user.save()
            await ForgetPass.findOneAndDelete({ user_name })
        }
        success = true
        res.send({ code: 200, success: success, message: msg })
    } catch (error) {
        success = false
        res.send({ code: 400, success: success, message: error.message })
    }
})




module.exports = router
