import AuctionForm from "@/components/auction-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getTranslations } from "next-intl/server"

export default async function DashBoard() { 
  const t = await getTranslations("auction")

  return <div className="m-auto px-12">
    <Card className="m-auto my-12">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>

      <AuctionForm />
    </Card>
  </div>
}