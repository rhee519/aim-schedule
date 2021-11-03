import {
  collection,
  getDocs,
  onSnapshot,
  // doc,
  // getDoc,
  // setDoc, updateDoc
} from "@firebase/firestore";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { Menu, IconButton, Badge } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { UserContext } from "../contexts/Context";
import { db } from "../myFirebase";
import Notification from "./Notification";
import "../css/NotificationContainer.scss";
import Loading from "./Loading";

const Error = (error) => {
  console.log("from NotificationContainer.js");
  console.log(error);
};

const NotificationContainer = () => {
  const userData = useContext(UserContext);
  const [notes, setNotes] = useState([]);
  const [adminNotes, setAdminNotes] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(true);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

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
      .then(() => setLoading(false))
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
      .then(() => setAdminLoading(false))
      .catch(Error);
  }, []);

  useEffect(() => {
    fetchNotifications();
    if (userData.isAdmin) fetchAdminNotifications();
    else setAdminLoading(false);

    // 일반 알림 구독
    const unsub = onSnapshot(
      collection(db, `userlist/${userData.uid}/notification`),
      () => fetchNotifications()
    );

    // 관리자 알림 구독
    const unsubAdmin = userData.isAdmin
      ? onSnapshot(collection(db, "admin-notification"), () =>
          fetchAdminNotifications()
        )
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
    <>
      <IconButton
        size="large"
        edge="start"
        color="inherit"
        aria-label="badge"
        onClick={handleClick}
      >
        <Badge color="error" variant="dot">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        {loading || adminLoading ? (
          <Loading />
        ) : (
          <div>
            {adminNotes.map((note, index) => (
              <Notification key={index} note={note} admin={true} />
            ))}
            {notes.map((note, index) => (
              <Notification key={index} note={note} admin={false} />
            ))}
          </div>
        )}
      </Menu>
    </>
  );
};

export default NotificationContainer;
