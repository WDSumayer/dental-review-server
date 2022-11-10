const express = require('express')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const port = process.env.PORT || 5000;

//middleware
app.use(cors())
app.use(express.json())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.nrkuqgj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if(!authHeader){

        return res.status(401).send({message: 'unathorized access'})
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, function(err, decoded){
        if(err){
            return res.status(401).send({message: 'unathorized access'})
        }
        req.decoded = decoded;
        next()
    })

}

async function run() {
    try{
        const dentalServiceCollection = client.db('dentalCare').collection('dentServices');
        const dentalReviewCollection = client.db('dentalCare').collection('dentReviews');

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, {expiresIn: '1h'})
            res.send({token})
        })

        app.get('/limitServices', async(req, res) => {
            const query = {}
            const cursor = dentalServiceCollection.find(query)
            const services = await cursor.limit(3).toArray()
            res.send(services)
        })
        app.get('/services', async(req, res) => {
            const query = {}
            const cursor = dentalServiceCollection.find(query)
            const services = await cursor.toArray()
            res.send(services)
        })
        app.get('/services/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)}
            const service = await dentalServiceCollection.findOne(query)
            res.send(service)
        })
        app.get('/reviews', async(req, res) => {
            const query = {}
            const cursor = dentalReviewCollection.find(query)
            const reviews = await cursor.toArray()
            res.send(reviews)
        })
        app.get('/reviewsById', async(req, res) => {
            console.log(req.query.id)
            let query = {}
            if(req.query.id){
                query = {
                    service_id: req.query.id
                }
            }
            const cursor = dentalReviewCollection.find(query)
            const reviews = await cursor.toArray()

            res.send(reviews)
           
           
        })
        app.get('/reviewsByEmail',verifyJWT, async(req, res) => {
            const decoded = req.decoded;
            if(decoded.email !== req.query.email){
              res.status(403).send({message: 'unathorized user'})
            }
            let query = {}
            console.log(req.query.email)
            if(req.query.email){
                query= {
                    email: req.query.email
                }
                const cursor = dentalReviewCollection.find(query)
                const reviews = await cursor.toArray()

                res.send(reviews)
            }
        })
        app.get('/reviews/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)}
            const review = await dentalReviewCollection.findOne(query)
            res.send(review)
        })
        app.post('/services', async(req, res) => {
            const service = req.body;
            const result = await dentalServiceCollection.insertOne(service)
            res.send(result)
        })
        app.post('/reviews', async(req, res) => {
            const review = req.body;
            const result = await dentalReviewCollection.insertOne(review)
            res.send(result)
        })
        app.patch('/reviews/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)}
            const review = req.body;
            const updateReview = {
                $set: {
                    description: review.description
                }
            }
            const result = await dentalReviewCollection.updateOne(query, updateReview)
            res.send(result)
        })
        app.delete('/reviews/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)}
            const result = await dentalReviewCollection.deleteOne(query)
            res.send(result)
        })
    }
    finally{

    }
}
run().catch(error => console.log(error))



app.get('/', (req, res) => {
    res.send('server is running')
})

app.listen(port, () => {
    console.log('the servier is running on ' , port)
})