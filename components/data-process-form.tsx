"use client"

import { useRef, useState } from 'react'
// @ts-ignore
import typeMaterials from './typeMaterials.yml'

import { Textarea } from "@/components/ui/textarea"
import { Button } from './ui/button'
import { CardContent, CardFooter } from './ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from './ui/input'
import { useTranslations } from 'next-intl'

interface MoonData {
  volume: number
  name: string
  materials: { [x: number]: number }
  materialsManual: { [x: number]: number }
  manualPrice: number
  buy: number
  sell: number
}

export default function DataProcessForm() {
  const [scanData, setScanData] = useState("")
  const [itemNameMap, setItemNameMap] = useState<{ [x: number]: string }>({})
  const [minBuy, setMinBuy] = useState("1000000")
  const [itemPriceMap, setItemPriceMap] = useState<any>()
  const [analyzeData, setAnalyzeData] = useState<MoonData[]>([])

  const t = useTranslations("metenox")

  const calc = async () => {
    let _scanData = scanData
    await new Promise((res) => {
      if (_scanData.split("，").length !== 1) {
        fetch('/api/format', { method: 'POST', body: JSON.stringify({
          data: _scanData
        }) })
          .then(resp => resp.json())
          .then(data => {
            console.log(data)
            _scanData = data.result
          })
          .finally(() => res(""))
      } else {res("")}
    })
    const rows = _scanData.split("\n")
    const moons = [] as MoonData[]
    const itemsMap = new Map<number, boolean>()
    const currentMoon = {
      name: "",
      materials: {},
      materialsManual: {},
      volume: 0
    } as MoonData
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].split(" ").length !== 1) {
        if (currentMoon.name) moons.push({ ...currentMoon })
        // create a new moon
        currentMoon.name = rows[i].replaceAll("\t", "")
        currentMoon.materials = {}
        currentMoon.materialsManual = {}
        currentMoon.volume = 0
      } else if (rows[i] !== "") {
        const row = rows[i].split("\t")
        const [_, __, quantity, id] = row
        // const quantity = parseFloat(row[2])
        // const id = row[3]

        const materialsCanBeMined = typeMaterials[id]?.materials.filter((material: { materialTypeID: number }) => material.materialTypeID > 100)

        const oreMap = {
          4: 45493,
          8: 45497,
          16: 45501,
          32: 45506
        }

        if (parseInt(id) > oreMap[8]) {
          currentMoon.volume += Math.floor(30 * parseFloat(quantity)) * 10 * 100
          typeMaterials[id]?.materials.forEach((materail: { materialTypeID: number, quantity: number }) => {
            currentMoon.materialsManual[materail.materialTypeID] = (currentMoon.materialsManual[materail.materialTypeID] || 0) + Math.floor(Math.floor(materail.quantity * 30 * parseFloat(quantity)) * 0.87)
            // itemsMap.set(materail.materialTypeID, true)
          })
        }

        materialsCanBeMined.forEach((materail: { materialTypeID: number, quantity: number }) => {
          currentMoon.materials[materail.materialTypeID] = (currentMoon.materials[materail.materialTypeID] || 0) + Math.floor(materail.quantity * 12 * parseFloat(quantity))
          itemsMap.set(materail.materialTypeID, true)
        })
      }
    }
    if (currentMoon.name) moons.push({ ...currentMoon })

    // 默认查询岩浆气的价格
    const items = [81143]
    itemsMap.forEach((_, key) => { items.push(key) })

    fetch("/api/itemName/batch", { method: 'post', body: JSON.stringify({ ids: items, locale: location.pathname.split("/")[1] }) })
      .then(resp => resp.json())
      .then(data => {
        setItemNameMap(data)
      })

    fetch("https://eve.c3q.cc/market/api/", {
      method: 'post', headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      }, body: new URLSearchParams({
        queryBuyAssess: JSON.stringify(items),
        buy_location_id: "[30000142]",
        querySellAssess: JSON.stringify(items),
        sell_location_id: "[30000142]"
      }).toString()
    })
      .then(resp => resp.json())
      .then(data => {
        setItemPriceMap(data)
        moons.forEach(moon => {
          let sell = 0
          let buy = 0
          let manual = 0
          Object.keys(moon.materials).forEach((key) => {
            sell += moon.materials[parseInt(key)] * data.querySellAssess.result[key].min_price.price
            buy += moon.materials[parseInt(key)] * data.queryBuyAssess.result[key].max_price.price
          })

          Object.keys(moon.materialsManual).forEach((key) => {
            manual += (moon.materialsManual[parseInt(key)] * data.queryBuyAssess.result[key].max_price.price + moon.materialsManual[parseInt(key)] * data.querySellAssess.result[key].min_price.price) / 2
          })
          moon.buy = buy
          moon.sell = sell
          moon.manualPrice = manual
          // console.log(manual)
        })
        setAnalyzeData(moons)
      })


    // console.log(moons)



  }

  return <>
    <CardContent>
      <div className='flex gap-2 mb-4 items-center'>
        <div className='text-nowrap'>{t("minimumDisplay")}</div>
        <Input type="number" step="100000" value={minBuy} onChange={(e) => setMinBuy(e.target.value)}></Input>
      </div>
      {analyzeData.length ? <>
        {analyzeData.map((row, index) => {
          return <div key={index} className={`${row.buy < parseInt(minBuy) || 0 ? 'hidden' : ''}`}>
            <div>
              {row.name}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">{t("material")}</TableHead>
                  <TableHead>{t("outputAmount")}</TableHead>
                  <TableHead className="text-right">{t("jitaSell")}</TableHead>
                  <TableHead className="text-right">{t("jitaBuy")}</TableHead>

                  <TableHead className="text-right"></TableHead>
                  
                  {/* <TableHead className="text-right">手动挖掘容积（≥r16）</TableHead>
                  <TableHead className="text-right">手动挖掘价值</TableHead>
                  <TableHead className="text-right">Laverage</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.keys(row.materials).map((index) => {
                  // totSell += itemPriceMap.querySellAssess.result[index].min_price.price * row.materials[parseInt(index)]
                  // totBuy += itemPriceMap.queryBuyAssess.result[index].max_price.price * row.materials[parseInt(index)]

                  return <TableRow key={index}>
                    <TableCell className="w-[150px]">{itemNameMap[parseInt(index)]}</TableCell>
                    <TableCell>{row.materials[parseInt(index)]}</TableCell>
                    <TableCell className="text-right">{(itemPriceMap.querySellAssess.result[index].min_price.price * row.materials[parseInt(index)]).toLocaleString()}</TableCell>
                    <TableCell className="text-right">{(itemPriceMap.queryBuyAssess.result[index].max_price.price * row.materials[parseInt(index)]).toLocaleString()}</TableCell>

                    <TableCell className="text-right"></TableCell>
                  </TableRow>
                })}
                <TableRow>
                  <TableCell className="w-[100px]">{t("total")}</TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-right">{row.sell.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{row.buy.toLocaleString()}</TableCell>

                  <TableCell className="text-right"></TableCell>

                  {/* <TableCell className="text-right">{row.volume.toLocaleString()}m³</TableCell>
                  <TableCell className="text-right">{row.manualPrice.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{(row.manualPrice - row.volume * 500 - (row.sell + row.buy) / 2 + ((itemPriceMap.queryBuyAssess.result[81143].max_price.price + itemPriceMap.querySellAssess.result[81143].min_price.price) / 2) * 55).toLocaleString()}</TableCell> */}
                </TableRow>
                <TableRow>
                  <TableCell className="w-[100px]" colSpan={2}>{t("manualMiningVolume")}</TableCell>
                  <TableCell className="text-right"></TableCell>
                  <TableCell className="text-right"></TableCell>

                  <TableCell className="text-right">{row.volume.toLocaleString()}m³</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="w-[100px]" colSpan={2}>{t("manualMiningValue")}</TableCell>
                  <TableCell className="text-right"></TableCell>
                  <TableCell className="text-right"></TableCell>

                  <TableCell className="text-right">{row.manualPrice.toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="w-[100px]" colSpan={2}>{t("manualMiningAdditional")}</TableCell>
                  <TableCell className="text-right"></TableCell>
                  <TableCell className="text-right"></TableCell>

                  <TableCell className="text-right">{(row.manualPrice - row.volume * 500 - (row.sell + row.buy) / 2 + ((itemPriceMap.queryBuyAssess.result[81143].max_price.price + itemPriceMap.querySellAssess.result[81143].min_price.price) / 2) * 55).toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        })}
      </> : <Textarea
        value={scanData}
        onChange={(e) => setScanData(e.target.value.replaceAll(/<localized hint="[\S]* [\S]* - [\S]* [\S]*">/g, "").replaceAll(/<\/localized>/g, "").replaceAll(/<localized hint="[\S]*">/g, ""))}
        className=' resize-none h-[60vh]'
      />}
    </CardContent>
    <CardFooter>
      {analyzeData.length ? <Button onClick={() => setAnalyzeData([])}>{t("clear")}</Button> :
        <Button onClick={calc}>{t("calculate")}</Button>
      }
    </CardFooter>
  </>
}