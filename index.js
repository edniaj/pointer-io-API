const express = require('express')

require('dotenv').config()
const cors = require('cors')
const ObjectId = require('mongodb').ObjectId
const Mongo_Util = require('./MongoUtil')

let app = express()
app.use(cors())
app.use(express.json())

let db
  ; (async () => {
    db = await Mongo_Util.connect(process.env.MONGO_URI, process.env.DATABASE)
  })()
// SETUP END

// Variable USED
const PERSON = 'person'
const JOBOFFER = 'jobOffer'
const FRIEND = 'friend'

// Test
app.get('/', async (req, res) => {
  res.json({ result: `Port ${process.env.PORT} is live` })
})



// @routes for PERSON

// Get person INFO
app.get('/person/:personID', async (req, res) => {
  try {
    _id = req.params['personID'] == 'all' ? '' : ObjectId(req.params['personID'])
    CRITERIA = { _id }
    let result = req.params['personID'] == 'all' ? await db.collection(PERSON).find({}).toArray() : await db.collection(PERSON).findOne(CRITERIA)
    res.status(200)
    res.send(result)
  } catch (e) {
    res.status(500)
    res.send('Internal server error')
  }
})

// Register user
app.post('/register', async (req, res) => {
  
  try {
    result = await req.body

    db.collection(PERSON).insertOne(result)

    res.status(200)
    res.send(`User was added successfully`)
  } catch (e) {
    res.status(500)
    res.send('Internal server error')
  }
})

app.put('/edit/person/:id/', async (req, res) => {

  try {
    // Get initial data from database first
    _id = ObjectId(req.params['id'])
    let CRITERIA = { _id }
    let initialData = await db.collection(PERSON).findOne(CRITERIA)

    putData = req.body

    writeData = {
      "$set": {
        ...initialData,
        ...putData
      }
    }

    db.collection(PERSON).updateOne(CRITERIA, writeData)
    res.status(200)
    res.send("Updated successfully")
  } catch (e) {
    res.status(500)
    res.send('Internal server error')
  }
})

app.delete("/delete/person/:id", async (req, res) => { // Does not delete array content. Use Put route instead
  try {
    _id = ObjectId(req.params['id'])
    let CRITERIA = { _id }
    db.collection(PERSON).deleteOne(CRITERIA)
    res.status(200)
    res.send('Delete was successfull')
  } catch (e) {
    res.status(500)
    res.send("Internal server error")
  }
})

// end of Person Routes

// @routes for jobOffer 

// Get person INFO
app.get('/job-offer/:jobID', async (req, res) => {
  // Adjust code to accept query (must include arrays)
  //623bf4ae5391a8802ca4fac4
  try {
    _id = req.params['jobID'] == 'all' ? '' : ObjectId(req.params['jobID'])
    CRITERIA = { _id }
    let result = req.params['jobID'] == 'all' ? await db.collection(JOBOFFER).find({}).toArray() : await db.collection(JOBOFFER).findOne(CRITERIA)
    res.status(200)
    res.send(result)
  } catch (e) {
    res.status(500)
    res.send('Internal server error')
  }
})

// Register user
app.post('/add/job-offer', async (req, res) => {
  // You cannot use query in post
  try {
    result = await req.body

    db.collection(JOBOFFER).insertOne(result)

    res.status(200)
    res.send(`Job offer was added successfully`)
  } catch (e) {
    res.status(500)
    res.send('Internal server error')
  }
})

app.put('/edit/job-offer/:id/', async (req, res) => {

  try {
    // Get initial data from database first
    _id = ObjectId(req.params['id'])
    let CRITERIA = { _id }
    let initialData = await db.collection(JOBOFFER).findOne(CRITERIA)

    putData = req.body

    writeData = {
      "$set": {
        ...initialData,
        ...putData
      }
    }

    db.collection(JOBOFFER).updateOne(CRITERIA, writeData)
    res.status(200)
    res.send("Updated successfully")
  } catch (e) {
    res.status(500)
    res.send('Internal server error')
  }
})

app.delete("/delete/job-offer/:id", async (req, res) => { // Does not delete array content. Use Put route instead
  try {
    _id = ObjectId(req.params['id'])
    let CRITERIA = { _id }
    db.collection(JOBOFFER).deleteOne(CRITERIA)
    res.status(200)
    res.send('Delete was successfull')
  } catch (e) {
    res.status(500)
    res.send("Internal server error")
  }
})



// End of jobOffer routes




/*
Masterplan

Allow front end to clean up data and verification/ validation
=======

person
get -> All information get/:id/?education=valueInsideEducation
  -> if query is empty then query everything

post -> Register new user

put -> For person to change their information. :id/query -> query is the one you are trying to change
put -> Allows user to change password

delete -> When people delete their account

jobOffer
get -> Get all info based on ID
  if query empty -> query everything

post -> new job offers
put -> For person to change the job offer 
update -> Must be careful of updating multivalued list (job tags, location)
Delete -> Delete job offer


feed
get -> query because you wan to find friend post and your own post
post -> post the feed
put -> Update the comments, like and share section. (update)
delete -> just delete

meet up
get -> get the info thru query. Can query meet up with search engine, shud find thru interest tags 
post -> post a new meet up
put -> Change in date, purpose
delete -> delete meet up

friend
get -> Find all friends
post -> When new friend ship is formed
delete -> delete friend

chat
get -> userid1, userid2 -> use this to find message
post -> post message
delete -> delete chat

messages
get -> get messages. Aggregate from and to field.
put -> change / edit message. timestamp will automatically change
<<<<<<< HEAD

Search engine
Use regex in get request 
*/

// START SERVER
app.listen(process.env.PORT, () => {
  console.log(`${process.env.PORT} has just started`)
})
