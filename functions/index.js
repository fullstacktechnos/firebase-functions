const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

const ref = admin.database().ref();

//http trigger
const express = require('express');
const cookieParser = require('cookie-parser')();
const cors = require('cors')({ origin: true });
const app = express();

const validateFirebaseIdToken = (req, res, next) => {
  console.log('Check if request is authorized with Firebase ID token');

  if ((!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
    !req.cookies.__session) {
    console.error('No Firebase ID token was passed as a Bearer token');
    res.status(403).send('Unauthorized');
    return;
  }

  let idToken;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    console.log('Found "Authorization" header');
    // Read the ID Token from the Authorization header.
    idToken = req.headers.authorization.split('Bearer ')[1];
  } else {
    console.log('Found "__session" cookie');
    // Read the ID Token from cookie.
    idToken = req.cookies.__session;
  }

  admin.auth().verifyIdToken(idToken).then(decodedIdToken => {
    console.log('ID Token correctly decoded', decodedIdToken);
    req.user = decodedIdToken;
    next();
  }).catch(error => {
    console.error('Error while verifying Firebase ID token:', error);
    res.status(403).send('Unauthorized');
  });
};

app.use(cors);
app.use(cookieParser);
app.use(validateFirebaseIdToken);

app.post('/writemsg', (req, res) => {
  if (req.body.message === undefined) {
    res.status(400).send('No message defined!');
  } else {
    console.log('input data :: ' + req.body.message);
    //Insert to message
    admin.database().ref('messages').push({
      type: 'Rest',
      description: req.body.message
    })
    .then(() => res.status(200).send('Msg updated Successfully'))
    .catch( error => res.status(401).send('Not able to update the msg'))
  }
});

exports.app = functions.https.onRequest(app);

//auth trigger
exports.createUserAccount = functions.auth.user().onCreate(event => {
  const uid = event.data.uid;
  const email = event.data.email;
  const photoUrl = event.data.photoUrl || 'http://lorempixel.com/400/200/';
  const newUserRef = ref.child(`/users/${uid}`);

  return newUserRef.set({
    photoUrl: photoUrl,
    email: email
  })

})
exports.cleanupUserData = functions.auth.user().onDelete(event => {
  const uid = event.data.uid;
  const userRef = ref.child(`/users/${uid}`);

  return userRef.update({ isDeleted: true });

})

//db trigger
function sanitize(msgDescription) {
  var sanitisedContent = msgDescription;
  sanitisedContent = sanitisedContent.replace(/\bstupid\b/ig, "wonderful");
  return sanitisedContent;
}
exports.sanitizeMessage = functions.database.ref('/messages/{mid}').onWrite(event => {
  const msg = event.data.val();

  //prevent calling same trigger again.
  if (msg.sanitized) {
    return;
  }
  console.log("Sanitizing new message : " + event.params.mid);
  console.log(msg);
  msg.sanitized = true;

  msg.description = sanitize(msg.description);
  return event.data.ref.set(msg);
})

