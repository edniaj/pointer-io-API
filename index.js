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
    let CRITERIA = { email, password }
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

//login route
app.post('/login', async (req, res) => {
  let CRITERIA = req.body
  console.log('CRTIERIA :', CRITERIA)
  let result = await db.collection(PERSON).findOne(req.body)
  console.log(result)
  // Do authentication
  // End of authentication
  res.send(result)

})

// Get person INFO
app.get('/person/:id', async (req, res) => {
  getData(PERSON, req, res)
})

// SERVER VALIDATION
app.post('/register', async (req, res) => {

  const validateEmail = x => {
    x = x === undefined ? '' : x
    let isValid = x.match(
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )
    if (!isValid) throw 'Please enter a valid email address'
  }
  const validatePassword = x => {
    x = x === undefined ? '' : x
    let upperCase = false
    let lowerCase = false
    let number = false
    for (let i of x) {
      if (/[a-z]/.test(i)) lowerCase = true
      if (/[A-Z]/.test(i)) upperCase = true
      if (/[0-9]/.test(i)) number = true
    }
    if (x.length >= 8 && x.length <= 16 && lowerCase && upperCase && number) {
      return
    }
    // at least one uppercase letter, one lowercase letter, one number and one special character: min length 8, max length 16
    throw "Password invalid"
  }
  const validateString = x => {

    x = x === undefined ? '' : x
    if (x.length === 0) {
      console.log('validate string')
      throw `Field cannot be empty`
    }
    for (let i of x) {
      if (!/[a-zA-Z\s]/.test(i)) {
        console.log('invalid string')
        throw `Field only consist of characters`
      }
    }
    return false
  }
  const validateContactNumber = x => {
    x = x === undefined ? '' : x
    if (x.length === 0) throw "Phone number cannot be empty"
    for (let i of x) {
      if (!/[0-9]/.test(i)) {
        if (i !== '-') throw "Phone number can only consist of numbers and '-' "
      }
    }
    return false
  }
  try {
    let result = await req.body
    console.log(req.body)
    validateEmail(req.body.email)
    validatePassword(req.body.password)
    const { email, imageUrl, firstName, lastName, country, jobAvailability, contactNumber } = req.body
    let stringField = [firstName, lastName, country, jobAvailability]
    if (imageUrl.length == 0) throw "Image url must not be empty"
    console.log(stringField)
    for (let i of stringField) validateString(i)
    validateContactNumber(contactNumber)
    console.log("OK")
    await db.collection('person').findOne({ email })
      .then(x => {
        if (x == null) {
          console.log(x)
          console.log('user does not exist')
          result['_id'] = new ObjectId()
          db.collection('person').insertOne(result) // IMPORTANT
        }
        else {
          console.log('user exist')
          throw "User is registered"
        }
      })
    res.status(200)
    res.send(result['_id'])
  } catch (err) {
    res.status(500)
    console.log(`error ${err}`)
    res.send(err)
  }
}
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
    console.log('req.body  ', CRITERIA)

    let result = await db.collection(PERSON).find(CRITERIA).toArray()
    console.log('result  :', result)
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
    console.log(_id)
    CRITERIA = { participant: { "$in": [_id] } }
    let result = await db.collection(CHAT).find(CRITERIA).toArray()
    res.status(200)
    res.send(result)
  } catch (e) {
    res.status(500)
    res.send('Internal server error')
  }
})

// app.post('/chat/add', async (req, res) =>
//   postData(CHAT, req, res)
// )

// SERVER SIDE VALIDATOR
app.post('/chat/add', async (req, res) => {
  try {
    let { jobCreator, _userId } = req.body
    if (jobCreator == _userId) {
      console.log("job creator should not be the same as userid")
      throw ''
    }
    jobCreator = ObjectId(jobCreator)
    _userId = ObjectId(_userId)
    let participantCriteria = {
      'participant': {
        $all: [jobCreator, _userId]
      }
    }
    let result = await db.collection('chat').findOne(participantCriteria)
    if (result != null) throw [result['_id'].toString(), _userId]
    let timestamp = (new Date().getTime())
    let chatId = new ObjectId()
    await db.collection('chat').insertOne(
      {
        _id: chatId,
        participant: [jobCreator, _userId],
        timestamp
      }
    )
    console.log("Just added new chatID")
    let cache_1 = new ObjectId()
    let cache_2 = new ObjectId()
    console.log('cache 1:', cache_1, 'cache 2:', cache_2, '\nchatId: ', chatId)
    let person1 = await db.collection('person').findOne(jobCreator)
    let person2 = await db.collection('person').findOne(_userId)
    let message = [`Greetings, my name is ${person2.firstName} ${person2.lastName} and I'm interested in the Job Posting.
      I am currently based at ${person2.country}`, `My contact details are `, `Contact number : ${person2.countryCode} ${person2.contactNumber}    Email address : ${person2.email} `, `I am currently${person2.jobAvailability ? '' : ' not'} available for the job`]
    let writeCache1 = {
      _id: cache_1,
      chatId,
      from: jobCreator,
      to: _userId,
      lastMessage: `I am currently${person2.jobAvailability ? '' : ' not'} available for the job`,
      unreadCount: Number(0),
      timestamp,
      imageUrl: person1['imageUrl'],
      firstName: person1['firstName'],
      lastName: person1['lastName']
    }
    let writeCache2 = {
      _id: cache_2,
      chatId,
      from: _userId,
      to: jobCreator,
      lastMessage: `I am currently${person2.jobAvailability ? '' : ' not'} available for the job`,
      unreadCount: Number(4),
      timestamp,
      imageUrl: person2['imageUrl'],
      firstName: person2['firstName'],
      lastName: person2['lastName']
    }
    await db.collection('messageCache').insertMany([writeCache1, writeCache2])


    let writeData = {
      chatId,
      timestamp,
      message,
      from: ObjectId(_userId)
    }
    console.log('writeData :', writeData)
    db.collection('message').insertOne(writeData)
    res.status(200)
    res.send(chatId)
  } catch (err) {
    try {
      // err[0] = chatId, err[1] = _userId
      let chatId = err[0]
      let _userId = err[1]
      console.log('err :', typeof (err), err)
      console.log('_userId: ', err[0])
      console.log('chatId : ', err[1])
      let timestamp = (new Date().getTime())
      let person2 = await db.collection('person').findOne({ _id: ObjectId(_userId) })
      let message = [`Greetings, my name is ${person2.firstName} ${person2.lastName} and I'm interested in the Job Posting.
      I am currently based at ${person2.country}`, `My contact details are `, `Contact number : ${person2.countryCode} ${person2.contactNumber}    Email address : ${person2.email} `, `I am currently${person2.jobAvailability ? '' : ' not'} available for the job`]
      let writeData = {
        chatId: ObjectId(chatId),
        timestamp,
        message,
        from: ObjectId(_userId)
      }
      console.log('writeData :', writeData)
      db.collection('message').insertOne(writeData)
    } catch (e) {
      // res.status(500)
      // res.send(err[0])
    }
    res.status(500)
    res.send(err[0])
  }

})

// db.chat.findOne({
//   participant:{
//     $all: [ObjectId('624ed316bed37d50765b291c'), ObjectId("624d1b9455469b89e419d590")]
//   }
// })

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
    }).sort({ timestamp: -1 }).toArray()

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

app.post('/message/criteria', async (req, res) => {
  try {
    let chatId = ObjectId(req.body['chatId'])
    let result = await db.collection('message').find({chatId})
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
    console.log(lastMessage)
    db.collection('message').insertOne(writeMessage)
    db.collection('messageCache').updateMany({ chatId }, { $set: { lastMessage } })
    db.collection('messageCache').updateOne({ chatId, from }, { $inc: { unreadCount: 1 } })

    res.status(200)
    res.send(`Message was sent`)
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

