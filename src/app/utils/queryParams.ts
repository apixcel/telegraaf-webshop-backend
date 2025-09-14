export const generateQueryParams = (params: Record<string, unknown>) => {
  let queryString = "";
  const entries = Object.entries(params);

  entries.forEach(([key, value], i) => {
    const isLast = i === entries.length - 1;
    if (value) {
      if (isLast) {
        queryString += `${key}=${value}`;
      } else {
        queryString += `${key}=${value}&`;
      }
    }
  });

  return queryString;
};
