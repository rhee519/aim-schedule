import { doc, getDoc, setDoc, updateDoc } from "@firebase/firestore";
import React, { useEffect, useState } from "react";
import { db } from "../myFirebase";
import getWeekNumber from "./getWeekNumber";
import WorkTimeString from "./WorkTimeString";

import "./WorkTimeForm.scss";

const WorkTimeForm = ({ userData }) => {
  const dateFormat = require("dateformat");
  dateFormat.i18n = {
    dayNames: [
      "일",
      "월",
      "화",
      "수",
      "목",
      "금",
      "토",
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
  };

  const todayString = dateFormat(new Date(), "yyyy-mm-dd");
  // e.g. "2021-09-01"
  const [workTime, setWorkTime] = useState(0);
  const [weekWorkTime, setWeekWorkTime] = useState(0);
  // workTime: work time in ms
  const [isWorking, setIsWorking] = useState(false);

  let now = new Date().getTime();
  const [lastStartedAt, setLastStartedAt] = useState(now);
  const [lastFinishedAt, setLastFinishedAt] = useState(now);

  const [isFolded, setIsFolded] = useState(false);

  useEffect(() => {
    // component did mount
    let isSubscribed = true;
    const fetchData = async () => {
      try {
        const dayDocRef = doc(db, userData.uid, todayString);
        const weekDocRef = doc(
          db,
          userData.uid,
          `week${getWeekNumber(new Date())}`
        );
        const dayDocSnap = await getDoc(dayDocRef);
        const weekDocSnap = await getDoc(weekDocRef);
        if (dayDocSnap.exists()) {
          const data = dayDocSnap.data();
          if (isSubscribed) {
            setWorkTime(data.workTime);
            setIsWorking(data.isWorking);
            setLastStartedAt(data.lastStartedAt);
            setLastFinishedAt(data.lastFinishedAt);
          }
        }
        if (weekDocSnap.exists()) {
          const data = weekDocSnap.data();
          setWeekWorkTime(data.weekWorkTime);
        }
      } catch (error) {
        console.log("from WorkTimeForm.js");
        console.log(error);
      }
    };
    fetchData();

    return () => (isSubscribed = false);
  }, [todayString, userData.uid]);

  useEffect(() => {
    // component did update
    let isSubscribed = true;
    const updateData = async () => {
      try {
        const dayDocRef = doc(db, userData.uid, todayString);
        const weekDocRef = doc(
          db,
          userData.uid,
          `week${getWeekNumber(new Date())}`
        );
        const dayDocSnap = await getDoc(dayDocRef);
        const weekDocSnap = await getDoc(weekDocRef);
        if (isSubscribed) {
          if (dayDocSnap.exists()) {
            updateDoc(dayDocRef, {
              workTime,
              isWorking,
              lastStartedAt,
              lastFinishedAt,
            });
          } else {
            setDoc(dayDocRef, {
              workTime,
              isWorking,
              lastStartedAt,
              lastFinishedAt,
            });
          }
          if (weekDocSnap.exists()) {
            updateDoc(weekDocRef, {
              weekWorkTime,
            });
          } else {
            setDoc(weekDocRef, {
              weekWorkTime,
            });
          }
        }
      } catch (error) {
        console.log("from WorkTimeForm.js");
        console.log(error);
      }
    };
    updateData();

    return () => (isSubscribed = false);
  }, [
    todayString,
    userData.uid,
    workTime,
    weekWorkTime,
    isWorking,
    lastStartedAt,
    lastFinishedAt,
  ]);

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

  const onFoldClick = () => {
    setIsFolded(!isFolded);
  };

  return (
    <div className="work-time-form--container">
      <button id="fold" onClick={onFoldClick}>
        {isFolded ? "+" : "-"}
      </button>
      {!isFolded && (
        <div className="work-time-form--display">
          <span>{dateFormat(new Date(), "yyyy년 mm월 dd일 ddd요일")}</span>
          <span>{WorkTimeString(workTime)} </span>
          <button onClick={onTimeBtnClick}>
            {isWorking ? "finish" : "start"}
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkTimeForm;
