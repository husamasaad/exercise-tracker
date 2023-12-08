const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const mongoose = require('mongoose');
mongoose.connect(process.env.DB_URL)
const { Schema } = mongoose;

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", function () {
  console.log("connected");
});

const UserSchema = new Schema({
  username: String
})
const User = mongoose.model("User", UserSchema);

const ExcreciseSchema = new Schema({
    user_id: { type: String, required: true },
    description: String,
    duration: Number,
    date: Date,
})
const Excercise = mongoose.model("Excercise", ExcreciseSchema)

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users", async (req, res) => {
  try {
    const newUser = await User.create({
      username: req.body.username
    })
    res.json({ 
      _id: newUser._id,
      username: req.body.username
    })
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({});

    const usersArray = users.map(user => ({
      username: user.username,
      _id: user._id
    }))

    res.json(usersArray)
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

app.post("/api/users/:_id/exercises", async (req, res) => {
  try {

    const theUser = await User.findById(req.params._id)
    
    const theDate = req.body.date
      ? new Date(req.body.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const newExcercise = await Excercise.create({
      user_id: req.params._id,
      description: req.body.description,
      duration: req.body.duration,
      date: theDate,
    })

    res.json({
      username: theUser.username,
      _id: theUser._id,
      description: req.body.description,
      duration: req.body.duration,
      date: theDate,
    })

  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const theUser = await User.findById(req.params._id)

    let query = { user_id: req.params._id } 

    if (req.query.from) {
      query.date = { $gte: new Date(req.query.from) };
    }

    if (req.query.to) {
      const toFilter = query.date ? query.date.$lte : {};
      query.date = { ...toFilter, $lte: new Date(req.query.to) };
    }

    const excercises = await Excercise.find(query)

    if (req.query.limit) {
      excercises = excercises.slice(0, parseInt(req.query.limit));
    }

    res.json({
      username: theUser.username,
      count: excercises.length,
      _id: theUser._id,
      log: excercises.map(item => ({
        description: item.description,
        duration: item.duration,
        date: new Date(item.date).toDateString(),
      }))
    })


  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})