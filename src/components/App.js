import { onAuthStateChanged } from "@firebase/auth";
import React, { useCallback, useEffect, useState } from "react";
import { auth, db } from "../myFirebase";
import AppRouter from "./AppRouter";
import Loading from "./Loading";
import { doc, getDoc, setDoc, updateDoc } from "@firebase/firestore";
import {
  CalendarContext,
  CalendarHandler,
  UserContext,
  UserHandler,
} from "../contexts/Context";
import { Box, ThemeProvider } from "@mui/material";
import {
  fetchCalendarEvents,
  holidayDocRef,
  initialUserData,
  userDocRef,
} from "../docFunctions";
import { QRreader } from "./QR";
import { LocalizationProvider } from "@mui/lab";
import AdapterMoment from "@mui/lab/AdapterMoment";
import { defaultTheme } from "../theme";

const axios = require("axios");
const port = 12345;

const Error = (error) => {
  console.log("from App.js");
  console.log(error);
};

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState();
  const [scanner, setScanner] = useState(false);
  const [calendar, setCalendar] = useState();

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

          // signout 시키지 않고 정상 로그인
          return false;
        } else {
          // 유저 정보가 존재하지 않음
          // waiting list에서 해당 유저를 찾아본다.
          const waitDocRef = doc(db, "waitinglist", user.uid);
          await getDoc(waitDocRef)
            .then(async (docSnap) => {
              if (docSnap.exists()) {
                // 해당 유저는 현재 회원가입 신청 목록에 올라와있는 상태
                const data = docSnap.data();
                if (data.status === "approved") {
                  // 관리자가 해당 유저의 회원가입을 승인했음
                  const newUserData = initialUserData(user);
                  const docRef = doc(db, "userlist", user.uid);
                  await setDoc(docRef, newUserData);
                  setUserData(newUserData);

                  // signout 시키지 않고 정상 로그인
                  return false;
                } else if (data.status === "pending") {
                  alert(
                    "관리자의 가입 승인을 기다리는 중입니다. 관리자 승인 이후 서비스를 정상적으로 이용하실 수 있습니다."
                  );
                } else if (data.status === "denied") {
                  alert(
                    "회원가입 승인이 거절되었습니다. 관리자에게 문의하시기 바랍니다."
                  );

                  // status === 'pending' 또는 'denied'이면
                  // signout시킨다.
                  return true;
                }
              } else {
                // 해당 유저는 회원가입 신청을 한 적이 없음
                // waiting list에 새로 등록
                await setDoc(waitDocRef, {
                  json: JSON.stringify({ ...user }),
                  status: "pending",
                }).then(() => {
                  alert(
                    "가입이 정상적으로 신청되었습니다. 관리자 승인 이후 서비스를 정상적으로 이용하실 수 있습니다."
                  );
                });

                // 아직 로그인할 수 없으므로 signout시킨다.
                return true;
              }
            })
            .then((signout) => {
              if (signout) {
                auth.signOut();
              }
            })
            .catch(Error);
        }
      })
      .catch(Error);
  }, []);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        if (user.uid === process.env.REACT_APP_QR_SCANNER_UID) {
          setScanner(true);
          setIsLoading(false);
        } else {
          fetchUserData(user)
            .then(() => {
              fetchCalendarEvents()
                .then((snapshot) => {
                  const cal = {};
                  snapshot.forEach((doc) => (cal[doc.id] = doc.data()));
                  setCalendar(cal);
                  return cal;
                })
                .then((calendar) => {
                  axios
                    .get(`http://localhost:${port}`)
                    .then((res) => {
                      const holiday = { ...calendar.holiday, ...res.data };
                      // console.log(calendar);
                      updateDoc(holidayDocRef, holiday);
                      setCalendar({ ...calendar, holiday });
                    })
                    .then(() => setIsLoading(false))
                    .catch((error) => setIsLoading(false));
                });
            })
            .then(() => {
              if (user)
                updateDoc(userDocRef(user.uid), {
                  profileImageURL: user.photoURL,
                  userName: user.displayName,
                  uid: user.uid,
                });
            });
        }
      } else {
        setUserData(null);
        setScanner(false);
        setIsLoading(false);
      }
    });
    return () => {
      setUserData(null);
      setIsLoading(true);
    };
  }, [fetchUserData]);

  return (
    <ThemeProvider theme={defaultTheme}>
      <UserContext.Provider value={userData}>
        <UserHandler.Provider value={setUserData}>
          <CalendarContext.Provider value={calendar}>
            <CalendarHandler.Provider value={setCalendar}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <Box position="relative">
                  {isLoading ? (
                    <Loading />
                  ) : scanner ? (
                    <QRreader />
                  ) : (
                    <AppRouter />
                  )}
                </Box>
              </LocalizationProvider>
            </CalendarHandler.Provider>
          </CalendarContext.Provider>
        </UserHandler.Provider>
      </UserContext.Provider>
    </ThemeProvider>
  );
}

export default App;
