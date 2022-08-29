const { ObjectId } = require("mongodb");
const mongoose = require("mongoose");
const moment = require('moment')
const validator = require('validator')


const Schema = new mongoose.Schema({

    user: [{
        type: String,
        required: true,
        trim: true
    }],
    message: [{
        type:Object,
        userId: {
            type: String,
            default:''
        },
        username: {
            type: String,
            default:''
        },
        message: {
            type: String,
            default:''
        },
        profile: {
            type: String,
            default:''
        },
        time: {
            type: String,
            default:''
        }
    }]

})


// filter response data
Schema.methods.toJSON = function () {
    const data = this
    const groupData = data.toObject()
    delete groupData.__v
    delete groupData._id
    return groupData
}



const GroupName = function (name) {
    const groupName = mongoose.model(`${name}`, Schema)
    return groupName
}

module.exports = {
    GroupName
}