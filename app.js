
const express = require("express")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const saltRounds = 10

const app = express()
app.use(cors())
app.use(express.json())
const { MongoClient, ServerApiVersion } = require('mongodb');


const uri = "mongodb+srv://socialMedia:aaqij2qpm3uV3e7e@cluster0.p8qnexq.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const allUsers = client.db('socialMedia').collection('users')
        const allFollowers = client.db('socialMedia').collection('followers')
        const allFollowing = client.db('socialMedia').collection('following')


        app.post('/users', async (req, res) => {
            const query = req.body;
            const inserted = await allUsers.findOne({ userName: query.userName })
            if (inserted) {
                return res.send({ message: 'Previously Added' })
            }
            bcrypt.hash(req.body.password, saltRounds, async function (err, hash) {
                const newUser = {
                    userName: req.body.userName,
                    password: hash
                }
                const result = await allUsers.insertOne(newUser);
                res.send(result);
            });
        })


        app.post('/login', async (req, res) => {
            const query = req.body;
            const userPassword = query.password;
            const user = await allUsers.findOne({ userName: query.userName })
            const password = user.password;
            bcrypt.compare(userPassword, password, function (err, result) {
                if (result) {
                    console.log('valid')
                }
                else {
                    console.log('not valid');
                }
                res.send(result)
            });

        })


        app.get('/users/:username', async (req, res) => {
            const name = req.params.username;
            const query = { userName: name }
            const result = await allUsers.findOne(query);
            res.send(result)
        })

        app.get('/users/:username/followers', async (req, res) => {
            const name = req.params.username;
            const query = { userName: name }
            const result = await allFollowers.find(query).toArray();
            res.send(result)
        })

        app.get('/users/:username/following', async (req, res) => {
            const name = req.params.username;
            const query = { userName: name }
            const result = await allFollowing.find(query).toArray();
            res.send(result)
        })

        app.post('/users/:username/follow', async (req, res) => {
            const data = req.body;
            const result = await allFollowers.insertOne(data);
            res.send(result)
        })

        app.delete('/users/:username/follow', async (req, res) => {
            const query = { userName: req.params.username, name: req.body.name }
            const result = await allFollowers.deleteOne(query)
            console.log(result)
        })

    }
    finally {

    }
}

run().catch(console.log)


app.get('/', (req, res) => {
    res.send('Server Running')
})

module.exports = app;