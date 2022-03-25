const express = require("express");

require("dotenv").config();
const cors = require("cors");
const ObjectId = require("mongodb").ObjectId;
const Mongo_Util = require("./MongoUtil");

let app = express();
app.use(cors());
app.use(express.json());



let db;
((async () => {
  db = await Mongo_Util.connect(
    process.env.MONGO_URI,
    process.env.DATABASE
  )
}))()
// SETUP END




// Variable USED
const PERSON = "person"
const FRIEND = "friend";




// Test
app.get("/", async (req, res) => {
  res.json({ result: `Port ${process.env.PORT} is live` });
});

// Get person INFO
app.get("/person/:personID", async (req, res) => {
  try {
    _id = ObjectId(req.params['personID'])
    criteria = { _id }
    let result = await db.collection(PERSON).find(criteria, {}).toArray()
    res.status(200)
    res.send(result)
  }
  catch (e) {
    res.status(500)
    res.send("Internal server error")
  }

});

// Register user
app.post("/register", async (req, res) => { // You cannot use query in post
  try {
    data = await req.body
    data = data['data']
    db.collection("person").insertOne({data})

    res.status(200)
    res.send("Added successfully")
  } catch (e) {

    res.status(500)
    res.send("Internal server error")
  }
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

Search engine
Use regex in get request 
*/



// START SERVER
app.listen(process.env.PORT, () => {
  console.log(`${process.env.PORT} has just started`);
});
