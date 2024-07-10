import DataProcessForm from "@/components/data-process-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function DashBoard() { 
  return <div className="m-auto px-12">
    <Card className="max-w-3xl m-auto my-12">
      <CardHeader>
        <CardTitle>Metenox 采集计算器</CardTitle>
        <CardDescription>在扫描完成后，点击复制到剪贴板按钮将结果复制到剪贴板后粘贴到下面文本框后点击计算即可计算卫星的周期收益</CardDescription>
      </CardHeader>

      <DataProcessForm />
    </Card>
  </div>
}