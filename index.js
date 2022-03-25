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
const CHAT = 'chat'
const FEED = 'feed'
const FRIEND = 'friend'
const JOBOFFER = 'jobOffer'
const MEETUP = 'meetup'
const PERSON = 'person'

// Helper functions

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
    let CRITERIA = { _id }
    let initialData = await db.collection(collectionName).findOne(CRITERIA)
    let putData = req.body
    writeData = {
      "$set": {
        ...initialData,
        ...putData
      }
    }
    db.collection(collectionName).updateOne(CRITERIA, writeData)
    res.status(200)
    res.send("Updated successfully")
  } catch (e) {
    res.status(500)
    res.send('Internal server error')
  }
}

const deleteData = async (collectionName, req, res) => {
  try {
    console.log('a')
    _id = ObjectId(req.params['id'])
    let CRITERIA = { _id }
    console.log(CRITERIA)
    db.collection(collectionName).deleteOne(CRITERIA)
    res.status(200)
    res.send('Delete was successfull')
  } catch (e) {
    res.status(500)
    res.send("Internal server error")
  }
}
// End of helper functions

// Test
app.get('/', async (req, res) => {
  res.json({ result: `Port ${process.env.PORT} is live` })
})



// @routes for PERSON

// Get person INFO
app.get('/person/:id', async (req, res) => {
  getData(PERSON, req, res)
})

// Register user
app.post('/register', async (req, res) =>
// Validation in the forms.
  postData(PERSON, req, res)
)

app.put('/person/edit/:id/', async (req, res) =>
// Same validation in the forms
  putData(PERSON, req, res)
)

app.delete("/person/delete/:id", async (req, res) =>
  deleteData(PERSON, req, res)
)// Does not delete array content. Use Put route instead


// @routes for jobOffer 
// Redesign database so that we have separate column for currency and value
// Get person INFO
app.get('/job-offer/:id', async (req, res) =>
  getData(JOBOFFER, req, res)
)


app.post('/job-offer/add', async (req, res) =>
// Add a new field for currency
// Validation
  postData(JOBOFFER, req, res)
)

app.put('/job-offer/edit/:id', async (req, res) =>
  putData(JOBOFFER, req, res)
)

app.delete("/job-offer/delete/:id", async (req, res) =>

  deleteData(JOBOFFER, req, res)
)



// @feed 

app.get('/feed/:id', async (req, res) =>
  getData(FEED, req, res)
)


app.post('/feed/add', async (req, res) =>
  postData(FEED, req, res)
)

app.put('/feed/edit/:id', async (req, res) =>
  putData(FEED, req, res)
)

app.delete("/feed/delete/:id", async (req, res) =>
  deleteData(FEED, req, res)
)

// @meetup

app.get('/meet-up/:id', async (req, res) =>
  getData(MEETUP, req, res)
)


app.post('/meet-up/add', async (req, res) => {
  // Validation. Ensure date is after current time and ISODate form
  postData(MEETUP, req, res)
})

app.put('/meet-up/edit/:id', async (req, res) => {
  // Validation. Ensure date is after current time and its in ISODate form
  putData(MEETUP, req, res)
}
)

app.delete("/meet-up/delete/:id", async (req, res) =>
  // Ensure that id exist
  deleteData(MEETUP, req, res)
)

// @friend
// Change following / follower r/s similar to twitter

app.get('/friend/:id', async (req, res) =>
  getData(FRIEND, req, res)
)

// Becareful of how you post. You need to either redesign relationship or edit both user friendlist
app.post('/friend/add', async (req, res) =>
  postData(FRIEND, req, res)
)

app.put('/friend/edit/:id', async (req, res) =>
  putData(FRIEND, req, res)
)

app.delete("/friend/delete/:id", async (req, res) =>
  deleteData(FRIEND, req, res)
)

// @chat

app.get('/chat/:id', async (req, res) =>
  getData(CHAT, req, res)
)

app.post('/chat/add', async (req, res) =>
  postData(CHAT, req, res)
)

app.put('/chat/edit/:id', async (req, res) =>
  putData(CHAT, req, res)
)

app.delete("/chat/delete/:id", async (req, res) =>
  deleteData(CHAT, req, res)
)

//message

app.get('/message/:id', async (req, res) =>
  getData(MESSAGE, req, res)
)

app.post('/message/add', async (req, res) =>
//Edit timestamp to be current date generated by server because of malicious actor.
  postData(MESSAGE, req, res)
)

app.put('/message/edit/:id', async (req, res) =>
//Edit timestamp to be current date generated by server because of malicious actor.
  putData(MESSAGE, req, res)
)

app.delete("/message/delete/:id", async (req, res) =>
  deleteData(MESSAGE, req, res)
)

// Booting server
app.listen(process.env.PORT, () => {
  console.log(`${process.env.PORT} has just started`)
})

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

>>>>>>>>>><<<<<<<<< Search engine >>>>>>>>>>>>>>><<<<<<<<<

// Person
// Regex to find person based on name
// Regex to find based on interest tag
// Regex to find education and license / certification
// Allow other user to find person based on email
// jobAvailability -> Find available job people
// Allow combining filter -> Job availability and education (maybe use regex)

meetUp
// REGEX allow to find meetup based on name
// REGEX able to find meet up based on purpose
// Ensure date is in ISODATE form (unix)
// 

friend
// Change this to following / follower

chat
//chat

message
// Regex allow finding of message content

jobOffer

// REGEX to find job description
// REGEX to find job title
// REGEX to find jobTags
// REGEX to find location
// filter to find job based on pay $lte $gte
// filter based on dateposted

*/


