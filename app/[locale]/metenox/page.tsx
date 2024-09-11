import DataProcessForm from "@/components/data-process-form"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getTranslations } from "next-intl/server"

export default async function DashBoard() { 
  const t = await getTranslations("metenox")

  return <div className="m-auto px-12">
    <Card className="max-w-3xl m-auto my-12">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>
          {t("guide")}
          <br /><span className="font-bold">{t("formulaTip")}</span>
          <br />{t("formula")}
        </CardDescription>
      </CardHeader>

      <DataProcessForm />
    </Card>
  </div>
}