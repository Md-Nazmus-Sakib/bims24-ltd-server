const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

// middle wear
app.use(cors())
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.91makds.mongodb.net/?retryWrites=true&w=majority`;

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
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        const usersCollection = client.db("bims24Ltd").collection("users");
        const shopsCollection = client.db("bims24Ltd").collection("shops");

        // user related api 
        const USER_PAGE_SIZE = 10;
        app.get('/users', async (req, res) => {
            const page = parseInt(req.query.page) || 1;
            const skip = (page - 1) * USER_PAGE_SIZE;

            const [result, totalUser] = await Promise.all([
                usersCollection.find().sort({ id: 1 }).skip(skip).limit(USER_PAGE_SIZE).toArray(),
                usersCollection.countDocuments() // Calculate the total count
            ]);


            res.send({ 'users': result, 'countUser': totalUser });

        });
        app.get('/users/role/:email', async (req, res) => {
            const email = req.params.email;
            // const query = { email: email };
            // const projection = { role: 1 };
            // // console.log(projection)

            // const user = await usersCollection.findOne(query, projection);
            // if (user && user.role) {
            //     res.send({ role: user.role });
            // } else {
            //     res.send([]);
            // }

            const query = { email: email }
            const user = await usersCollection.findOne(query);
            const result = { admin: user?.role === "Admin" };
            res.send(result)
        })
        app.post('/users', async (req, res) => {
            const user = req.body;
            // console.log(user)
            const query = { email: user.email }
            const existingUser = await usersCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already exists', insertedId: null })
            }
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });
        // shop related api 
        const PAGE_SIZE = 10;

        app.get('/shops', async (req, res) => {
            const page = parseInt(req.query.page) || 1;
            const skip = (page - 1) * PAGE_SIZE;

            const [result, totalCount] = await Promise.all([
                shopsCollection.find({ status: 'Approve' }).sort({ selectedDistrict: 1 }).skip(skip).limit(PAGE_SIZE).toArray(),
                shopsCollection.countDocuments({ status: 'Approve' }) // Calculate the total count
            ]);


            res.send({ 'shops': result, 'countShop': totalCount });

        });
        app.get('/shops/request', async (req, res) => {

            const result = await shopsCollection.find({ status: 'Pending' }).toArray();
            res.send(result);

        });

        app.get('/shops/:townName', async (req, res) => {

            const searchTown = req.params.townName;
            const result = await shopsCollection.find({
                status: 'Approve',
                selectedTown: { $regex: new RegExp(searchTown, 'i') }
            }).toArray();
            res.send(result);
        });

        app.post('/shops', async (req, res) => {
            const shop = req.body;
            const query = { mobile: shop.mobile }
            const existingShop = await shopsCollection.findOne(query);
            if (existingShop) {
                return res.send({ message: 'shop already exists', insertedId: null })
            }
            const result = await shopsCollection.insertOne(shop);
            res.send(result);
        });

        app.patch('/shop/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    status: 'Approve'
                }
            }
            const result = await shopsCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        app.delete('/shops/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await shopsCollection.deleteOne(query);
            res.send(result)
        })

        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Bims24 Server is Running')
})

app.listen(port, () => {
    console.log(`Bims24 is running on port: ${port}`)
})