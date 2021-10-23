import { deleteDoc, doc, setDoc, updateDoc } from "@firebase/firestore";
import React, { useState, useCallback, useEffect, useContext } from "react";
import { UserContext } from "../contexts/Context";
import { db } from "../myFirebase";
import "../css/Notification.scss";

const Error = (error) => {
  console.log("from Notification.js");
  console.log(error);
};

const Notification = ({ type, checked, createdAt, data, id }) => {
  const [text, setText] = useState("");
  const [icon, setIcon] = useState("");
  const userData = useContext(UserContext);

  // type === "SIGNUP_REQUEST"
  const fetchSignUpRequest = useCallback(() => {
    setText(`${data.userName}님이 회원가입을 신청했습니다.`);
    setIcon(data.profileImageURL);
  }, [data.userName, data.profileImageURL]);

  const checkNotification = useCallback(async () => {
    // console.log(id);
    const noteRef = doc(db, `userlist/${userData.uid}/notification`, id);
    await updateDoc(noteRef, {
      checked: true,
    }).catch(Error);
  }, [userData.uid, id]);

  const onSignUpApproveClick = useCallback(async () => {
    // approve sign-up request
    const newUserRef = doc(db, "userlist", data.uid);
    const waitingUserRef = doc(db, "waitinglist", data.uid);
    await setDoc(newUserRef, { ...data }).catch(Error);
    await deleteDoc(waitingUserRef).catch(Error);

    // check notification
    checkNotification();
  }, [checkNotification, data]);

  useEffect(() => {
    switch (type) {
      case "SIGNUP_REQUEST":
        fetchSignUpRequest();
        break;

      default:
        break;
    }
  }, [
    fetchSignUpRequest,
    // onSignUpApproveClick,
    type,
    // BtnsComponent,
  ]);

  return (
    <div className="notification--box">
      <div
        className="notification--icon"
        style={{
          backgroundImage: `url(${icon})`,
        }}
      ></div>
      <div className="notification--content">
        <p>{text}</p>
      </div>
      <div className="notification--time"></div>
      {!checked && (
        <div className="notification--btns">
          {SignUpBtns(onSignUpApproveClick)}
        </div>
      )}
    </div>
  );
};

const SignUpBtns = (onClick) => (
  <>
    <button className="btn--signup-approve" onClick={onClick}>
      승인
    </button>
    <button className="btn--signup-deny">삭제</button>
  </>
);

export default Notification;
