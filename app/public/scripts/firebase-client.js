import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.9.4/firebase-app.js'
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/9.9.4/firebase-auth.js'


const firebaseConfig = {
    apiKey: "AIzaSyC1Qhzu5BG2ZWIEy0_XtN-b-1j057LUfC8",
    authDomain: "leadtechnique2022.firebaseapp.com",
    databaseURL: "https://leadtechnique2022-default-rtdb.firebaseio.com",
    projectId: "leadtechnique2022",
    storageBucket: "leadtechnique2022.appspot.com",
    messagingSenderId: "555327172157",
    appId: "1:555327172157:web:143d2e9ebe0117b8da0454"
};

let app = null;

let credential = null;
let token = null;
let user = null;

function initFirebase() {
    if (token) return;
    console.log('signin with firebase...')
    app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();

    signInWithPopup(auth, provider)
    .then((result) => {
        console.log('signed in successfully !');
        // This gives you a Google Access Token. You can use it to access the Google API.
        credential = GoogleAuthProvider.credentialFromResult(result);
        token = credential.accessToken;
        // The signed-in user info.
        user = result.user;
    }).catch((error) => {
        console.log('signin error :', error);
        const errorCode = error.code;
        const errorMessage = error.message;
        const email = error.customData.email;
        const credential = GoogleAuthProvider.credentialFromError(error);
        // ...
    });
}

function getFirebaseFilesAvailable() {

}

initFirebase();