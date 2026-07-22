import { AvatarShowcaseCarousel } from "@/components/pages/AvatarShowcaseCarousel";
import { SiteFooter } from "@/components/pages/site-footer";
import { SiteHeader } from "@/components/pages/site-header";
import { TestimonialAvatar } from "@/components/pages/TestimonialAvatar";
import { Button } from "@/components/shadcn/button";
import { StopwatchIcon } from "@radix-ui/react-icons";
import { CheckCircle, Clock, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import dashboardScreenshot from "@/public/screenshot-dashboard.png";
import Link from "next/link";

export const metadata: Metadata = {
  description:
    "Effortlessly track time, manage projects, and analyze productivity with our intuitive time tracking solution.",
  title: "Nowaster - Time Tracking Made Easy",
};

export default async function LandingPage() {
  return (
    <>
      <SiteHeader />
      <div className="flex flex-col min-h-screen">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-40 bg-linear-to-b from-background to-muted">
          <div className="px-4 md:px-6 grid gap-10 md:grid-cols-1 lg:grid-cols-[1fr_640px] lg:gap-12 xl:grid-cols-[1fr_760px] max-w-7xl mx-auto items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Every hour, twice over.
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Log your time once. Get a dashboard that breaks it down —
                  and a personal avatar that grows from it.
                </p>
              </div>

              <Link href="/sign-in">
                <Button className="flex items-center justify-center gap-1 group">
                  <StopwatchIcon className="group-hover:scale-110" />
                  <p>Start tracking now</p>
                </Button>
              </Link>
              <Link href="https://www.sandbox.nowaster.app/sign-in" target="_blank">
                <Button variant="outline">
                  No account? Try the sandbox as a guest →
                </Button>
              </Link>
            </div>

            <div className="flex items-center justify-center">
              <Image
                alt="Nowaster time tracking dashboard"
                className="rounded-2xl border shadow-lg"
                placeholder="blur"
                priority
                sizes="(max-width: 1024px) 100vw, 760px"
                src={dashboardScreenshot}
              />
            </div>
          </div>
        </section>

        <section
          className="w-full py-12 md:py-24 lg:py-32 bg-background"
          id="avatar"
        >
          <div className="px-4 md:px-6 max-w-6xl mx-auto">
            <h2 className="text-center text-3xl font-bold tracking-tighter md:text-4xl/tight">
              A character built from what you actually did
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
              Pick your avatar&apos;s look once. The scene around them
              updates every week, built from whatever took up most of your
              time.
            </p>

            <AvatarShowcaseCarousel />
          </div>
        </section>

        {/* How It Works */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  How It Works
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Sign up, track your time, and watch your dashboard — and
                  your avatar — take shape.
                </p>
              </div>
            </div>
            <div className="relative mx-auto grid max-w-5xl gap-8 py-12 md:grid-cols-3">
              <div className="absolute top-24 left-[16.6%] right-[16.6%] hidden h-px bg-border md:block" />

              <div className="relative flex flex-col items-center space-y-4 text-center">
                <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full border-4 border-muted bg-primary text-primary-foreground shadow-md">
                  <UserPlus className="h-9 w-9" />
                </div>
                <h3 className="text-xl font-bold">Sign Up</h3>
                <p className="text-muted-foreground">
                  Create your account and pick your avatar&apos;s look once.
                </p>
              </div>
              <div className="relative flex flex-col items-center space-y-4 text-center">
                <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full border-4 border-muted bg-primary text-primary-foreground shadow-md">
                  <Clock className="h-9 w-9" />
                </div>
                <h3 className="text-xl font-bold">Track Time</h3>
                <p className="text-muted-foreground">
                  Log hours against categories as you go about your week.
                </p>
              </div>
              <div className="relative flex flex-col items-center space-y-4 text-center">
                <div className="relative z-10 h-24 w-24 overflow-hidden rounded-full border-4 border-muted shadow-md">
                  <Image
                    alt="A Nowaster avatar scene"
                    className="h-full w-full object-cover"
                    height={96}
                    src="/avatars/avatar-02-thumb.jpg"
                    width={96}
                  />
                </div>
                <h3 className="text-xl font-bold">See Your Week</h3>
                <p className="text-muted-foreground">
                  Dashboards update instantly. Your avatar&apos;s scene
                  updates every week.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          className="w-full py-12 md:py-24 lg:py-32 bg-background"
          id="pricing"
        >
          <div className="px-4 md:px-6">
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
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted gradient-container">
          <div className="px-4 md:px-6">
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
                  <TestimonialAvatar
                    avatarFile="avatar-04.jpg"
                    fallback="D"
                    name="d3jv"
                  />
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
                  <TestimonialAvatar
                    avatarFile="avatar-05.jpg"
                    fallback="I"
                    name="izmi"
                  />
                  <div>
                    <h4 className="font-bold">izmi</h4>
                    <p className="text-sm text-muted-foreground">
                      Software Engineer @ RedHat
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
                  <TestimonialAvatar
                    avatarFile="avatar-06.jpg"
                    fallback="K"
                    name="Kobu"
                  />
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

        <section className="w-full py-12 md:py-24 lg:py-32 gradient-card text-foreground">
          <div className="px-4 md:px-6">
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
                <Link href="/sign-in">
                  <Button>
                    <p>Start your journey now</p>
                  </Button>
                </Link>
                <Link href="https://www.sandbox.nowaster.app/sign-in" target="_blank">
                  <Button variant="outline">
                    No account? Try the sandbox as a guest →
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
      <SiteFooter />
    </>
  );
}
