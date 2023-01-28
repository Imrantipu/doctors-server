const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express()
const port = process.env.PORT || 5000;

// middelware
app.use(cors())
app.use(express.json());


app.get('/', (req, res) => {
  res.send('Dental server running')
})

app.listen(port, () => {
  console.log(`Dental server running on port ${port}`)
})
