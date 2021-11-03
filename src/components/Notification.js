import {
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
} from "@firebase/firestore";
import { Avatar, MenuItem, Typography } from "@mui/material";
import moment from "moment";
import React, { useState, useCallback, useEffect, useContext } from "react";
import { UserContext } from "../contexts/Context";
import { db } from "../myFirebase";
// import "../css/Notification.scss";

const Error = (error) => {
  console.log("from Notification.js");
  console.log(error);
};

const SignUpRequestBtns = ({ onApproveClick, onDenyClick }) => (
  <>
    <button className="btn--signup-approve" onClick={onApproveClick}>
      승인
    </button>
    <button className="btn--signup-deny" onClick={onDenyClick}>
      거절
    </button>
  </>
);

const SendNotification = async ({ receiverUid, type, data }) => {
  const notificationCollection = collection(
    db,
    `userlist/${receiverUid}/notification`
  );
  await addDoc(notificationCollection, {
    type,
    data,
    checked: false,
    createdAt: new Date().getTime(),
  })
    // .then((docSnap) => {
    //   console.log(docSnap);
    // })
    .catch(Error);
};

const SendAdminNotification = async ({ type, data }) => {
  const adminCollection = collection(db, "admin-notification");
  await addDoc(adminCollection, {
    type,
    data,
    checked: false,
    createdAt: new Date().getTime(),
  }).catch(Error);
};

const Notification = ({ note, admin }) => {
  const [message, setMessage] = useState("");
  const [icon, setIcon] = useState("");
  const userData = useContext(UserContext);
  const { type, checked, createdAt, data, id } = note;

  // type === "SIGNUP_REQUEST"
  const fetchSignUpRequest = useCallback(() => {
    setMessage(`${data.userName}님이 회원가입을 신청했습니다.`);
    setIcon(data.profileImageURL);
  }, [data.userName, data.profileImageURL]);

  const fetchSignUpComplete = useCallback(() => {
    setMessage(`${data.userName}님의 회원가입이 승인되었습니다!`);
    setIcon(data.profileImageURL);
  }, [data.userName, data.profileImageURL]);

  const checkNotification = useCallback(async () => {
    const noteRef = admin
      ? doc(db, "admin-notification", id)
      : doc(db, `userlist/${userData.uid}/notification`, id);
    await updateDoc(noteRef, {
      checked: true,
    }).catch(Error);
  }, [userData.uid, id, admin]);

  const onApproveClick = useCallback(async () => {
    // approve sign-up request
    const newUserRef = doc(db, "userlist", data.uid);
    await setDoc(newUserRef, { ...data }).catch(Error);

    // delete new user from waiting list
    const waitingUserRef = doc(db, "waitinglist", data.uid);
    await deleteDoc(waitingUserRef).catch(Error);

    // update request
    const requestRef = doc(db, "admin-notification", id);
    await updateDoc(requestRef, {
      type: "SIGNUP_COMPLETE",
      checked: true,
    });

    // check notification
    // checkNotification();
  }, [
    // checkNotification,
    data,
    id,
  ]);

  const onDenyClick = useCallback(async () => {}, []);

  // const onDeleteClick = useCallback(async () => {
  //   const noteRef = admin
  //     ? doc(db, "admin-notification", id)
  //     : doc(db, `userlist/${userData.uid}/notification`, id);
  //   await deleteDoc(noteRef).catch(Error);
  // }, [userData.uid, id, admin]);

  useEffect(() => {
    switch (type) {
      case "SIGNUP_REQUEST":
        fetchSignUpRequest();
        break;
      case "SIGNUP_COMPLETE":
        fetchSignUpComplete();
        break;
      default:
        break;
    }
  }, [fetchSignUpRequest, fetchSignUpComplete, type]);

  return type === "SIGNUP_REQUEST" || type === "SIGNUP_COMPLETE" ? (
    <MenuItem onClick={checkNotification}>
      <Avatar
        alt={data.userName}
        src={icon}
        sx={{
          backgroundSize: "contain",
          backgroundRepeat: "none",
          borderRadius: 100,
          width: 24,
          height: 24,
        }}
      />
      <Typography
        display="block"
        sx={{
          flexGrow: 1,
        }}
      >
        {message}
      </Typography>
      <Typography
        variant="caption"
        display="block"
        sx={{
          marginLeft: 3,
          width: 80,
        }}
      >
        {moment(createdAt).fromNow()}
      </Typography>
      {!checked && (
        <div>
          {SignUpRequestBtns({
            onApproveClick,
            onDenyClick,
          })}
        </div>
      )}
    </MenuItem>
  ) : (
    <MenuItem>UI 준비중</MenuItem>
  );
};

export default Notification;
export { SendNotification, SendAdminNotification };
