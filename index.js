const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')

const morgan = require('morgan')
const port = process.env.PORT || 5000
app.use(cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174'
  
    ],
    credentials: true
  }))
app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'))



const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token
    console.log(token)
    if (!token) {
      return res.status(401).send({ message: 'unauthorized access' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        console.log(err)
        return res.status(401).send({ message: 'unauthorized access' })
      }
      req.user = decoded
      next()
    })
  }


const uri = `mongodb+srv://${process.env.VITE_USER}:${process.env.VITE_PASS}@cluster0.ul0jqdv.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const usersCollection = client.db('Defot').collection('users')
    const productsCollection = client.db('Defot').collection('products')
    // auth related api
    app.post('/jwt',verifyToken, async (req, res) => {
        const user = req.body
        console.log('I need a new jwt', user)
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: '365d',
        })
        res
          .cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          })
          .send({ success: true })
      })
  
      // Logout
      app.get('/logout', async (req, res) => {
        try {
          res
            .clearCookie('token', {
              maxAge: 0,
              secure: process.env.NODE_ENV === 'production',
              sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            })
            .send({ success: true })
          console.log('Logout successful')
        } catch (err) {
          res.status(500).send(err)
        }
      })

      // user api
      app.post('/users',verifyToken, async (req, res) =>{
        const user = req.body;
        const query = {email: user.email}
        const existingUser = await usersCollection.findOne(query)
        if(existingUser){
          return res.send({ message: 'user allready existing', insertedId: null })
        }
        const result = await usersCollection.insertOne(user)
        res.send(result)
    
      })
      app.get('/users',async(req,res) =>{
        const result =await usersCollection.find().toArray()
        res.send(result)
    })
    

       // Save or modify user email, status in DB
    // app.patch('/users/:email', async (req, res) => {
    //     const email = req.params.email
    //     const user = req.body
    //     const query = { email: email }
    //     const options = { upsert: true }
    //     const isExist = await usersCollection.findOne(query)
    //     console.log('User found?----->', isExist)
    //     if (isExist) return res.send(isExist)
    //     const result = await usersCollection.updateOne(
    //       query,
    //       {
    //         $set: { ...user },
    //       },
    //       options
    //     )
    //     res.send(result)
    //   })


      // post products 
      app.post("/products", async (req, res) => {
        const services = req.body;
        console.log(services);
        const result = await productsCollection.insertOne(services);
        console.log(result);
        res.send(result);
      });

    // products get 
    app.get('/products',async(req,res) =>{
      const result =await productsCollection.find().toArray()
      res.send(result)
  })



    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);












app.get('/', (req, res) => {
    res.send('Hello from Defot Server..')
  })
  
  app.listen(port, () => {
    console.log(`Defot is running on port ${port}`)
  })