import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type KpiProps = {
  value: string,
  title: string,
  description: string | undefined
  children: React.ReactNode
}

export const KpiCard = (props: KpiProps) => {
  return (
    <Card className="hover:bg-accent hover:text-accent-foreground group grow hover:cursor-pointer">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {props.title}
        </CardTitle>
        <div>
          {props.children}
        </div>
      </CardHeader>
      <CardContent>
        <div className={"text-2xl font-bold group-hover:scale-y-125 group-hover:text-green-400 group-hover:transition"} >
          {props.value}
        </div>
        <p className="text-muted-foreground text-xs">
          {props.description}
        </p>
      </CardContent>
    </Card>)
}
