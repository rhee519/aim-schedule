import { doc, getDoc, setDoc, updateDoc } from "@firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import { db } from "../myFirebase";
import Todo from "../components/Todo";
import "./TodoList.scss";

const TodoList = ({ userData }) => {
  const [todo, setTodo] = useState("");
  const [todoList, setTodoList] = useState([]);

  const fetchData = useCallback(async () => {
    // let fetchSubscribe = true;
    const docRef = doc(db, userData.uid, "todo-list");
    // if (fetchSubscribe)
    await getDoc(docRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          setTodoList(docSnap.data().todoList);
        } else {
          setTodoList([]);
        }
      })
      .catch((error) => {
        console.log("from TodoList.js");
        console.log(error);
      });
  }, [userData.uid]);

  const updateData = useCallback(
    async (newTodoList) => {
      const docRef = doc(db, userData.uid, "todo-list");
      await getDoc(docRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            updateDoc(docRef, {
              todoList: newTodoList,
            });
          } else {
            setDoc(docRef, {
              todoList: newTodoList,
            });
          }
        })
        .catch((error) => {
          console.log(error);
        });
    },
    [userData.uid]
  );

  useEffect(() => {
    // component did mount
    fetchData();
    return () => {
      setTodo("");
      setTodoList([]);
    };
  }, [fetchData]);

  const onChange = (event) => {
    const {
      target: { value },
    } = event;
    setTodo(value);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (todo === "") return;
    const timeNow = new Date().getTime();
    const newTodoList = [
      ...todoList,
      { text: todo, done: false, createdAt: timeNow, modifiedAt: timeNow },
    ];

    // update database
    updateData(newTodoList);

    setTodoList(newTodoList);
    setTodo("");
  };

  // const onClick = (event) => {
  //   const {
  //     target: { name, id },
  //   } = event;
  //   const newTodoList = [...todoList];
  //   if (name === "done") {
  //     newTodoList[id].done = !newTodoList[id].done;
  //   } else if (name === "delete") {
  //     newTodoList.splice(id, 1);
  //   }

  //   setTodoList(newTodoList);

  //   // update database
  //   updateData(newTodoList);
  // };

  const onTodoCheckClick = (event) => {
    const {
      target: { id },
    } = event;
    const newTodoList = [...todoList];
    newTodoList[id].done = !newTodoList[id].done;
    setTodoList(newTodoList);
    // update database
    updateData(newTodoList);
  };

  const onTodoDeleteClick = (event) => {
    const {
      target: { id },
    } = event;
    const newTodoList = [...todoList];
    newTodoList.splice(id, 1);
    setTodoList(newTodoList);
    // update database
    updateData(newTodoList);
  };

  return (
    <div className="todo-list--container">
      <h3 className="todo-list--title">{userData.displayName}의 To-do List.</h3>
      <form className="todo-list--form" onSubmit={onSubmit}>
        <input
          className="todo-list--input"
          type="text"
          value={todo}
          placeholder="Add new task"
          onChange={onChange}
        />
        <button className="todo--btn todo-list--btn-add" type="submit">
          <i className="material-icons">add</i>
        </button>
        {/* <input className="todo-list--btn-add" type="submit" value="add" /> */}
      </form>
      <div className="todo-list--todos">
        {todoList.map((todoEl, index) => (
          <div className="todo-list--todo" key={index}>
            <button
              className={
                "todo--btn todo--btn-check" + (todoEl.done ? " checked" : "")
              }
              onClick={onTodoCheckClick}
              id={index}
            >
              <i className="material-icons check" id={index}>
                {todoEl.done ? "undo" : "done"}
              </i>
            </button>
            <Todo
              className="todo--text"
              text={todoEl.text}
              done={todoEl.done}
              id={index}
            />

            <button
              className="todo--btn todo--btn-delete"
              onClick={onTodoDeleteClick}
            >
              <i className="material-icons delete">delete_forever</i>
            </button>
            {/* <input
              type="button"
              id={index}
              name="delete"
              value="del"
              onClick={onClick}
            /> */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TodoList;
