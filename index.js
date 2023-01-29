const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express()
const port = process.env.PORT || 5000;

// middelware
app.use(cors())
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.z2xprxb.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
  try {
    const appointmentOptionsCollection = client.db("dentalService").collection("appointmentOptions");
    const bookingsCollection = client.db("dentalService").collection("bookings");

    app.get('/appointmentOptions', async (req, res) => {
        const query = {};
        const options = await appointmentOptionsCollection.find(query).toArray();
        res.send(options);
      })

      app.post('/bookings', async (req, res) => {
      const booking = req.body;
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    })
    
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



