import { onAuthStateChanged } from "@firebase/auth";
import React, { useCallback, useEffect, useState } from "react";
import { auth, db } from "../myFirebase";
import AppRouter from "./AppRouter";
import Loading from "./Loading";
import "./App.scss";
import { doc, getDoc, setDoc } from "@firebase/firestore";
import { UserContext } from "../contexts/Context";
import SendNotification from "./SendNotification";
// import NotFound from "../pages/NotFound";
// import Login from "../pages/Login";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(
    JSON.parse(localStorage.getItem("currentUser"))
  );
  const fetchUserData = useCallback(async (user) => {
    const userDocRef = doc(db, "userlist", user.uid);
    await getDoc(userDocRef)
      .then((docSnap) => {
        let processedUserData;
        if (docSnap.exists()) {
          // user already exists
          processedUserData = docSnap.data();
          setUserData(processedUserData);
          localStorage.setItem(
            "currentUser",
            JSON.stringify(processedUserData)
          );
        } else {
          // user doesn't exist
          // add this user to waiting-list
          const waitingDocRef = doc(db, "waitinglist", user.uid);
          getDoc(waitingDocRef)
            .then((docSnap) => {
              if (docSnap.exists()) {
                // this user is in waiting-list
                alert(
                  "관리자의 가입 승인을 기다리는 중입니다. 관리자 승인 이후 서비스를 정상적으로 이용하실 수 있습니다."
                );
              } else {
                setDoc(waitingDocRef, {
                  uid: user.uid,
                  email: user.email,
                  profileImageURL: user.photoURL,
                  userName: user.displayName,
                });
                SendNotification(
                  user.uid,
                  "dxiH3BGEonbTQctCYC8L5OZoO5m1",
                  "",
                  "SIGNUP_REQUEST"
                );
                alert(
                  "가입 신청이 완료되었습니다. 관리자가 승인하면 서비스를 정상적으로 이용하실 수 있습니다."
                );
              }
            })
            .catch((error) => {
              console.log("from App.js");
              console.log(error);
            });
          auth.signOut();
          // processedUserData = {
          //   uid: user.uid,
          //   email: user.email,
          //   userName: user.displayName,
          //   isAdmin: false,
          //   isWorking: false,
          //   profileImageURL: user.photoURL,
          //   lastLoginAt: new Date().getTime(),
          //   position: "사원",
          //   isGranted: false,
          // };
          // setDoc(userDocRef, processedUserData);
        }
      })
      .catch((error) => {
        console.log("from App.js");
        console.log(error);
      });
  }, []);

  useEffect(() => {
    // component did mount
    onAuthStateChanged(auth, (user) => {
      // console.log(user);
      if (user) {
        fetchUserData(user);
      } else {
        setUserData(null);
        localStorage.removeItem("currentUser");
      }
      setIsLoading(false);
    });
    return () => {
      setUserData(null);
      setIsLoading(true);
    };
  }, [fetchUserData]);

  return (
    <UserContext.Provider value={userData}>
      <div className="app-container">
        {isLoading ? <Loading /> : <AppRouter />}
        {/* <AppRouter /> */}
      </div>
    </UserContext.Provider>
  );
}

export default App;
