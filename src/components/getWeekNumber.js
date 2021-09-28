const getWeekNumber = (date) => {
  const oneJan = new Date(date.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((date - oneJan) / (24 * 60 * 60 * 1000));
  const result = Math.ceil((date.getDay() + 1 + numberOfDays) / 7);

  return result;
};

export default getWeekNumber;
