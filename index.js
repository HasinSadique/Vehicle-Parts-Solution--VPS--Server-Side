const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();

app.use(cors());
app.use(express.json({ extended: false }));

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log("Server started on port: ", port);
});

// username: db_user1
// pass: 7sUxddZXc1uNoFor

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PWD}@vehicle-parts-solutiond.nhezt.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});

async function run() {
    try {
        await client.connect();
        console.log("DB connected.");
        const partsInventoryCollection = client
            .db("Vehicle_Parts_Inventory")
            .collection("Parts");

        app.get("/getParts", async(req, res) => {
            const query = {};
            const cursor = partsInventoryCollection.find(query);
            const items = await cursor.toArray();
            res.send(items);
        });

        app.get("/getParts/:id", async(req, res) => {
            const id = req.params.id;
            console.log("id>>>: ", id);
            const query = { _id: id };
            const item = await partsInventoryCollection.findOne(query);
            res.send(item);
            // console.log("ff");
        });
    } catch (e) {
        console.log("Error is: ", e);
    } finally {}
}

run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Hello User Welcome to Vehicle part Solutions Site Server");
});

// client.connect((err) => {
//     const collection = client.db("test").collection("devices");
//     // perform actions on the collection object
//     client.close();
// });