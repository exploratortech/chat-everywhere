import dayjs from "dayjs";

export const getTimeStamp = (): string => {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
};
