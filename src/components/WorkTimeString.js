const WorkTimeString = (workTime) => {
  // workTime: ms 단위
  const hour = parseInt(workTime / 3600000, 10);
  const minute = parseInt((workTime % 3600000) / 60000, 10);
  // const second = parseInt((workTime%60000)/1000);
  return `${hour}시간 ${minute}분`;
};

export default WorkTimeString;
