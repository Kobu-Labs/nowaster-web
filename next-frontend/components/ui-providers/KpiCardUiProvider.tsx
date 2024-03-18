import { FC } from "react"
import { VariantProps, cva } from "class-variance-authority"

import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card"

interface KpiCardUiProviderProps extends VariantProps<typeof cardVariants> {
  value: string | number
  title: string
  description?: string
  children?: React.ReactNode
}

const cardVariants = cva(
  "font-bold group-hover:scale-y-125 group-hover:text-pink-300 group-hover:transition",
  {
    variants: {
      variant: {
        default: "text-2xl ",
        big_value: "flex text-7xl grow items-center justify-center",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/* TODO: this should be refactored into separate components using forward ref to extend Card.* component */
export const KpiCardUiProvider: FC<KpiCardUiProviderProps> = (props) => {
  return (
    <Card className="group flex grow flex-col hover:cursor-pointer hover:bg-accent hover:text-accent-foreground">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{props.title}</CardTitle>
        <div>{props.children}</div>
      </CardHeader>
      <CardContent className={cn(cardVariants({ variant: props.variant }))}>
        {props.value}
      </CardContent>
      {props.description && (
        <CardFooter>
          <p className="text-xs text-muted-foreground">{props.description}</p>
        </CardFooter>
      )}
    </Card>
  )
}
