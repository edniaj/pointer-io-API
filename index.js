const express = require('express')

require('dotenv').config()
const cors = require('cors')
const ObjectId = require('mongodb').ObjectId
const Mongo_Util = require('./MongoUtil')
const { setTheUsername } = require('whatwg-url')

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
const JOBOFFER = 'jobOffer'
const PERSON = 'person'
const MESSAGECACHE = "messageCache"
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
    let clone = {
      ...initialData,
      ...putData
    }
    delete clone["_id"]
    clone['creator'] = ObjectId(clone['creator'])
    writeData = {
      "$set": {
        ...clone
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

// @route for login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    console.log(username, password)
    let CRITERIA = { email: username, password }
    let result = await db.collection(PERSON).findOne(CRITERIA)
    console.log(result == null)
    if (result == null) throw Error
    console.log('Success')
    res.status(200)
    res.send('Success')
  } catch (err) {
    res.status(500)
    console.log('Failure')
    res.send('Failure')
  }
})


// @routes for PERSON

//login route
// app.post('/login', async (req, res) => {
//   let CRITERIA = req.body
//   console.log('CRTIERIA :', CRITERIA)
//   let result = await db.collection(PERSON).findOne(req.body)
//   console.log(result)
//   // Do authentication
//   // End of authentication
//   res.send(result)

// })

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

app.post('/person/criteria', async (req, res) => {
  try {
    let CRITERIA = { ...req.body }
    for (let i in CRITERIA._id['$in']) {
      CRITERIA._id['$in'][i] = ObjectId(CRITERIA._id['$in'][i])
    }
    // console.log('req.body  ',CRITERIA)

    let result = await db.collection(PERSON).find(CRITERIA).toArray()
    // console.log('result  :',result)
    res.status(200)
    res.send(result)
  } catch (e) {
    res.status(500)
    res.send('Internal server error')
  }
})
// @routes for jobOffer 
// Redesign database so that we have separate column for currency and value
// Get person INFO
app.get('/job-offer/:id', async (req, res) =>
  getData(JOBOFFER, req, res)
)


app.post('/job-offer/add', async (req, res) => {
  req.body.creator = ObjectId(req.body.creator)
  req.body.minPay = parseInt(req.body.minPay)
  req.body.maxPay = parseInt(req.body.maxPay)
  postData(JOBOFFER, req, res)
})

app.put('/job-offer/edit/:id', async (req, res) =>
  putData(JOBOFFER, req, res)
)

app.delete("/job-offer/delete/:id", async (req, res) =>
  deleteData(JOBOFFER, req, res)
)

// Get job-offer that are linked to creator id
app.get('/job-offer/view/:id', async (req, res) => {
  try {
    let _id = ObjectId(req.params['id'])
    let CRITERIA = { creator: _id }
    let result = await db.collection('jobOffer').find(CRITERIA).toArray()
    res.status(200)
    res.send(result)
  } catch (e) {
    res.status(500)
    res.send('Internal server error')
  }
})

// For comprehensive filter method. 
// when we receive req.body, it is in json.stringify format
app.post('/job-offer/criteria', async (req, res) => {

  for (let i in req.body) {
    if (req.body[i].length == 0) delete req.body[i]
  }
  console.log(req.body)
  let criteria = {
    "$and": [],
    '$or': []
  }
  for (let i in req.body) {
    if (i == 'jobTitle') {
      criteria['$and'].push({ jobTitle: { $regex: `${req.body[i]}`, $options: "i" } })
    }
    if (i == 'organizationName') {
      criteria['$and'].push({ organizationName: { $regex: `${req.body[i]}`, $options: "i" } })
    }
    if (i == 'minPay') {
      criteria['$and'].push({ minPay: { $gte: parseInt(req.body[i]) } })
    }
    if (i == 'maxPay') {
      criteria['$and'].push({ maxPay: { $lte: parseInt(req.body[i]) } })

    }
    if (['fieldOfStudy', 'framework', 'programmingLanguage', 'selectJob'].includes(i)) {
      if (req.body[i].length == 0) continue
      criteria['$or'].push({ [i]: { $in: req.body[i] } })
    }
  }

  if (criteria['$or'].length == 0) delete criteria['$or']
  if (criteria['$and'].length == 0) delete criteria['$and']
  // console.log(JSON.stringify(criteria))
  try {
    let result = await db.collection(JOBOFFER).find(criteria).toArray()
    res.status(200)
    res.send(result)
  } catch {
    res.status(500)
    res.send('Internal server error')
  }
  // console.log(result)
})
// @chat

app.get('/chat/:id', async (req, res) => {
  try {
    let _id = ObjectId(req.params['id'])
    // console.log(_id)
    CRITERIA = { participant: { "$in": [_id] } }
    let result = await db.collection(CHAT).find(CRITERIA).toArray()
    res.status(200)
    res.send(result)
  } catch (e) {
    res.status(500)
    res.send('Internal server error')
  }
})

app.post('/chat/add', async (req, res) =>
  postData(CHAT, req, res)
)

app.put('/chat/edit/:id', async (req, res) =>
  putData(CHAT, req, res)
)

app.delete("/chat/delete/:id", async (req, res) =>
  deleteData(CHAT, req, res)
)

//messageCache
app.get('/messageCache/:id', async (req, res) => {
  try {
    let _id = ObjectId(req.params['id'])
    let CRITERIA = { to: _id }
    let result = await db.collection(MESSAGECACHE).find({
      to: _id
    }).toArray()

    res.status(200)
    res.send(result)
  } catch (e) {
    res.status(500)
    res.send('Internal server error')
  }
})

app.post('/messageCache/add', async (req, res) =>
  postData(MESSAGECACHE, req, res)
)

app.put('/messageCache/edit/:id', async (req, res) =>
  putData(MESSAGECACHE, req, res)
)

app.delete("/messageCache/delete/:id", async (req, res) =>
  deleteData(MESSAGECACHE, req, res)
)
//message

app.post('/message/criteria', async (req, res) =>
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




// db.jobOffer.find({framework:{$in:[]}})
// db.jobOffer.find({jobTitle:/Full stack/i},{jobTitle:1,minPay:-1}).sort({"minPay":1})

// "$or":["minPay":{"$gte":3500}, "programmingLanguage":{"$in":["JavaScript"]}]

// db.jobOffer.find({
//   "$and": [
//     {
//       "$or":
//         [
//           { "minPay": { "$gte": 3500 } },

//         ]
//     } db.jobOffer.find({$or:[{jobTags:{$in:['Backend Developer']}}]})
//   ]
// })
/*
{
        "programmingLanguage": {
          "$in": ["JavaScript"]
        }
      }
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


// db.messageCache.find(
//   {
//     to: ObjectId("624d1b9455469b89e419d590")
//   }
// )