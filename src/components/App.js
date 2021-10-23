import { onAuthStateChanged } from "@firebase/auth";
import React, { useCallback, useEffect, useState } from "react";
import { auth, db } from "../myFirebase";
import AppRouter from "./AppRouter";
import Loading from "./Loading";
import "../css/App.scss";
import {
  // addDoc,
  // collection,
  doc,
  getDoc,
  // getDocs,
  // query,
  setDoc,
  // where,
} from "@firebase/firestore";
import { UserContext } from "../contexts/Context";
import SendNotification from "./SendNotification";
// import NotFound from "../pages/NotFound";
// import Login from "../pages/Login";

const Error = (error) => {
  console.log("from App.js");
  console.log(error);
};

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(
    JSON.parse(localStorage.getItem("currentUser"))
  );
  // const [isWaitingUser, setIsWaitingUser] = useState(false);
  const fetchUserData = useCallback(async (user) => {
    const userDocRef = doc(db, "userlist", user.uid);
    await getDoc(userDocRef)
      .then(async (docSnap) => {
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
          const waitDocRef = doc(db, "waitinglist", user.uid);
          await getDoc(waitDocRef)
            .then(async (docSnap) => {
              if (docSnap.exists() && docSnap.data().isGranted === false) {
                // 해당 user는 회원가입 승인을 기다리는 중
                alert(
                  "관리자의 가입 승인을 기다리는 중입니다. 관리자 승인 이후 서비스를 정상적으로 이용하실 수 있습니다."
                );
                auth.signOut();
              } else {
                // 해당 user는 회원가입 신청을 처음 하는 것!
                await setDoc(waitDocRef, {
                  isGranted: false,
                })
                  .then(() => {
                    SendNotification({
                      receiverUid: "dxiH3BGEonbTQctCYC8L5OZoO5m1",
                      type: "SIGNUP_REQUEST",
                      checked: false,
                      createdAt: new Date().getTime(),
                      data: {
                        uid: user.uid,
                        email: user.email,
                        userName: user.displayName,
                        position: "사원",
                        profileImageURL: user.photoURL,
                        isAdmin: false,
                        isWorking: false,
                        lastLoginAt: new Date().getTime(),
                      },
                    });
                    alert(
                      "가입이 정상적으로 신청되었습니다. 관리자 승인 이후 서비스를 정상적으로 이용하실 수 있습니다."
                    );
                  })
                  .catch(Error);
              }
            })
            .catch(Error);

          // const waitCollection = collection(db, "waitinglist");
          // const q = query(waitCollection, where("uid", "==", user.uid));
          // await getDocs(q)
          //   .then(async (querySnap) => {
          //     if (querySnap.docs.length === 0) {
          //       // sign-up request of new user
          //       const waitDocRef = doc(waitCollection);
          //       await setDoc(waitDocRef, {
          //         uid: user.uid,
          //         email: user.email,
          //         profileImageURL: user.photoURL,
          //         userName: user.displayName,
          //       })
          //         .then(() => {
          //           SendNotification({
          //             type: "SIGNUP_REQUEST",
          //             checked: false,
          //             createdAt: new Date().getTime(),
          //           });
          //           alert(
          //             "가입이 정상적으로 신청되었습니다. 관리자 승인 이후 서비스를 정상적으로 이용하실 수 있습니다."
          //           );
          //         })
          //         .catch(Error);
          //     } else {
          //       // user already requested
          //       alert(
          //         "관리자의 가입 승인을 기다리는 중입니다. 관리자 승인 이후 서비스를 정상적으로 이용하실 수 있습니다."
          //       );
          //     }
          //     auth.signOut();
          //   })
          //   .catch(Error);

          // await getDoc(waitingDocRef)
          //   .then((docSnap) => {
          //     if (docSnap.exists()) {
          //       // this user is in waiting-list
          //       alert(
          //         "관리자의 가입 승인을 기다리는 중입니다. 관리자 승인 이후 서비스를 정상적으로 이용하실 수 있습니다."
          //       );
          //     } else {
          //       setDoc(waitingDocRef, {
          //         uid: user.uid,
          //         email: user.email,
          //         profileImageURL: user.photoURL,
          //         userName: user.displayName,
          //       });
          //       SendNotification(
          //         user.uid,
          //         "dxiH3BGEonbTQctCYC8L5OZoO5m1",
          //         "",
          //         "SIGNUP_REQUEST"
          //       );
          //       alert(
          //         "가입 신청이 완료되었습니다. 관리자가 승인하면 서비스를 정상적으로 이용하실 수 있습니다."
          //       );
          //     }
          //     setIsWaitingUser(true);
          //   })
          //   .catch(Error);
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
      .catch(Error);
  }, []);

  useEffect(() => {
    // component did mount
    onAuthStateChanged(auth, (user) => {
      // console.log(user);
      if (user) {
        fetchUserData(user);
        // if (isWaitingUser) auth.signOut();
      } else {
        setUserData(null);
        // setIsWaitingUser(false);
        localStorage.removeItem("currentUser");
      }
      setIsLoading(false);
    });
    return () => {
      setUserData(null);
      setIsLoading(true);
    };
  }, [
    fetchUserData,
    // isWaitingUser
  ]);

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
