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

const getData = async (collectionName, req, res) => {
  try {
    _id = req.params['id'] == 'all' ? '' : ObjectId(req.params['id'])
    CRITERIA = { _id }
    let result = req.params['id'] == 'all' ? await db.collection(collectionName).find({}).toArray() : await db.collection(collectionName).findOne(CRITERIA)
    res.status(200)
    res.send(result)
  } catch (e) {
    res.status(500)
    res.send('Internal server error')
  }
}

const postData = async (collectionName, req, res) => {
  try {
    result = await req.body

    db.collection(collectionName).insertOne(result)

    res.status(200)
    res.send(`User was added successfully`)
  } catch (e) {
    res.status(500)
    res.send('Internal server error')
  }
}

const putData = async (collectionName, req, res) => {
  try {
    // Get initial data from database first
    _id = ObjectId(req.params['id'])
    console.log(_id)
    let CRITERIA = { _id }
    let initialData = await db.collection(collectionName).findOne(CRITERIA)
    let putData = req.body
    writeData = {
      "$set": {
        ...initialData,
        ...putData
      }
    }
    console.log(writeData)
    db.collection(collectionName).updateOne(CRITERIA, writeData)
    res.status(200)
    res.send("Updated successfully")
  } catch (e) {
    res.status(500)
    res.send('Internal server error')
  }
}

const deleteData = async(collectionName,req,res) => {
  try {
    _id = ObjectId(req.params['id'])
    let CRITERIA = { _id }
    db.collection(collectionName).deleteOne(CRITERIA)
    res.status(200)
    res.send('Delete was successfull')
  } catch (e) {
    res.status(500)
    res.send("Internal server error")
  }
}

// Get person INFO
app.get('/person/:id', async (req, res) =>
  getData(PERSON, req, res)
)

// Register user
app.post('/register', async (req, res) =>
  postData(PERSON, req, res)
)

app.put('/person/edit/:id/', async (req, res) =>
  putData(PERSON, req, res)
)

app.delete("/person/delete/:id", async (req, res) =>  
  deleteData(PERSON,req,res)  
)// Does not delete array content. Use Put route instead

// end of Person Routes

// @routes for jobOffer 

// Get person INFO
app.get('/job-offer/:id', async (req, res) =>
  getData(JOBOFFER, req, res)
)

// Register user
app.post('/job-offer/add', async (req, res) =>
  postData(JOBOFFER, req, res)
)

app.put('/job-offer/edit/:id', async (req, res) => 
  putData('id',JOBOFFER,req,res)
)

app.delete("/job-offer/delete/:id", async (req, res) => { // Does not delete array content. Use Put route instead
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
