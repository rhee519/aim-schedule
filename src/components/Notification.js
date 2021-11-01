import {
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
} from "@firebase/firestore";
import { MenuItem } from "@mui/material";
import React, { useState, useCallback, useEffect, useContext } from "react";
import { UserContext } from "../contexts/Context";
import { db } from "../myFirebase";
// import "../css/Notification.scss";

const Error = (error) => {
  console.log("from Notification.js");
  console.log(error);
};

const SignUpRequestBtns = ({ onSignUpApproveClick, onDeleteClick }) => (
  <>
    <button className="btn--signup-approve" onClick={onSignUpApproveClick}>
      승인
    </button>
    <button className="btn--signup-deny" onClick={onDeleteClick}>
      삭제
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
  const [text, setText] = useState("");
  const [icon, setIcon] = useState("");
  const userData = useContext(UserContext);
  const {
    type,
    checked,
    // createdAt,
    data,
    id,
  } = note;

  // type === "SIGNUP_REQUEST"
  const fetchSignUpRequest = useCallback(() => {
    setText(`${data.userName}님이 회원가입을 신청했습니다.`);
    setIcon(data.profileImageURL);
  }, [data.userName, data.profileImageURL]);

  const fetchSignUpComplete = useCallback(() => {
    setText(`${data.userName}님의 회원가입이 승인되었습니다!`);
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

  const onSignUpApproveClick = useCallback(async () => {
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
    checkNotification();
  }, [checkNotification, data, id]);

  const onDeleteClick = useCallback(async () => {
    const noteRef = admin
      ? doc(db, "admin-notification", id)
      : doc(db, `userlist/${userData.uid}/notification`, id);
    await deleteDoc(noteRef).catch(Error);
  }, [userData.uid, id, admin]);

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

  return (
    <MenuItem className="notification--box">
      <div
        className="notification--icon"
        style={{
          backgroundImage: `url(${icon})`,
          backgroundSize: "contain",
          backgroundRepeat: "none",
          borderRadius: 100,
          width: 24,
          height: 24,
          marginRight: 3,
        }}
      />
      <div className="notification--content">
        <p>{text}</p>
      </div>
      <div className="notification--time"></div>
      {!checked && (
        <div className="notification--btns">
          {SignUpRequestBtns({
            onSignUpApproveClick,
            onDeleteClick,
          })}
        </div>
      )}
    </MenuItem>
  );
};

export default Notification;
export { SendNotification, SendAdminNotification };
