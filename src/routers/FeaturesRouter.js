const express = require('express')
const Groups = require('../models/Group')
const { GroupName } = require('../models/GroupName')
const router = express.Router()
const validator = require('validator')
const User = require('../models/User')
const crypto = require('crypto')
require('dotenv').config()

const courier = require("@trycourier/courier").CourierClient({ authorizationToken: process.env.EMAIL_KEY});

var email = function (user_name,username,groupName,password) {
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
    const groupName = req.body.group
    const user_name = req.body.user_name
    var username = req.body.username
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
            if (groupCheck.group[i].group_name == groupName) {
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
            userCheck.group.push(group_Data)
            await userCheck.save()
        } else {
            const userData = await User({ name: username, user_name: user_name, group: group_Data, password: password })
            var pass = `send email to '${user_name}' with ${password}`
            email(user_name,username,groupName,password)
            await userData.save()
        }
        success = true
        res.status(201).send({ code: 201, success: success, message: msg, pass, requestId })
    } catch (error) {
        success = false
        res.send({ code: 400, success: success, message: error.message })
    }
})


// delete (remove) user from group
router.post('/remove/user/', async (req, res) => {
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
        res.status(200).send({ code: 200, success: success, message: msg })
    } catch (error) {
        success = false
        res.send({ code: 400, success: success, message: error.message })
    }
})


//delete group
router.post('/delete/group', async (req, res) => {
    var success
    const msg = 'group deleted'
    const group_name = req.body.group.toLowerCase()
    const Group = GroupName(group_name)
    try {
        // delete from all Groups list    
        const groupData = await Groups.findOne({})
        for (let i = 0; i < groupData.group.length; i++) {
            console.log('here');
            const groupCheck = groupData.group[i].group_name.toLowerCase() === group_name
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
                const groupCheck = userData[i].group[j].group_name.toLowerCase() === group_name
                if (groupCheck) {
                    userData[i].group.splice(j, 1)
                    await userData[i].save()
                    break;
                }
            }
        }
        Group.drop
        success = true
        res.status(200).send({ code: 200, success: success, message: msg })
    } catch (error) {
        success = false
        res.send({ code: 400, success: success, message: error.message })
    }
})


//user list in particuler group
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

        res.status(200).send({ code: 200, success: success, message: msg, data: userData })
    } catch (error) {
        success = false
        res.send({ code: 400, success: success, message: error.message })
    }
})


module.exports = router