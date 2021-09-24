import { doc, getDoc, setDoc, updateDoc } from "@firebase/firestore";
import React, { useEffect, useState } from "react";
import { db } from "../myFirebase";

const WorkTimeForm = ({ userData }) => {
  const dateFormat = require("dateformat");
  const todayString = dateFormat(new Date(), "yyyy-mm-dd");
  // e.g. 2021-09-01
  const [workTime, setWorkTime] = useState(0);
  // workTime: work time in ms
  const [isWorking, setIsWorking] = useState(false);
  const [startTime, setStartTime] = useState(0);

  useEffect(() => {
    // component did mount
    const fetchData = async () => {
      try {
        const docRef = doc(db, userData.uid, todayString);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setWorkTime(data.workTime);
          setIsWorking(data.isWorking);
        }
      } catch (error) {
        console.log(error);
      }
    };
    fetchData();
  }, [todayString, userData.uid]);

  useEffect(() => {
    // component did update
    const updateData = async () => {
      try {
        const docRef = doc(db, userData.uid, todayString);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          updateDoc(docRef, {
            workTime,
            isWorking,
          });
        } else {
          setDoc(docRef, {
            workTime,
            isWorking,
          });
        }
      } catch (error) {
        console.log(error);
      }
    };
    updateData();
  }, [todayString, userData.uid, workTime, isWorking]);

  const onClick = () => {
    if (isWorking) {
      setWorkTime(workTime + new Date().getTime() - startTime);
    } else {
      setStartTime(new Date().getTime());
    }
    setIsWorking(!isWorking);
  };

  return (
    <>
      <span>Today's worktime: {workTime} </span>
      <button onClick={onClick}>{isWorking ? "finish" : "start"}</button>
    </>
  );
};

export default WorkTimeForm;
