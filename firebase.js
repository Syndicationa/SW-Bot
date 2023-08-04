const admin = require('firebase-admin');
const serviceAccount = require("./firebaseKey.json");


const firebaseConfig = {
  credential: admin.credential.cert(serviceAccount)
}

admin.initializeApp(firebaseConfig);

// Initialize Firebase
const db = admin.firestore();

module.exports = {db};