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
    const { email, password } = req.body
    let CRITERIA = { email , password }
    let result = await db.collection(PERSON).findOne(CRITERIA)
    console.log(result == null)
    if (result == null) throw Error
    console.log('Success')
    res.status(200)
    res.send(result)
  } catch (err) {
    res.status(500)
    console.log('Failure')
    res.send('Failure')
  }
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

app.put('/messageCache/clear/', async (req, res) => {
  try {

    let criteria = {
      chatId: ObjectId(req.body['chatId']),
      to: ObjectId(req.body['from'])
    }
    let updateData = {
      $set: {
        unreadCount: Number(0)
      }
    }
    await db.collection("messageCache").updateOne(criteria, updateData)
    res.status(200)
    res.send("Clear cache")
  } catch (e) {
    res.status(500)
    res.send('Internal server error')
  }
})

app.delete("/messageCache/delete/:id", async (req, res) =>
  deleteData(MESSAGECACHE, req, res)
)
//message

// Get data thru a post request
app.post('/message/criteria', async (req, res) => {
  try {
    let criteria = { chatId: ObjectId(req.body['chatId']) }

    let result = await db.collection('message').find(criteria)
      .sort({ timestamp: 1 })
      .toArray()
    res.status(200)
    res.send(result)
  } catch (e) {
    res.status(500)
    res.send('Internal server error')
  }
})

app.post('/message/add', async (req, res) => {
  //Edit timestamp to be current date generated by server because of malicious actor.  // Manage objectId here
  try {
    let chatId = ObjectId(req.body['chatId'])
    let from = ObjectId(req.body['from'])
    let lastMessage = req.body['message']
    let timestamp = (new Date().getTime())
    let writeMessage = {
      ...req.body,
      chatId,
      from,
      timestamp
    }

    db.collection('message').insertOne(writeMessage)
    db.collection('messageCache').updateMany({ chatId }, { $set: { lastMessage } })
    db.collection('messageCache').updateOne({ chatId, from }, { $inc: { unreadCount: 1 } })


    res.status(200)
    res.send(`User was added successfully`)
  } catch (e) {
    res.status(500)
    res.send('Internal server error')
  }
})

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




// db.messageCache.insertOne({
//   chatId: ObjectId("624ecf784ab76ecc4ec6155a"),
//   from: ObjectId("624d1b9455469b89e419d590"),
//   to: ObjectId("624ecbaeb352dc9e1170acca"),
//   lastMessage:"",
//   unreadCount: Number(0),
//   timestamp : 1649336540,
//   imageUrl: `data:image/jpeg;base64,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`,
//   firstName: 'Admin',
//   lastName: 'test'
// })
// db.messageCache.updateOne(
//   {
//     _id: ObjectId("624f14eb1d4640363ab6d7f5")
//   },
//   {
//     $set:
//     {
//       unreadCount: Number(2)
//     }
//   })




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
  db.messageCache.updateOne({ _id: ObjectId("624f14eb1d4640363ab6d7f2") },
      {
        $set:
        {
          unreadCount: Number(2)
        }
      })
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