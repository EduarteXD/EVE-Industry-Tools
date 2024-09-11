// @ts-ignore
import types from './types.yml'

import type { NextApiRequest, NextApiResponse } from 'next'
 
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const ids = JSON.parse(req.body).ids
  const locale = JSON.parse(req.body).locale || "en"

  const result = {} as {[x: number]: string}

  for (let i = 0; i < ids.length; i++) {
    result[ids[i]] = types[ids[i]].name[locale]
  }

  res.status(200).json(result)

  // res.status(200).json({
  //   "16633": "烃类",
  //   "16634": "标准大气",
  //   "16635": "蒸发岩沉积物",
  //   "16636": "硅酸盐",
  //   "16637": "钨",
  //   "16638": "钛",
  //   "16640": "钴",
  //   "16641": "铬",
  //   "16642": "钒"
  // })
}