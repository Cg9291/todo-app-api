
export const verifyIsNumber = (param: string) => {
  return Number.isInteger(Number(param)) && Number(param) >= 0
}
