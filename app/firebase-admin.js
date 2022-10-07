const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getDatabase  } = require('firebase-admin/database');

let firebaseApp = null;
let firebaseDatabase = null

function initFirebaseAdmin() {
    firebaseApp = initializeApp({
        credential: applicationDefault(),
        databaseURL: 'https://leadtechnique2022-default-rtdb.firebaseio.com/'
    });
}

function loadInDB(data, zipTime, fileName) {
    let firebaseDatabase = getDatabase(firebaseApp);
    const fileNameHash = fileName.hashCode()
    const path = '/killian/'+ fileNameHash;
    const ref = firebaseDatabase.ref(path);
    ref.set(data, (a) => {
        const result = a == null ? 'success' : 'error';
        console.log('loaded in firebase database to ' +  path + ' ?', result);
    });
}

module.exports = {
    initFirebaseAdmin, 
    loadInDB
}