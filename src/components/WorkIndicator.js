import {
  doc,
  getDoc,
  onSnapshot,
  // setDoc,
  // updateDoc,
  // setDoc, updateDoc
} from "@firebase/firestore";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { UserContext } from "../contexts/Context";
import { db } from "../myFirebase";
// import moment from "moment";
// import getWeekNumber from "./getWeekNumber";

import "../css/WorkIndicator.scss";

const Error = (error) => {
  console.log("from WorkIndicator.js");
  console.log(error);
};

const WorkIndicator = () => {
  const userData = useContext(UserContext);
  const [isWorking, setIsWorking] = useState(false);

  const fetchData = useCallback(async () => {
    const userRef = doc(db, "userlist", userData.uid);
    await getDoc(userRef)
      .then((userSnap) => {
        if (userSnap.exists()) {
          setIsWorking(userSnap.data().isWorking);
        }
      })
      .catch(Error);
  }, [userData.uid]);

  useEffect(() => {
    fetchData();
    const unsub = onSnapshot(doc(db, "userlist", userData.uid), (querySnap) => {
      fetchData();
    });

    return () => unsub();
  }, [fetchData, userData.uid]);
  // const todayString = moment().format("YYYY-MM-DD");
  // // e.g. "2021-09-01"
  // const [workTime, setWorkTime] = useState(0);
  // const [weekWorkTime, setWeekWorkTime] = useState(0);
  // // workTime: work time in ms
  // const [isWorking, setIsWorking] = useState(false);

  // let now = new Date().getTime();
  // const [lastStartedAt, setLastStartedAt] = useState(now);
  // const [lastFinishedAt, setLastFinishedAt] = useState(now);

  // // const [isFolded, setIsFolded] = useState(false);
  // const [isFetched, setIsFetched] = useState(false);

  // const fetchData = useCallback(async () => {
  //   // fetch isWorking
  //   const userRef = doc(db, "userlist", userData.uid);
  //   await getDoc(userRef)
  //     .then((docSnap) => {
  //       if (docSnap.exists()) setIsWorking(docSnap.data().isWorking);
  //     })
  //     .catch(Error);

  //   // fetch daily work info
  //   const dayRef = doc(db, `userlist/${userData.uid}/daily`, todayString);
  //   await getDoc(dayRef)
  //     .then((docSnap) => {
  //       if (docSnap.exists()) {
  //         const data = docSnap.data();
  //         setWorkTime(data.workTime);
  //         setLastStartedAt(data.lastStartedAt);
  //         setLastFinishedAt(data.lastFinishedAt);
  //       }
  //     })
  //     .catch(Error);

  //   // fetch weekly work info
  //   const weekRef = doc(
  //     db,
  //     `userlist/${userData.uid}/weekly`,
  //     `week${getWeekNumber(new Date())}`
  //   );
  //   await getDoc(weekRef)
  //     .then((docSnap) => {
  //       if (docSnap.exists()) setWorkTime(docSnap.data().workTime);
  //     })
  //     .catch(Error);
  //   setIsFetched(true);
  // }, [userData.uid, todayString]);

  // const updateData = useCallback(async () => {
  //   const userRef = doc(db, "userlist", userData.uid);
  //   const dayRef = doc(db, `userlist/${userData.uid}/daily`, todayString);
  //   const weekRef = doc(
  //     db,
  //     `userlist/${userData.uid}/weekly`,
  //     `week${getWeekNumber(new Date())}`
  //   );

  //   await getDoc(userRef)
  //     .then((docSnap) => {
  //       if (docSnap.exists())
  //         updateDoc(userRef, {
  //           isWorking,
  //         });
  //       else
  //         setDoc(userRef, {
  //           isWorking,
  //         });
  //     })
  //     .catch(Error);
  //   await getDoc(dayRef)
  //     .then((docSnap) => {
  //       if (docSnap.exists())
  //         updateDoc(dayRef, {
  //           workTime,
  //           lastStartedAt,
  //           lastFinishedAt,
  //         });
  //       else
  //         setDoc(dayRef, {
  //           workTime,
  //           lastStartedAt,
  //           lastFinishedAt,
  //         });
  //     })
  //     .catch(Error);
  //   await getDoc(weekRef)
  //     .then((docSnap) => {
  //       if (docSnap.exists())
  //         updateDoc(weekRef, {
  //           workTime,
  //         });
  //       else
  //         setDoc(weekRef, {
  //           workTime,
  //         });
  //     })
  //     .catch(Error);
  // }, [
  //   userData.uid,
  //   todayString,
  //   workTime,
  //   isWorking,
  //   lastStartedAt,
  //   lastFinishedAt,
  // ]);

  // useEffect(() => {
  //   // component did mount
  //   fetchData();
  //   return () => {
  //     setWorkTime(0);
  //     setWeekWorkTime(0);
  //     setIsWorking(false);
  //     setIsFetched(false);
  //   };
  // }, [fetchData]);

  // useEffect(() => {
  //   // component did update
  //   if (isFetched) {
  //     updateData();
  //   }
  // }, [updateData, isFetched]);

  // const onTimeBtnClick = () => {
  //   if (isWorking) {
  //     now = new Date().getTime();
  //     setLastFinishedAt(now);
  //     setWorkTime(workTime + now - lastStartedAt);
  //     setWeekWorkTime(weekWorkTime + now - lastStartedAt);
  //   } else {
  //     setLastStartedAt(new Date().getTime());
  //   }
  //   setIsWorking(!isWorking);
  // };

  const indClassNames = `work-indicator--box${
    isWorking ? " working" : " offline"
  }`;

  return (
    <div className="work-indicator--container">
      <div className={indClassNames}>{isWorking ? "Working" : "Offline"}</div>
    </div>
  );
};

// const updateWorkTime = (workTime) => {};

export default WorkIndicator;
