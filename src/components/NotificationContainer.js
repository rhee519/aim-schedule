import {
  collection,
  getDocs,
  onSnapshot,
  // doc,
  // getDoc,
  // setDoc, updateDoc
} from "@firebase/firestore";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { UserContext } from "../contexts/Context";
import { db } from "../myFirebase";
import Notification from "./Notification";
import "./NotificationContainer.scss";

const NotificationContainer = ({ reference }) => {
  const userData = useContext(UserContext);
  const [notes, setNotes] = useState([]);

  const fetchNotifications = useCallback(async () => {
    const notificationCollection = collection(
      db,
      `userlist/${userData.uid}/notification`
    );
    const newNotes = [];
    await getDocs(notificationCollection)
      .then((querySnap) => {
        querySnap.forEach((doc) => newNotes.push(doc.data()));
        setNotes(newNotes);
      })
      .catch((error) => {
        console.log("from NotificationContainer.js");
        console.log(error);
      });
  }, [userData.uid]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, `userlist/${userData.uid}/notification`),
      (querySnapshot) => {
        fetchNotifications();
      }
    );
    return () => {
      setNotes([]);
      unsub();
    };
  }, [fetchNotifications, userData.uid]);
  return (
    <div className="notification--container" ref={reference}>
      {notes.length > 0 ? (
        notes.map((note, index) => (
          <Notification
            key={index}
            type={note.type}
            content={note.content}
            senderUid={note.senderUid}
            createdAt={note.createdAt}
          ></Notification>
        ))
      ) : (
        <h2>새로운 알림이 없습니다.</h2>
      )}
    </div>
  );
};

export default NotificationContainer;
