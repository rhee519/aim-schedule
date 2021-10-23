import React from "react";
import "../css/Todo.scss";

const Todo = ({ text, done, id }) => {
  const classname = "todo--text " + (done ? "checked" : "unchecked");
  return (
    <span className={classname} id={id}>
      {text}
    </span>
  );
};

export default Todo;
