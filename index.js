const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
        const OrderCollection = client
            .db("Vehicle_Parts_Inventory")
            .collection("Orders");
        const userDetailsCollection = client
            .db("Vehicle_Parts_Inventory")
            .collection("userDetails");
        const usersCollection = client
            .db("Vehicle_Parts_Inventory")
            .collection("Users");
        const reviewCollection = client
            .db("Vehicle_Parts_Inventory")
            .collection("Reviews");

        app.get("/getParts", async(req, res) => {
            const query = {};
            const cursor = partsInventoryCollection.find(query);
            const items = await cursor.toArray();
            res.send(items);
        });

        app.get("/review", async(req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query);
            const items = await cursor.toArray();
            res.send(items);
            // console.log("review", items);
        });

        app.get("/getParts/:id", async(req, res) => {
            const id = req.params.id;
            console.log("id>>>: ", id);
            const query = { _id: id };
            const item = await partsInventoryCollection.findOne(query);
            res.send(item);
            // console.log("ff");
        });

        app.post("/booking", async(req, res) => {
            const { Email, partName, Quantity, price } = req.body;
            let order = {
                userEmail: Email,
                partName: partName,
                orderedQuantity: Quantity,
                price: price,
                payment: false,
            };
            // res.send({ success: true, msg: "Order Placed Successfully" });
            // console.log("Email: ", price);
            // console.log("PartID: ", Quantity);
            const id = (await OrderCollection.insertOne(order)).insertedId;
            if (id) {
                res.send({ success: true, msg: "Oder Placed Successfully" });
            }
        });

        app.get("/booking/:id", async(req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { _id: ObjectId(id) };
            const order = await OrderCollection.findOne(query);
            // console.log(order);
            res.send(order);
        });

        app.get("/check-user-role", async(req, res) => {
            const userEmail = req.query.userEmail;
            console.log(userEmail);
            // const query = { userEmail };
            const currentUser = await usersCollection.findOne({ userEmail });
            // console.log(currentUser);
            res.send(currentUser);
        });

        app.post("/set-userrole", async(req, res) => {
            const { userEmail, userRole } = req.body;
            let user = { userEmail: userEmail, userRole: userRole };
            console.log(user);
            let response = await usersCollection.findOne(user);
            console.log("resp: ", response);
            if (response == null) {
                const id = await (await usersCollection.insertOne(user)).insertedId;
                if (id) {
                    res.send({ success: true, msg: "user's role is set." });
                }
            } else {
                res.send({ success: true, msg: `Already a ${response.userRole}` });
            }
        });

        app.get("/get-all-users", async(req, res) => {
            const query = {};
            const cursor = usersCollection.find(query);
            const users = await cursor.toArray();
            res.send(users);
        });

        app.put("/users/:email", async(req, res) => {
            const email = req.params.email;
            console.log("param email: ", email);
            const filter = { userEmail: email };
            const updateUser = {
                $set: { userRole: "Admin" },
            };
            const result = await usersCollection.updateOne(filter, updateUser);
            // res.send(result);
            console.log(result);
        });
        app.get("/get-orders", async(req, res) => {
            const userEmail = req.query.buyer;

            // console.log("Buyer: ", userEmail);
            const query = { userEmail };
            const cursor = await OrderCollection.find(query);
            const items = await cursor.toArray();
            if (items.length > 0) {
                res.send(items);
            } else {
                res.send({ msg: "No Orders." });
            }
        });

        app.delete("/delete-item/:id", async(req, res) => {
            const id = req.params.id;
            console.log("ID: ", id);

            const query = { _id: ObjectId(id) };
            const result = await OrderCollection.deleteOne(query);
            if (result.acknowledged == true) {
                res.send({ Status: 200, msg: "Successfully Deleted." });
            } else {
                res.send(status, { msg: "kuch to garbar hay..." });
            }
        });

        app.put("/add-profile-info", async(req, res) => {
            const { name, email, city, phone, linkedInProfile, undergraduation } =
            req.body;

            const filter = { email: email };
            const options = { upsert: true };
            const updateUserDetails = {
                $set: {
                    name: name,
                    email: email,
                    city: city,
                    phone: phone,
                    linkedInProfile: linkedInProfile,
                    undergraduation: undergraduation,
                },
            };
            const result = await userDetailsCollection.updateOne(
                filter,
                updateUserDetails,
                options
            );

            res.send({ result });

            // console.log("nam: ", name);
        });

        app.get("/get-userdetails", async(req, res) => {
            const email = req.query.user;
            console.log(email);
            const query = { email };
            const user = await userDetailsCollection.findOne(query);

            res.send(user);
        });

        app.post("/part", async(req, res) => {
            const equipment = req.body;
            const result = await partsInventoryCollection.insertOne(equipment);
            res.send(result);
        });

        app.post("/review", async(req, res) => {
            const comment = req.body;
            console.log(comment);
            const insertedId = (await reviewCollection.insertOne(comment)).insertedId;
            res.send({ insertedId });
            // console.log({ insertedId });
        });
        // app.post("/create-payment-intent", async(req, res) => {
        //     const { price } = req.body;
        //     const amount = price * 100;
        //     console.log(amount);
        //     const paymentIntent = await stripe.paymentIntents.create({
        //         amount: amount,
        //         currency: "usd",
        //         payment_method_types: ["card"],
        //     });
        //     res.send({ clientSecret: paymentIntent.client_secret });
        // });

        app.post("/create-payment-intent", async(req, res) => {
            const order = req.body;
            const price = order.price;
            const amount = price * 100;
            if (amount != NaN) {
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: amount,
                    currency: "usd",
                    payment_method_types: ["card"],
                });
                res.send({ clientSecret: paymentIntent.client_secret });
            } else {
                console.log("ghumay jao");
            }
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