const express = require('express')
const Admin = require('../models/Admin')
const Group = require('../models/Group')
const { GroupName } = require('../models/GroupName')
const router = express.Router()

const courier = require("@trycourier/courier").CourierClient({ authorizationToken: "pk_prod_F4TFS1C8TX47Q5NWXQP7J73RQWZ4" });

// create admin
router.post('/admin', async (req, res) => {
    var success
    const msg = 'admin created'
    try {
        const admin = await Admin(req.body)
        await admin.save()
        res.send({ code: 201, success: success, message: msg, data: admin })
    } catch (error) {
        success = false
        res.send({ code: 400, success: success, message: error.message })
    }
})

// login admin
router.post('/admin/login', async (req, res) => {
    var success
    const msg = 'admin login'
    const user_name = req.body.user_name
    const password = req.body.password
    try {
        const admin = await Admin.findByCredentials(user_name, password)
        success = true
        res.send({ code: 200, success: success, message: msg, data: admin })
    } catch (error) {
        success = false
        res.send({ code: 400, success: success, message: error.message })
    }
})

// get all group name
router.get('/admin/group', async (req, res) => {
    var success
    const msg = 'all groups'
    try {
        const group = await Group.findOne({})
        success = true
        res.status(200).send({ code: 200, success: success, message: msg, data: group })
    } catch (error) {
        success = false
        res.send({ code: 400, success: success, message: error.message })
    }
})



// create group
router.post('/create/group', async (req, res) => {
    var success
    const msg = 'group created'
    const admin_id = req.body.id
    const group = req.body.group.toLowerCase()
    const group_icon = req.body.groupIcon
    try {
        const admin = await Admin.findById(admin_id)
        const groupData = { group_icon, group_name: group }
        admin.group.push(groupData)
        const data = { user: admin.user_name, message: { userId: admin_id, username: admin.user_name, message: '', profile: '', time: Date.now() } }

        var groupCheck = await Group.findOne({})
        if (groupCheck != null) {
            for (var i = 0; i < groupCheck.group.length; i++) {
                if (groupCheck.group[i].group_name.toLowerCase() == group) {
                    throw new Error("Group alredy existing")
                } else {
                    const groupdata = GroupName(group)
                    await groupdata(data).save()
                    groupCheck.group.push(groupData)
                    await groupCheck.save()
                    await admin.save()
                    break;
                }
            }
        } else {
            const groupdata = GroupName(group)
            await groupdata(data).save()
            await Group({ group: groupData }).save()
            await admin.save()
        }
        success = true
        res.send({ code: 201, success: success, message: msg })
    } catch (error) {
        success = false
        res.send({ code: 400, success: success, message: error.message })
    }
})





module.exports = router 