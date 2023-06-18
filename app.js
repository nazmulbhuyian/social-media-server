
const express = require("express")
const cors = require("cors")
const bcrypt = require("bcryptjs")
const saltRounds = 10
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const revokedTokens = new Set(); // Store revoked tokens

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
            const inserted = await allUsers.findOne({ userName: query.name })
            if (inserted) {
                return res.send({ message: 'Previously Added' })
            }
            bcrypt.hash(req.body.password, saltRounds, async function (err, hash) {
                const newUser = {
                    userName: req.body.name,
                    email: req.body.email,
                    password: hash
                }
                const result = await allUsers.insertOne(newUser);
                res.send(result);
            });
        })


        app.post('/login', async (req, res) => {

            try {
                const { email, password } = req.body;
                const user = await allUsers.findOne({ email: email })
                if (!user) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }
                const isPasswordValid = await bcrypt.compare(password, user.password);
                if (!isPasswordValid) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN);
                return res.send({ accessToken: token, user })
            } catch (error) {
                res.status(500).json({ error: 'Failed to login' });
            }


            // const query = req.body;
            // const userPassword = query.password;
            // const user = await allUsers.findOne({ email: query.email })
            // const password = user.password;
            // bcrypt.compare(userPassword, password, function (err, result) {
            //     if (result) {
            //         console.log('valid')
            //     }
            //     else {
            //         console.log('not valid');
            //         res.status(403).send({ accessToken: '' })
            //     }
            //     res.send(result)
            // });

        })

        app.post('/getMe', async (req, res) => {
            const token = req.headers?.authorization?.split(" ")?.[1];
            const decode = await promisify(jwt.verify)(token, process.env.ACCESS_TOKEN);
            // console.log(decode);
            res.json(decode.email);
        })


        // app.post('/logOut', async (req, res) => {
        //     const token = req.headers?.authorization?.split(' ')[1];
        //     if (token) {
        //         revokedTokens.add(token); // Add the token to the revoked tokens list
        //         res.json({ message: 'User logged out successfully' });
        //     } else {
        //         res.status(401).json({ error: 'Missing token' });
        //     }
        // })

        // app.get('/jwt', async (req, res) => {
        //     const email = req.query.email;
        //     const query = { email: email }
        //     const user = await allUsers.findOne(query);
        //     if (user) {
        //         const token = jwt.sign({ email }, process.env.ACCESS_TOKEN) //, {expiresIn: '1h'}
        //         // console.log(token);
        //         return res.send({ accessToken: token })
        //     }
        //     res.status(403).send({ accessToken: '' })
        // })


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


        // app.get('/allData', async (req, res) => {
        //     const {data} = req.query;
        //     const regex = new RegExp(data, 'i');
        //     const result = await allData.find({description: regex}).limit(2).toArray();
        //     // res.status(100).json({
        //     //     status: "Successfully",
        //     //     data: result
        //     // })
        //     res.send(result)
        // })

    }
    finally {

    }
}

run().catch(console.log)


app.get('/', (req, res) => {
    res.send('Server Running')
})

module.exports = app;