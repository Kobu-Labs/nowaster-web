import { Badge } from "@/components/ui/badge"
import { FC } from "react"

type SessionTagProps = {
  color?: keyof typeof colors
  value: string
}

const colors = {
  "blue": "bg-sky-500",
  "red": "bg-rose-400",
  "violet": "bg-violet-600",
  "amber": "bg-amber-600",
  "green": "bg-green-400",
  "emerald": "bg-emerald-500",
  "cyan": "bg-cyan-400",
  "fuchsia": "bg-fuchsia-400",
}

const getColor = (color: keyof typeof colors | undefined): string => {
  if (color === undefined) {
    const values = Object.values(colors);
    return values[values.length * Math.random() << 0];
  }

  return colors[color]
}

export const SessionTag: FC<SessionTagProps> = (props) => {
  return (
    <Badge className={"hover:transition hover:scale-110 text-white " + getColor(props.color)}>{props.value}</Badge>
  )
}
