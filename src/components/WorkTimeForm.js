import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  // setDoc, updateDoc
} from "@firebase/firestore";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { UserContext } from "../contexts/Context";
import { db } from "../myFirebase";
import moment from "moment";
import getWeekNumber from "./getWeekNumber";

import "../css/WorkTimeForm.scss";

const Error = (error) => {
  console.log("from WorkTimeForm.js");
  console.log(error);
};

const WorkTimeForm = () => {
  const userData = useContext(UserContext);
  const todayString = moment().format("YYYY-MM-DD");
  // e.g. "2021-09-01"
  const [workTime, setWorkTime] = useState(0);
  const [weekWorkTime, setWeekWorkTime] = useState(0);
  // workTime: work time in ms
  const [isWorking, setIsWorking] = useState(false);

  let now = new Date().getTime();
  const [lastStartedAt, setLastStartedAt] = useState(now);
  const [lastFinishedAt, setLastFinishedAt] = useState(now);

  // const [isFolded, setIsFolded] = useState(false);
  const [isFetched, setIsFetched] = useState(false);

  const fetchData = useCallback(async () => {
    const userRef = doc(db, "userlist", userData.uid);
    const dayRef = doc(db, `userlist/${userData.uid}/daily`, todayString);
    const weekRef = doc(
      db,
      `userlist/${userData.uid}/weekly`,
      `week${getWeekNumber(new Date())}`
    );

    await getDoc(userRef)
      .then((docSnap) => {
        if (docSnap.exists()) setIsWorking(docSnap.data().isWorking);
      })
      .catch(Error);
    await getDoc(dayRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setWorkTime(data.workTime);
          setLastStartedAt(data.lastStartedAt);
          setLastFinishedAt(data.lastFinishedAt);
        }
      })
      .catch(Error);
    await getDoc(weekRef)
      .then((docSnap) => {
        if (docSnap.exists()) setWorkTime(docSnap.data().workTime);
      })
      .catch(Error);
    setIsFetched(true);
    // try {
    //   const userDocRef = doc(db, "userlist", userData.uid);
    //   const dayDocRef = doc(db, userData.uid, todayString);
    //   const weekDocRef = doc(
    //     db,
    //     userData.uid,
    //     `week${getWeekNumber(new Date())}`
    //   );
    //   const userDocSnap = await getDoc(userDocRef);
    //   const dayDocSnap = await getDoc(dayDocRef);
    //   const weekDocSnap = await getDoc(weekDocRef);
    //   // userlist collection의 해당 유저 정보를 읽는다.
    //   if (userDocSnap.exists()) {
    //     setIsWorking(userDocSnap.data().isWorking);
    //   }

    //   if (dayDocSnap.exists()) {
    //     const data = dayDocSnap.data();
    //     setWorkTime(data.workTime);
    //     setLastStartedAt(data.lastStartedAt);
    //     setLastFinishedAt(data.lastFinishedAt);
    //   }
    //   if (weekDocSnap.exists()) {
    //     const data = weekDocSnap.data();
    //     setWeekWorkTime(data.weekWorkTime);
    //   }
    //   setIsFetched(true);
    // } catch (error) {
    //   console.log("from WorkTimeForm.js");
    //   console.log(error);
    // }
  }, [userData.uid, todayString]);

  const updateData = useCallback(async () => {
    const userRef = doc(db, "userlist", userData.uid);
    const dayRef = doc(db, `userlist/${userData.uid}/daily`, todayString);
    const weekRef = doc(
      db,
      `userlist/${userData.uid}/weekly`,
      `week${getWeekNumber(new Date())}`
    );

    await getDoc(userRef)
      .then((docSnap) => {
        if (docSnap.exists())
          updateDoc(userRef, {
            isWorking,
          });
        else
          setDoc(userRef, {
            isWorking,
          });
      })
      .catch(Error);
    await getDoc(dayRef)
      .then((docSnap) => {
        if (docSnap.exists())
          updateDoc(dayRef, {
            workTime,
            lastStartedAt,
            lastFinishedAt,
          });
        else
          setDoc(dayRef, {
            workTime,
            lastStartedAt,
            lastFinishedAt,
          });
      })
      .catch(Error);
    await getDoc(weekRef)
      .then((docSnap) => {
        if (docSnap.exists())
          updateDoc(weekRef, {
            workTime,
          });
        else
          setDoc(weekRef, {
            workTime,
          });
      })
      .catch(Error);
    // try {
    //   const userDocRef = doc(db, "userlist", userData.uid);
    //   const dayDocRef = doc(db, userData.uid, todayString);
    //   const weekDocRef = doc(
    //     db,
    //     userData.uid,
    //     `week${getWeekNumber(new Date())}`
    //   );
    //   const userDocSnap = await getDoc(userDocRef);
    //   const dayDocSnap = await getDoc(dayDocRef);
    //   const weekDocSnap = await getDoc(weekDocRef);
    //   if (userDocSnap.exists()) {
    //     updateDoc(userDocRef, {
    //       isWorking,
    //     });
    //   } else {
    //     setDoc(userDocRef, {
    //       isWorking,
    //     });
    //   }
    //   if (dayDocSnap.exists()) {
    //     updateDoc(dayDocRef, {
    //       workTime,
    //       lastStartedAt,
    //       lastFinishedAt,
    //     });
    //   } else {
    //     setDoc(dayDocRef, {
    //       workTime,
    //       lastStartedAt,
    //       lastFinishedAt,
    //     });
    //   }
    //   if (weekDocSnap.exists()) {
    //     updateDoc(weekDocRef, {
    //       weekWorkTime,
    //     });
    //   } else {
    //     setDoc(weekDocRef, {
    //       weekWorkTime,
    //     });
    //   }
    // } catch (error) {
    //   console.log("from WorkTimeForm.js");
    //   console.log(error);
    // }
  }, [
    userData.uid,
    todayString,
    workTime,
    isWorking,
    lastStartedAt,
    lastFinishedAt,
  ]);

  useEffect(() => {
    // component did mount
    fetchData();
    return () => {
      setWorkTime(0);
      setWeekWorkTime(0);
      setIsWorking(false);
      setIsFetched(false);
    };
  }, [fetchData]);

  useEffect(() => {
    // component did update
    if (isFetched) {
      updateData();
    }
  }, [updateData, isFetched]);

  const onTimeBtnClick = () => {
    if (isWorking) {
      now = new Date().getTime();
      setLastFinishedAt(now);
      setWorkTime(workTime + now - lastStartedAt);
      setWeekWorkTime(weekWorkTime + now - lastStartedAt);
    } else {
      setLastStartedAt(new Date().getTime());
    }
    setIsWorking(!isWorking);
  };

  // const onFoldClick = () => {
  //   setIsFolded(!isFolded);
  // };

  const btnClassNames = `work-time--btn${isWorking ? " working" : ""}`;

  return (
    // <div className="work-time-form--container">
    //   <button id="fold" onClick={onFoldClick}>
    //     <i className="material-icons">{isFolded ? "summarize" : "remove"}</i>
    //   </button>
    //   {!isFolded && (
    //     <div className="work-time-form--display">
    //       <span>{dateFormat(new Date(), "yyyy년 mm월 dd일 ddd요일")}</span>
    //       <span>{WorkTimeString(workTime)} </span>
    //       <button className="work-time--btn" onClick={onTimeBtnClick}>
    //         {isWorking ? "finish" : "start"}
    //       </button>
    //     </div>
    //   )}
    // </div>
    <div className="work-time--container">
      <button className={btnClassNames} onClick={onTimeBtnClick}>
        {isWorking ? "finish" : "start"}
      </button>
    </div>
  );
};

export default WorkTimeForm;
