import { onAuthStateChanged } from "@firebase/auth";
import React, { useCallback, useEffect, useState } from "react";
import { auth, db } from "../myFirebase";
import AppRouter from "./AppRouter";
import Loading from "./Loading";
import { doc, getDoc, setDoc } from "@firebase/firestore";
import { UserContext } from "../contexts/Context";
import { SendAdminNotification } from "./Notification";
import { Box } from "@mui/material";

const Error = (error) => {
  console.log("from App.js");
  console.log(error);
};

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(
    JSON.parse(localStorage.getItem("currentUser"))
  );
  const fetchUserData = useCallback(async (user) => {
    if (!user) {
      setIsLoading(false);
      return;
    }
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
              } else {
                // 해당 user는 회원가입 신청을 처음 하는 것!
                await setDoc(waitDocRef, {
                  isGranted: false,
                })
                  .then(() => {
                    SendAdminNotification({
                      // receiverUid: "dxiH3BGEonbTQctCYC8L5OZoO5m1",
                      type: "SIGNUP_REQUEST",
                      data: {
                        uid: user.uid,
                        email: user.email,
                        userName: user.displayName,
                        position: "사원",
                        profileImageURL: user.photoURL,
                        isAdmin: false,
                        isWorking: false,
                        lastLoginAt: new Date().getTime(),
                        lastLogoutAt: new Date().getTime(),
                      },
                    });
                    alert(
                      "가입이 정상적으로 신청되었습니다. 관리자 승인 이후 서비스를 정상적으로 이용하실 수 있습니다."
                    );
                  })
                  .catch(Error);
              }
            })
            .then(() => auth.signOut())
            .catch(Error);
        }
      })
      .then(() => {
        setIsLoading(false);
      })
      .catch(Error);
  }, []);

  useEffect(() => {
    // component did mount
    onAuthStateChanged(auth, (user) => {
      // console.log(user);
      fetchUserData(user);
      if (user) {
        // if (isWaitingUser) auth.signOut();
      } else {
        setUserData(null);
        // setIsWaitingUser(false);
        localStorage.removeItem("currentUser");
      }
      // setIsLoading(false);
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
      <Box position="relative">
        {isLoading ? <Loading /> : <AppRouter />}
        {/* <AppRouter /> */}
      </Box>
    </UserContext.Provider>
  );
}

export default App;
