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

// import "../css/WorkIndicator.scss";
import { Paper, Typography } from "@mui/material";

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
  const color = isWorking ? "rgb(96, 207, 23)" : "#9c1919";

  return (
    <Paper
      sx={{
        width: 80,
        height: 25,
        mr: 1,
        padding: 0.5,
        backgroundColor: color,
        boxShadow: `rgb(${color}, 0.99) 0px 3px 8px`,
      }}
    >
      <Typography
        variant="body"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          color: "#fff",
          textTransform: "uppercase",
          fontWeight: 700,
        }}
      >
        {isWorking ? "Working" : "Offline"}
      </Typography>
    </Paper>
  );
};

export default WorkIndicator;
