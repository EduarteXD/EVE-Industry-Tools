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
        <CardTitle>Calculator for Metenox Moon Drill</CardTitle>
        <CardDescription>
          After the scan is complete, click the Copy to Clipboard button to copy the result to the clipboard and paste it into the text box below and click Calculate to calculate the moon&apos;s periodic gain.
          <br /><span className="font-bold">The calculation formula for additional output from manual mining is:</span>
          <br />(Average price for the moon ore with a rarity ≥ 16) - miner cost (based on 500/m³) - (Metenox output per process - Average price for the Magmatic Gas consumption per process)
        </CardDescription>
      </CardHeader>

      <DataProcessForm />
    </Card>
  </div>
}