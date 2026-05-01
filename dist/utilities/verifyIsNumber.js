export const verifyIsPaginationNumber = (param) => {
    return Number.isInteger(Number(param)) && Number(param) > 0;
};
