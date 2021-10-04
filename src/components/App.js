import { onAuthStateChanged } from "@firebase/auth";
import React, { useCallback, useEffect, useState } from "react";
import { auth, db } from "../myFirebase";
import AppRouter from "./AppRouter";
import Loading from "./Loading";
import "./App.css";
import { doc, getDoc, setDoc } from "@firebase/firestore";
// import NotFound from "../pages/NotFound";
// import Login from "../pages/Login";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(undefined);
  const [isAdmin, setIsAdmin] = useState(false);

  const enrollUser = useCallback(async (user) => {
    const userListDocRef = doc(db, "userlist", user.uid);
    await getDoc(userListDocRef).then((docSnap) => {
      if (!docSnap.exists()) {
        // 해당 사용자는 처음 로그인한 것!
        setDoc(userListDocRef, {
          email: user.email,
          userName: user.displayName,
          isAdmin: false,
          isWorking: false,
          profileImageURL: user.photoURL,
          lastLoginAt: new Date().getTime(),
          position: "사원",
        });
      } else {
        setIsAdmin(docSnap.data().isAdmin);
      }
    });
  }, []);

  useEffect(() => {
    // component did mount
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserData(user);
        enrollUser(user);
      } else {
        setUserData(undefined);
      }
      setIsLoading(false);
    });
  }, [enrollUser]);
  return (
    <div className="app-container">
      {isLoading ? (
        <Loading />
      ) : (
        <AppRouter userData={userData} isAdmin={isAdmin} />
      )}
      {/* {isLoading ? <Loading /> : <Login userData={userData} />} */}
    </div>
  );
}

export default App;
