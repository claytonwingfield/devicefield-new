// lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDZBmBQ3o_K05WeGhcqI0xv9RQo_zKhnrU",
  authDomain: "devicefield-web.firebaseapp.com",
  projectId: "devicefield-web",
  storageBucket: "devicefield-web.firebasestorage.app",
  messagingSenderId: "770120148073",
  appId: "1:770120148073:web:fe921cae2a3e188ccbeef8",
  measurementId: "G-Z7Q33C0BKJ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only on the client side
let analytics;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, analytics };
