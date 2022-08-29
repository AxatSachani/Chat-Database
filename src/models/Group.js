const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema({
    group: [{
        group_icon: {
            type: String,
            default: Math.floor(Math.random() * (7)) + 1
        },
        group_name: {
            type: String
        }
    }]
})


// filter response data
GroupSchema.methods.toJSON = function () {
    const group = this
    const groupData = group.toObject()
    delete groupData.__v
    delete groupData._id
    return groupData
}


const Group = mongoose.model('Group', GroupSchema)
module.exports = Group