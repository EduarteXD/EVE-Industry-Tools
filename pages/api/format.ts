// @ts-ignore
import typeIds from './typeIds.yml'

import type { NextApiRequest, NextApiResponse } from 'next'
 
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const data = JSON.parse(req.body).data

  // "Cinnabar(朱砂)：22%，Titanite(榍石)：17%，Monazite(独居石)：27%，Ytterbite(硅铍钇矿)：34% "
  const rows = data.split("，")

  let result = "卫星	卫星产物	数量	矿石TypeID	恒星系ID	行星ID	卫星ID\nmocked moon"

  for(let i = 0; i < rows.length; i++) {
    const [_name, _content] = rows[i].split("：")
    const name = _name.split("(")[1].split(")")[0]
    const content = parseFloat(_content.split("%")[0]) / 100

    const line = `\t${name}\t${content}\t${typeIds[name]}\t0\t0\t0`

    result = `${result}\n${line}`
  }


  // const names = JSON.parse(req.body)
  // console.log(names)

  // const result = {} as {[x: string]: string}

  // for (let i = 0; i < names.length; i++) {
  //   result[names[i]] = typeIds[names[i]]
  // }

  res.status(200).json({result: result})

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