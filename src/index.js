const express = require('express')
require('dotenv').config()
require('./database/database')
const bodyParser = require('body-parser')


const AdminRouter = require('./routers/AdminRouter')
const UserRouter = require('./routers/UserRouter')
const FeaturesRouter = require('./routers/FeaturesRouter')



const app = express()
app.use(express.json())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
const port = '8080'


app.use(AdminRouter)
app.use(UserRouter)
app.use(FeaturesRouter)
app.get('/', async (req, res) => {
    res.send('here')
})
app.listen(port, () => {
    console.log(`Server running on ${port}`);
})



// http://192.168.1.7:3030/admin/login
