const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express()
const port = process.env.PORT || 5000;

// middelware
app.use(cors())
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.z2xprxb.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send("unauthorized access");
  }

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}


async function run() {
  try {
    const appointmentOptionsCollection = client.db("dentalService").collection("appointmentOptions");
    const bookingsCollection = client.db("dentalService").collection("bookings");
    const usersCollection = client.db("dentalService").collection("users");
    const doctorsCollection = client.db("dentalService").collection("doctor");

    app.get('/appointmentOptions', async (req, res) => {
      const date = req.query.date;
        const query = {};
        const options = await appointmentOptionsCollection.find(query).toArray();
        const bookingQuery = {appointmentDate: date};
        const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();
        options.forEach(option =>{
          const optionBooked = alreadyBooked.filter(book =>book.treatment === option.name);
          const bookedSlots = optionBooked.map(book =>book.slot);
          const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot));
          option.slots = remainingSlots;
        });
        
        res.send(options);
      })

      app.get("/bookings", verifyJWT, async (req,res)=>{
        const email = req.query.email;
        const decodedEmail = req.decoded.email;
        if (email !== decodedEmail) {
          return res.status(403).send({ message: "forbidden access" });
        }
        const query = {email:email};
        const bookings = await bookingsCollection.find(query).toArray();
        res.send(bookings);
      });

      app.post('/bookings', async (req, res) => {
      const booking = req.body;
      const query = {
        appointmentDate: booking.appointmentDate,
        email: booking.email,
        treatment: booking.treatment,
      };

      const alreadyBooked = await bookingsCollection.find(query).toArray();

      if (alreadyBooked.length) {
        const message = `You already have a booking on ${booking.appointmentDate}`;
        return res.send({ acknowledged: false, message });
      }
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    })

    app.get("/users", async (req,res)=>{
       const query = {};
       const result = await usersCollection.find(query).toArray();
       res.send(result);
    })

    app.post("/users" , async (req,res)=>{
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    app.get('/users/admin/:email', async (req,res) => {
         const email = req.params.email;
         const query = { email };
         const user = await usersCollection.findOne(query);
         res.send({isAdmin: user?.role === 'admin'});
    })

    app.put('/users/admin/:id', verifyJWT, async(req,res)=>{
      const decodedEmail = req.decoded.email;
      const query = {email: decodedEmail};
      const user = await usersCollection.findOne(query);
      if(user?.role !== 'admin'){
        return res.status(403).send({message: 'forbidden access'});
      } 
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          role : 'admin'
        },
      };
      const result = await usersCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    })

    app.get("/appointmentSpecialty", async (req, res) => {
      const query = {};
      const result = await appointmentOptionsCollection.find(query).project({ name: 1 }).toArray();
      res.send(result);
    });

    app.get("/doctors", async (req, res) => {
      const query = {};
      const doctors = await doctorsCollection.find(query).toArray();
      res.send(doctors);
    });

    app.post("/doctors", async (req, res) => {
      const doctor = req.body;
      const result = await doctorsCollection.insertOne(doctor);
      res.send(result);
    });
     
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "1h",
        });
        return res.send({ accessToken: token });
      }
      res.status(403).send({ accessToken: "" });
    });
    
  } finally {
   
  }
}
run().catch(console.log);

app.get('/', (req, res) => {
  res.send('Dental server running')
})

app.listen(port, () => {
  console.log(`Dental server running on port ${port}`)
})



