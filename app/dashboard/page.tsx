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
      </CardHeader>

      <DataProcessForm />
    </Card>
  </div>
}