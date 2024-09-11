"use client"

import { useEffect, useRef, useState } from 'react'
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
import { Delete, Trash2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { z } from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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

interface AuctionItem {
  id: number
  itemName: string
  itemCategory: "自动月矿" | "手动月矿" | "天钩"
  auctionStatus: "拍卖中" | string
  auctionInfo: "当前无人竞拍" | "当前你是最高出价" | string
  regionName: "Catch" | "Querious"
  systemName: string
  itemDetail: string
  startTime: string
  startPrice: string
  bid: number
}

interface AuctionRule {
  regionName: "Catch" | "Querious"
  costIndex: number
  itemCategory: "自动月矿" | "手动月矿"
}

const RulesFormSchema = z.object({
  region: z.string({ required_error: "Please select an region" }),
  category: z.string({ required_error: "Please select a category" }),
  costIndex: z.string({ required_error: "Please input a cost index number" })
})

export default function AuctionForm() {
  const [token, setToken] = useState("")
  const [auctionList, setAuctionList] = useState<AuctionItem[]>([])
  const [rules, setRules] = useState<AuctionRule[]>([])
  const [itemPriceMap, setItemPriceMap] = useState<any>()
  const [analyzeData, setAnalyzeData] = useState<MoonData[]>([])

  const t = useTranslations("auction")

  useEffect(() => {
    setToken(sessionStorage["token"] || "")
    setRules(JSON.parse(sessionStorage["rules"] || "[]"))
  }, [])

  useEffect(() => {
    if (token) {
      fetch("https://tools.dc-eve.com/qq/auction/page", {
        method: "POST", body: JSON.stringify({
          itemName: "",
          systemId: [],
          constellationId: [],
          regionId: [],
          auctionStatus: [],
          category: [],
          page: 1,
          size: 999
        }), headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Cookie: `tools_remember=${token}`
        }
      })
        .then(resp => resp.json())
        .then(resp => {
          setAuctionList(resp.data.data)
          // console.log(resp.data.data)
        })
    }
  }, [token])

  const matchRule = (auctionItem: AuctionItem) => {
    let costIndex = Infinity
    rules.forEach((rule) => {
      if (auctionItem.itemCategory !== rule.itemCategory) return
      if (auctionItem.regionName !== rule.regionName) return
      costIndex = Math.min(costIndex, rule.costIndex)
    })

    return costIndex
  }

  useEffect(() => {
    if (auctionList.length === 0) return
    const moons = auctionList.reduce((a, c) => {
      return `${a}\n${c.itemDetail}`
    }, "")

    fetch('/api/format', {
      method: 'POST', body: JSON.stringify({
        data: moons
      })
    })
      .then(resp => resp.json())
      .then(data => {
        const rows = data.result.split("\n")
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
            console.log(data)
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
            // console.log(moons)
          })
      })


    auctionList.forEach(auctionItem => {
      const costIndex = matchRule(auctionItem)
      const fromStartHrs = Math.ceil((new Date().getTime() - new Date(auctionItem.startTime).getTime()) / 1000 / 3600)

      
    })

    // const interval = setInterval(() => {

    // }, 1000);
    // return () => clearInterval(interval);
  }, [auctionList])

  const rulesForm = useForm<z.infer<typeof RulesFormSchema>>({
    resolver: zodResolver(RulesFormSchema),
  })

  const onSubmit = (data: z.infer<typeof RulesFormSchema>) => {
    setRules([...rules, {
      costIndex: parseFloat(data.costIndex),
      regionName: data.region as "Catch" | "Querious",
      itemCategory: data.category as "自动月矿" | "手动月矿"
    }])
    sessionStorage["rules"] = JSON.stringify([...rules, {
      costIndex: parseFloat(data.costIndex),
      regionName: data.region as "Catch" | "Querious",
      itemCategory: data.category as "自动月矿" | "手动月矿"
    }])
  }

  return <>
    <CardContent>
      {/* <div className='flex gap-2 mb-4 items-center'>
        <div className='text-nowrap'>Minimum display value</div>
        <Input type="number" step="100000" value={minBuy} onChange={(e) => setMinBuy(e.target.value)}></Input>
      </div> */}
      {token ? <div className='flex flex-col gap-2'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">{t("ruleId")}</TableHead>
              <TableHead>{t("category")}</TableHead>
              <TableHead className="text-right">{t("region")}</TableHead>
              <TableHead className="text-right">{t("costIndex")}</TableHead>
              <TableHead className="text-right">{t("operation")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {
              rules.map((rule, index) => {

                return <TableRow key={index}>
                  <TableCell className="w-[150px]">{index}</TableCell>
                  <TableCell>{rule.itemCategory}</TableCell>
                  <TableCell className="text-right">{rule.regionName}</TableCell>
                  <TableCell className="text-right">{rule.costIndex}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" onClick={() => {
                      setRules(rules.filter(_rule => _rule !== rule))
                    }}>
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </TableCell>
                </TableRow>
              })
            }
          </TableBody>
        </Table>
        <div>
          <Form {...rulesForm}>
            <form onSubmit={rulesForm.handleSubmit(onSubmit)} className='flex gap-2'>
              <FormField
                control={rulesForm.control}
                name="region"
                render={({ field }) => (<Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t("regionTip")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{t("region")}</SelectLabel>
                      <SelectItem value="Querious">{t("querious")}</SelectItem>
                      <SelectItem value="Catch">{t("catch")}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>)}
              />
              <FormField
                control={rulesForm.control}
                name="category"
                render={({ field }) => (<Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t("categoryTip")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{t("category")}</SelectLabel>
                      <SelectItem value="自动月矿">{t("metenox")}</SelectItem>
                      <SelectItem value="手动月矿">{t("athanor")}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>)}
              />
              <FormField
                control={rulesForm.control}
                name="costIndex"
                render={({ field }) => (<FormItem>
                  <FormControl>
                    <Input type="number" placeholder={t("minCostIndex")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>)}
              />
              <Button type="submit">{t("addRule")}</Button>
            </form>
          </Form>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">{t("category")}</TableHead>
              <TableHead>{t("region")}</TableHead>
              <TableHead className="text-right">{t("system")}</TableHead>
              <TableHead className="text-right">{t("value")}</TableHead>
              <TableHead className="text-right">{t("currentCostIndex")}</TableHead>
              <TableHead className="text-right">{t("bid")}</TableHead>
              <TableHead className="text-right">{t("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {
              // auctionList.map((item, index) => {
              auctionList
                .filter(item => item.auctionStatus !== "已结束")
                .filter(item => item.itemCategory === "手动月矿" || item.itemCategory === "自动月矿")
                .map((item, index) => {
                  const benefit = (item.itemCategory === "手动月矿" ? analyzeData[index]?.manualPrice : (analyzeData[index]?.buy - itemPriceMap.queryBuyAssess.result[81143].max_price.price * 55 - 90000)) * 24 * 90
                  const price = item.bid || parseInt(item.startPrice.replaceAll(",", ""))
                  const costIndex = ((benefit - price) / price)
                  const matchedCi = matchRule(item)

                  return benefit ? <TableRow key={index}>
                    <TableCell className="w-[150px]">{item.itemCategory}</TableCell>
                    <TableCell>{item.regionName}</TableCell>
                    <TableCell className="text-right">{item.systemName}</TableCell>
                    <TableCell className="text-right">{benefit.toLocaleString()}</TableCell>
                    <TableCell className="text-right" style={{
                      color: matchedCi > costIndex ? "red" : "green"
                    }}>{`${costIndex.toFixed(2)}${matchedCi > costIndex ? "" : ` / ${matchedCi}`}`}</TableCell>
                    <TableCell className="text-right">{price.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{item.auctionStatus}</TableCell>
                  </TableRow> : <></>
              })}
          </TableBody>
        </Table>
      </div> : <Textarea
        value={token}
        onChange={(e) => {
          setToken(e.target.value)
          sessionStorage["token"] = e.target.value
        }}
        className=' resize-none h-[60vh]'
        placeholder={t("tokenTip")}
      />}
    </CardContent>
  </>
}