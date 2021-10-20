import { doc, getDoc } from "@firebase/firestore";
import React, { useState, useCallback } from "react";
import { db } from "../myFirebase";
import "./Notification.scss";

const Notification = ({ type, content, senderUid, createdAt }) => {
  const [text, setText] = useState("");
  const [icon, setIcon] = useState("");

  const fetchSenderData = useCallback(async () => {
    const senderDocRef = doc(db, "waitinglist", senderUid);
    await getDoc(senderDocRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          const sender = docSnap.data();
          setText(`${sender.userName}님이 회원가입을 신청했습니다.`);
          setIcon(sender.profileImageURL);
        }
      })
      .catch((error) => {
        console.log("from Notification.js");
        console.log(error);
      });
  }, [senderUid]);

  switch (type) {
    case "SIGNUP_REQUEST":
      fetchSenderData();
      break;

    default:
      setText(content);
      break;
  }

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
      <div className="notification--btns">
        <button>확인</button>
      </div>
    </div>
  );
};

export default Notification;
