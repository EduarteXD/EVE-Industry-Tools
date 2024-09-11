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
import { useToast } from "@/hooks/use-toast"

interface ItemData {
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
  auctionInfo: string
  regionName: "Catch" | "Querious"
  systemName: string
  itemDetail: string
  startTime: string
  startPrice: string

  costIndex: number
  value: number
  matchedCi: number
  fromStartHrs: number
  price: number
}

interface AuctionRule {
  regionName: "Catch" | "Querious"
  costIndex: number
  itemCategory: "自动月矿" | "手动月矿" | "天钩"
}

interface Bids {
  [x: number]: number
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
  const [analyzeData, setAnalyzeData] = useState<ItemData[]>([])

  const { toast } = useToast()

  const categoryMap = {
    "天钩": "skyhook",
    "自动月矿": "metenox",
    "手动月矿": "athanor"
  }

  const t = useTranslations("auction")

  useEffect(() => {
    setToken(sessionStorage["token"] || "")
    setRules(JSON.parse(sessionStorage["rules"] || "[]"))
  }, [])

  const getAuctionList = async () => {
    if (!token) return
    try {
      const rawAuctionList: AuctionItem[] = (await (await fetch("https://tools.dc-eve.com/qq/auction/page", {
        method: "POST",
        body: JSON.stringify({
          itemName: "",
          systemId: [],
          constellationId: [],
          regionId: [],
          auctionStatus: [],
          category: [],
          page: 1,
          size: 999
        }),
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Cookie: `tools_remember=${token}`
        }
      })).json()).data.data

      const rawItems = rawAuctionList.reduce((a, c) => {
        return `${a}\n${c.itemDetail}`
      }, "")

      const formatedItems = await (await fetch('/api/format', {
        method: 'POST', body: JSON.stringify({
          data: rawItems
        })
      })).json()

      const rows = formatedItems.result.split("\n")
      const items = [] as ItemData[]
      const marketItemsMap = new Map<number, boolean>()
      const current = {
        name: "",
        materials: {},
        materialsManual: {},
        volume: 0
      } as ItemData
      for (let i = 1; i < rows.length; i++) {
        if (rows[i].split(" ").length !== 1) {
          if (current.name) items.push({ ...current })
          current.name = rows[i].replaceAll("\t", "")
          current.materials = {}
          current.materialsManual = {}
          current.volume = 0
        } else if (rows[i] !== "" && rows[i] !== "skyhook") {
          const row = rows[i].split("\t")
          const [_, __, quantity, id] = row

          const materialsCanBeMined = typeMaterials[id]?.materials.filter((material: { materialTypeID: number }) => material.materialTypeID > 100)

          const oreMap = {
            4: 45493,
            8: 45497,
            16: 45501,
            32: 45506
          }

          if (parseInt(id) > oreMap[8]) {
            current.volume += Math.floor(30 * parseFloat(quantity)) * 10 * 100
            typeMaterials[id]?.materials.forEach((materail: { materialTypeID: number, quantity: number }) => {
              current.materialsManual[materail.materialTypeID] = (current.materialsManual[materail.materialTypeID] || 0) + Math.floor(Math.floor(materail.quantity * 30 * parseFloat(quantity)) * 0.87)
            })
          }

          materialsCanBeMined.forEach((materail: { materialTypeID: number, quantity: number }) => {
            current.materials[materail.materialTypeID] = (current.materials[materail.materialTypeID] || 0) + Math.floor(materail.quantity * 12 * parseFloat(quantity))
            marketItemsMap.set(materail.materialTypeID, true)
          })
        }
      }

      if (current.name) items.push({ ...current })

      const marketItems = [81143]
      marketItemsMap.forEach((_, key) => { marketItems.push(key) })

      const marketData = await (await fetch("https://eve.c3q.cc/market/api/", {
        method: 'post', headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        }, body: new URLSearchParams({
          queryBuyAssess: JSON.stringify(marketItems),
          buy_location_id: "[30000142]",
          querySellAssess: JSON.stringify(marketItems),
          sell_location_id: "[30000142]"
        }).toString()
      })).json()

      items.forEach((item, index) => {
        if (rawAuctionList[index].itemCategory === "天钩") {
          item.buy = parseInt(rawAuctionList[index].itemDetail.split("[")[1].split("]")[0]) * marketData.queryBuyAssess.result[81143].max_price.price
          return
        }

        let sell = 0
        let buy = 0
        let manual = 0
        Object.keys(item.materials).forEach((key) => {
          sell += item.materials[parseInt(key)] * marketData.querySellAssess.result[key].min_price.price
          buy += item.materials[parseInt(key)] * marketData.queryBuyAssess.result[key].max_price.price
        })

        Object.keys(item.materialsManual).forEach((key) => {
          manual += (item.materialsManual[parseInt(key)] * marketData.queryBuyAssess.result[key].max_price.price + item.materialsManual[parseInt(key)] * marketData.querySellAssess.result[key].min_price.price) / 2
        })

        item.buy = buy
        item.sell = sell
        item.manualPrice = manual
      })

      rawAuctionList.forEach((auctionItem, index) => {
        const matchedCostIndex = matchRule(auctionItem)
        const fromStartHrs = Math.ceil((new Date().getTime() - new Date(auctionItem.startTime).getTime()) / 1000 / 3600)

        const bids: Bids = JSON.parse(localStorage["bids"] || "{}")

        const bid = auctionItem.auctionInfo === "当前无人竞拍" ? parseInt(auctionItem.startPrice.replaceAll(",", "")) + 1 :
          parseInt(auctionItem.auctionInfo.replace("当前第二高拍卖价为", "").replace("当前你的公司是最高出价:", "").replaceAll(",", ""))
        const benefit = (() => {
          switch (auctionItem.itemCategory) {
            case "天钩":
              return items[index].buy
            case "手动月矿":
              return items[index].manualPrice
            case "自动月矿":
              return items[index].buy - marketData.queryBuyAssess.result[81143].max_price.price * 55 - 90000
          }
        })() * 24 * 90

        let price = bid || parseInt(auctionItem.startPrice.replaceAll(",", ""))
        if (auctionItem.auctionInfo.startsWith("当前第二高拍卖价为")) {
          price = Math.max(bids[auctionItem.id] || 0, price) + 10_000_000
        }

        auctionItem.costIndex = ((benefit - price) / price)
        auctionItem.value = benefit
        auctionItem.matchedCi = matchedCostIndex
        auctionItem.fromStartHrs = fromStartHrs
        auctionItem.price = price
      })

      setAuctionList(rawAuctionList)
    } catch (e) {
      toast({
        title: t("networkError"),
        description: String(e)
      })
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeout(getAuctionList, Math.random() * 120)
    }, 150_000);

    getAuctionList();

    return () => clearInterval(interval);
  }, [token])

  useEffect(() => {
    if (!auctionList.length) return

    auctionList.forEach(async (item, index) => {
      if (item.costIndex >= item.matchedCi && !item.auctionInfo.startsWith("当前你的公司是最高出价") && item.fromStartHrs >= 24 * 4 - 1) {
        const bids = JSON.parse(localStorage["bids"])
        toast({
          title: `${t("bidFor")} ${item.itemName}`,
          description: `${t("bidPriceIs")} ${item.price.toLocaleString()}`
        })

        bids[item.id] = item.price
        localStorage["bids"] = JSON.stringify(bids)

        try {
          await fetch("https://tools.dc-eve.com/qq/auction/submit", {
            method: "POST", body: JSON.stringify({
              id: item.id,
              price: item.price
            }), headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Cookie: `tools_remember=${token}`
            }
          })
        } catch (e) {
          toast({
            title: t("networkError"),
            description: String(e)
          })
        }
      } else {
        console.log(">>>> skipped", item.itemName, "in region", item.regionName, "cost index", item.costIndex, "/", item.matchedCi)
      }
    })
  }, [auctionList])

  const matchRule = (auctionItem: AuctionItem) => {
    let costIndex = Infinity
    rules.forEach((rule) => {
      if (auctionItem.itemCategory !== rule.itemCategory) return
      if (auctionItem.regionName !== rule.regionName) return
      costIndex = Math.min(costIndex, rule.costIndex)
    })

    return costIndex
  }

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
              <TableHead className="w-[120px]">{t("ruleId")}</TableHead>
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
                  <TableCell className="w-[120px]">{index}</TableCell>
                  <TableCell>{t(categoryMap[rule.itemCategory])}</TableCell>
                  <TableCell className="text-right">{rule.regionName}</TableCell>
                  <TableCell className="text-right">{rule.costIndex}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" onClick={() => {
                      setRules(rules.filter(_rule => _rule !== rule))
                      sessionStorage["rules"] = JSON.stringify(rules.filter(_rule => _rule !== rule))
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
                      <SelectItem value="天钩">{t("skyhook")}</SelectItem>
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
              <TableHead>{t("category")}</TableHead>
              <TableHead>{t("region")}</TableHead>
              <TableHead>{t("system")}</TableHead>
              <TableHead>{t("value")}</TableHead>
              <TableHead>{t("name")}</TableHead>
              <TableHead className="text-right">{t("currentCostIndex")}</TableHead>
              {/* <TableHead className="text-right">{t("bid")}</TableHead> */}
              <TableHead className="text-right">{t("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {
              // auctionList.map((item, index) => {
              auctionList
                .filter(item => item.auctionStatus !== "已结束")
                .map((item, index) => {
                  return <TableRow key={index}>
                    <TableCell>{t(categoryMap[item.itemCategory])}</TableCell>
                    <TableCell>{t(item.regionName.toLocaleLowerCase())}</TableCell>
                    <TableCell>{item.systemName}</TableCell>
                    <TableCell>{item.value.toLocaleString()}</TableCell>
                    <TableCell>{item.itemName}</TableCell>
                    <TableCell className="text-right" style={{
                      color: item.matchedCi > item.costIndex ? "red" : "green"
                    }}>{`${item.costIndex.toFixed(2)}${item.matchedCi > item.costIndex ? "" : ` / ${item.matchedCi}`}`}</TableCell>
                    <TableCell className="text-right">{item.auctionInfo}</TableCell>
                  </TableRow>
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