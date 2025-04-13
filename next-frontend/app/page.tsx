"use server";
import { ThemedImage } from "@/app/ThemedImage";
import { UnknownUserNavbar } from "@/app/UnknownUserNavbar";
import { GoToAppButton } from "@/components/pages/GoToAppButton";
import { SignInButton } from "@/components/pages/SignInButton";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/shadcn/avatar";
import { BarChart3, ChartArea, CheckCircle, Clock } from "lucide-react";

export default async function LandingPage() {
  return (
    <UnknownUserNavbar>
      <div className="flex flex-col min-h-screen">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-background to-muted">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Track Your Time, Boost Your Productivity
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Effortlessly track time, manage projects, and analyze
                    productivity with our intuitive time tracking solution.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <SignInButton
                    asChild
                    size="lg"
                    label="Start now"
                    variant="default"
                  />
                  <GoToAppButton
                    asChild
                    size="lg"
                    label="Start now"
                    variant="default"
                  />
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="mx-10 absolute w-full h-[300px] md:h-[400px] lg:h-[500px]">
                  <ThemedImage
                    lightUrl="/nowaster-landing-1-light.png"
                    darkUrl="/nowaster-landing-1-dark.png"
                    alt="Time tracking dashboard"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="w-full py-12 md:py-24 lg:py-32 bg-background relative"
        >
          <div className="container px-10 md:px-6 relative">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Everything you need to master your time
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our time tracking app combines powerful features with a simple
                  interface to help you stay productive.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
              <div className="flex items-center justify-center">
                <div className="mx-10 absolute w-full h-[300px] md:h-[400px] lg:h-[500px] right-96 top-36">
                  <ThemedImage
                    lightUrl="/nowaster-landing-2-light.png"
                    darkUrl="/nowaster-landing-2-dark.png"
                    alt="Time tracking dashboard"
                    fill
                    className="object-contain rounded-2xl "
                    priority
                  />
                </div>
              </div>
              <div className="flex flex-col justify-center space-y-4 m-10">
                <ul className="grid gap-6">
                  <li className="flex items-start gap-4">
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">
                        Simple Time Tracking
                      </h3>
                      <p className="text-muted-foreground">
                        Start and stop timers with a single click. Track time
                        across categories and tags effortlessly.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Detailed Reports</h3>
                      <p className="text-muted-foreground">
                        Generate comprehensive reports to analyze your
                        productivity and identify areas for improvement.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                      <ChartArea className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Extensive Charting</h3>
                      <p className="text-muted-foreground">
                        Configurable visualizations provide insights into your
                        time spending habits
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  How It Works
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Get started in minutes with our simple three-step process.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-8 py-12 md:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="text-2xl font-bold">1</span>
                </div>
                <h3 className="text-xl font-bold">Sign Up</h3>
                <p className="text-muted-foreground">
                  Create your account in seconds and set up your workspace.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="text-2xl font-bold">2</span>
                </div>
                <h3 className="text-xl font-bold">Track Time</h3>
                <p className="text-muted-foreground">
                  Start tracking your time with our intuitive timer interface.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <span className="text-2xl font-bold">3</span>
                </div>
                <h3 className="text-xl font-bold">Analyze & Improve</h3>
                <p className="text-muted-foreground">
                  Review your data and optimize your workflow for maximum
                  productivity.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="pricing"
          className="w-full py-12 md:py-24 lg:py-32 bg-background "
        >
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Simple, Transparent Pricing
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Choose the plan that works best for you and your team.
                </p>
              </div>
            </div>
            <div className="mx-auto flex items-center max-w-5xl gap-6 py-12 w-fit">
              <div className="flex flex-col rounded-lg border bg-card p-6 shadow-sm ring-2 ring-primary">
                {/* Free Plan */}
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Free</h3>
                  <p className="text-muted-foreground">
                    Perfect for individuals just getting started.
                  </p>
                </div>
                <div className="mt-4 flex items-baseline text-3xl font-bold">
                  $0
                  <span className="ml-1 text-sm font-normal text-muted-foreground">
                    /month
                  </span>
                </div>
                <ul className="mt-6 space-y-3">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Basic time tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Unlimited Categories and Tags</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span>Basic reporting</span>
                  </li>
                </ul>
                <SignInButton variant="outline" className="mt-8" asChild />
                <GoToAppButton
                  className="mt-8"
                  label="Get started"
                  variant="outline"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  What Our Users Say
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Don&apos;t just take our word for it. Here&apos;s what our
                  customers have to say.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col rounded-lg border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={undefined} alt={"d"} />
                    <AvatarFallback>{"D"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold">d3jv</h4>
                    <p className="text-sm text-muted-foreground">Student</p>
                  </div>
                </div>
                <p className="mt-4 text-muted-foreground">
                  &lsquo;I can see how much I procrastinate thanks to beautiful
                  charts.&lsquo;
                </p>
              </div>
              <div className="flex flex-col rounded-lg border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage
                      src={
                        "https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvb2F1dGhfZ29vZ2xlL2ltZ18yd0JBaEdLbThpTzdURkxQdUdZam5FcnBnR3IifQ"
                      }
                      alt={"izmi"}
                    />
                    <AvatarFallback>{"I"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold">izmi</h4>
                    <p className="text-sm text-muted-foreground">
                      Sotfware Engineer @ RedHat
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-muted-foreground">
                  &lsquo;Nowaster made me realize, how much time I was spending
                  on each activity and it gave me motivation to keep my
                  productivity high.&lsquo;
                </p>
              </div>
              <div className="flex flex-col rounded-lg border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage
                      src={
                        "https://img.clerk.com/eyJ0eXBlIjoicHJveHkiLCJzcmMiOiJodHRwczovL2ltYWdlcy5jbGVyay5kZXYvdXBsb2FkZWQvaW1nXzJ3Qm4zMGl0UkJRNTJGRHBBcExwV0c1VGFJSyJ9"
                      }
                      alt={"kobu"}
                    />
                    <AvatarFallback>{"K"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-bold">Kobu</h4>
                    <p className="text-sm text-muted-foreground">
                      Software Engineer @ Oracle
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-muted-foreground">
                  &lsquo;I made this, so I have to like it.&lsquo;
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Ready to Take Control of Your Time?
                </h2>
                <p className="max-w-[600px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Join at least 4 other professionals who have transformed their
                  productivity with our time tracking solution.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <SignInButton variant="secondary" />
                <GoToAppButton
                  label="Start your journey now"
                  variant="secondary"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </UnknownUserNavbar>
  );
}
