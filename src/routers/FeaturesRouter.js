const express = require('express')
const Groups = require('../models/Group')
const { GroupName } = require('../models/GroupName')
const router = express.Router()
const validator = require('validator')
const User = require('../models/User')
const crypto = require('crypto')
require('dotenv').config()
const { toFormat } = require('../module/module')
const Admin = require('../models/Admin')
const { default: mongoose } = require('mongoose')

require("../database/database")

const courier = require("@trycourier/courier").CourierClient({ authorizationToken: "pk_prod_F4TFS1C8TX47Q5NWXQP7J73RQWZ4" });

var email = function (user_name, username, groupName, password) {
    courier.send({
        message: {
            to: {
                email: `${user_name}`,
            },
            template: "KJ6D2YD8T1MY68NFG5G0SM57PBEC",
            data: {
                name: `${username}`,
                group: `${groupName}`,
                username: `${user_name}`,
                password: `${password}`,
            },
        },
    });
}

// add user in group 
router.post('/add/user', async (req, res) => {
    var success
    const msg = 'user added'
    const groupName = req.body.group.toLowerCase()
    const user_name = req.body.user_name
    var username = toFormat(req.body.username)
    const password = crypto.randomBytes(5).toString('hex')
    try {
        //check group name is valid or not
        if (!validator.isEmail(user_name)) {
            throw new Error('Invalid user name')
        }
        //check group name is existing or not
        const groupCheck = await Groups.findOne({})
        var groupExisting = false
        for (var i = 0; i < groupCheck.group.length; i++) {
            if (groupCheck.group[i].group_name.toLowerCase() == groupName) {
                groupExisting = true
                var group_Data = groupCheck.group[i]
            }
        }
        if (!groupExisting) {
            throw new Error(`'${groupName}' not existing`)
        }
        // check user existing in group
        const group = GroupName(groupName)
        const groupData = await group.findOne({})
        if (groupData != null) {
            if (groupData.user.indexOf(user_name) != -1) {
                throw new Error(`'${user_name}' existing in group '${groupName}'`)
            }
            groupData.user.push(user_name)
            await groupData.save()
        } else {
            await group({ user: user_name }).save()
        }
        // insert data in whole user tables
        const userCheck = await User.findOne({ user_name })
        if (userCheck != null) {
            userCheck.name = username
            userCheck.group.push(group_Data)
            await userCheck.save()
        } else {
            const userData = await User({ name: username, user_name: user_name, group: group_Data, password: password })
            var pass = `send email to '${user_name}' with ${password}`
            email(user_name, username, groupName, password)
            await userData.save()
        }
        success = true
        res.send({ code: 201, success: success, message: msg, pass })
    } catch (error) {
        success = false
        res.send({ code: 400, success: success, message: error.message })
    }
})


// delete (remove) user from group
router.post('/delete/user/', async (req, res) => {
    var success
    const msg = 'user deleted'
    const group_name = req.body.group.toLowerCase()
    const user_name = req.body.user_name
    const Group = GroupName(group_name)
    try {
        // delete from Particuler group data
        const groupData = await Group.findOne({})
        for (let i = 0; i < groupData.user.length; i++) {
            const userCheck = groupData.user[i] === user_name
            if (userCheck) {
                groupData.user.splice(i, 1)
                await groupData.save()
                break;
            }
        }
        // delete from User data 
        const userData = await User.findOne({ user_name })
        for (let i = 0; i < userData.group.length; i++) {
            const userCheck = userData.group[i].group_name.toLowerCase() === group_name
            if (userCheck) {
                userData.group.splice(i, 1)
                await userData.save()
                break;
            }
        }
        success = true
        res.send({ code: 200, success: success, message: msg })
    } catch (error) {
        success = false
        res.send({ code: 400, success: success, message: error.message })
    }
})

// clear history
router.post('/clear/history', async (req, res) => {
    var success
    const msg = 'history clear'
    const group_name = req.body.group
    const Group = GroupName(group_name)
    try {
        const data = await Group.findOne({})
        const totalMsg = data.message.length
        data.message.splice(1, totalMsg - 1)
        await data.save()
        const message = data.message
        success = true
        res.send({ code: 200, success: success, message: message })
    } catch (error) {
        success = false
        res.send({ code: 400, success: success, message: error.message })
    }
})

//delete group
router.post('/delete/group', async (req, res) => {
    var success
    const msg = 'group deleted'
    const group_name = req.body.group
    const Group = GroupName(group_name)
    try {
        // delete from all Groups list    
        const groupData = await Groups.findOne({})
        for (let i = 0; i < groupData.group.length; i++) {
            const groupCheck = groupData.group[i].group_name == group_name
            if (groupCheck) {
                groupData.group.splice(i, 1)
                await groupData.save()
                break;
            }
        }

        // delete from User data 
        const userData = await User.find({})
        for (let i = 0; i < userData.length; i++) {
            for (let j = 0; j < userData[i].group.length; j++) {
                const groupCheck = userData[i].group[j].group_name == group_name
                if (groupCheck) {
                    userData[i].group.splice(j, 1)
                    await userData[i].save()
                }
            }
        }

        // delete from Admin table
        const adminData = await Admin.findOne({})
        for (let i = 0; i < adminData.group.length; i++) {
            const groupCheck = adminData.group[i] == group_name
            if (groupCheck) {
                adminData.group.splice(i, 1)
                await adminData.save()
                break;
            }

        }
        mongoose.deleteModel(group_name)
        success = true
        res.send({ code: 200, success: success, message: msg })
    } catch (error) {
        success = false
        res.send({ code: 400, success: success, message: error.message })
    }
})


//users list in particuler group
router.post('/group/user', async (req, res) => {
    var success
    var msg = 'user list'
    const group_name = req.body.group
    const group = GroupName(group_name)
    var userData = []
    try {
        const groupUser = await group.findOne({}).select({ user: 1, _id: 0 })
        if (groupUser) {
            for (let i = 0; i < groupUser.user.length; i++) {
                const user = await User.findOne({ user_name: groupUser.user[i] })
                if (user) {
                    const name = user.name
                    const user_name = user.user_name
                    const user_profile = user.user_profile
                    data = { name, user_name, user_profile }
                    userData.push(data)
                }
            }
            success = true
        }
        else {
            // throw new Error('No user found')
            success = false
            msg = "Group Users not found."
        }

        res.send({ code: 200, success: success, message: msg, data: userData })
    } catch (error) {
        success = false
        res.send({ code: 400, success: success, message: error.message })
    }
})


module.exports = router