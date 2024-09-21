export const getDateString = (newDate) => {
  if (newDate === undefined || newDate === null) {
    return "";
  }
  return `${
    newDate.getUTCMonth() + 1
  }/${newDate.getUTCDate()}/${newDate.getUTCFullYear()}`;
};

export const compareUTCDates = (date1, date2) => {
  return (
    date1.getUTCMonth() === date2.getUTCMonth() &&
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCHours() === date2.getUTCHours()
  );
};

export const getDateAsUTC = (newDate) => {
  return new Date(
    Date.UTC(
      newDate.getUTCFullYear(),
      newDate.getUTCMonth(),
      newDate.getUTCDate(),
      newDate.getUTCHours(),
      newDate.getUTCMinutes(),
      newDate.getUTCSeconds(),
      newDate.getUTCMilliseconds()
    )
  );
};

export const getDateInputValue = (newDate) => {
  return newDate.toISOString().substring(0, 10);
};
