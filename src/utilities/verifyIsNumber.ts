
export const verifyIsPaginationNumber = (param: string) => {
  return Number.isInteger(Number(param)) && Number(param) > 0
}
