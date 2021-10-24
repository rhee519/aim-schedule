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
import "../css/NotificationContainer.scss";

const Error = (error) => {
  console.log("from NotificationContainer.js");
  console.log(error);
};

const NotificationContainer = ({ reference }) => {
  const userData = useContext(UserContext);
  const [notes, setNotes] = useState([]);
  const [adminNotes, setAdminNotes] = useState([]);

  const fetchNotifications = useCallback(async () => {
    const notificationCollection = collection(
      db,
      `userlist/${userData.uid}/notification`
    );
    await getDocs(notificationCollection)
      .then((querySnap) => {
        const newNotes = [];
        querySnap.forEach((doc) => {
          newNotes.push({
            ...doc.data(),
            id: doc.id,
          });
        });
        setNotes(newNotes);
      })
      .catch(Error);
  }, [userData.uid]);

  const fetchAdminNotifications = useCallback(async () => {
    const adminCollection = collection(db, "admin-notification");
    await getDocs(adminCollection)
      .then((querySnap) => {
        const newNotes = [];
        querySnap.forEach((doc) => {
          newNotes.push({
            ...doc.data(),
            id: doc.id,
          });
        });
        setAdminNotes(newNotes);
      })
      .catch(Error);
  }, []);

  useEffect(() => {
    fetchNotifications();
    if (userData.isAdmin) fetchAdminNotifications();

    // 일반 알림 구독
    const unsub = onSnapshot(
      collection(db, `userlist/${userData.uid}/notification`),
      () => {
        fetchNotifications();
      }
    );

    // 관리자 알림 구독
    const unsubAdmin = userData.isAdmin
      ? onSnapshot(collection(db, "admin-notification"), () => {
          fetchAdminNotifications();
        })
      : () => {};
    return () => {
      setNotes([]);
      setAdminNotes([]);
      unsub();
      unsubAdmin();
    };
  }, [
    fetchNotifications,
    fetchAdminNotifications,
    userData.uid,
    userData.isAdmin,
  ]);

  return (
    <div className="notification--container" ref={reference}>
      {userData.isAdmin ? (
        adminNotes.length > 0 ? (
          adminNotes.map((note, index) => (
            <Notification
              key={index}
              type={note.type}
              data={note.data}
              checked={note.checked}
              createdAt={note.createdAt}
              id={note.id}
              admin={true}
            />
          ))
        ) : (
          <h2>새로운 관리자 알림이 없습니다.</h2>
        )
      ) : (
        // not admin
        <></>
      )}
      {notes.length > 0 ? (
        notes.map((note, index) => (
          <Notification
            key={index}
            type={note.type}
            data={note.data}
            checked={note.checked}
            createdAt={note.createdAt}
            id={note.id}
            admin={false}
          />
        ))
      ) : (
        <h2>새로운 알림이 없습니다.</h2>
      )}
    </div>
  );
};

export default NotificationContainer;
