"use client";
import { AuthProvider } from "@/app/clerk-provider";
import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { Input } from "@/components/shadcn/input";
import { cn } from "@/lib/utils";
import * as Clerk from "@clerk/elements/common";
import * as SignUp from "@clerk/elements/sign-up";
import { DiscordLogoIcon } from "@radix-ui/react-icons";
import { CheckCircle, Clock, Github, LoaderCircle, Users } from "lucide-react";
import Image from "next/image";

type IconProps = React.HTMLAttributes<SVGElement>;

const GoogleIcon = (props: IconProps) => (
  <svg role="img" viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
    />
  </svg>
);

export default function SignUpPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen">
        <div className="flex min-h-screen items-center justify-center">
          <div className="hidden lg:flex  lg:flex-col lg:justify-center lg:px-8 xl:px-12 items-center">
            <div className="w-full max-w-lg">
              <div className="text-center mb-12">
                <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full  shadow-lg">
                  <Image
                    src="/logo.png"
                    alt="Nowaster Logo"
                    className="h-12 w-12"
                    width={48}
                    height={48}
                  />
                </div>
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Start Tracking Today
                </h1>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                  Join users who are already tracking their time with{" "}
                  <span className="font-semibold text-accent">Nowaster</span>
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
                      <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Easy Time Tracking
                    </h3>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">
                      Start and stop timers with one click. Track your work
                      across multiple projects effortlessly.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Detailed Reports
                    </h3>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">
                      Get insights into your productivity with comprehensive
                      analytics and beautiful charts.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
                      <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      Team Collaboration
                    </h3>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">
                      Share projects with your team and track collective
                      progress in real-time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
            <div className="mx-auto w-full max-w-sm lg:w-96">
              <SignUp.Root>
                <Clerk.Loading>
                  {(isGlobalLoading) => (
                    <>
                      <SignUp.Step name="start">
                        <div className="mb-8 lg:hidden text-center">
                          <div className="mx-auto mb-4 flex gap-2 h-16 w-16 items-center justify-center rounded-full">
                            <Image
                              src="/logo.png"
                              alt="Nowaster Logo"
                              className="h-10 w-10"
                              width={40}
                              height={40}
                            />
                            <span className="font-bold text-2xl">Nowaster</span>
                          </div>
                        </div>

                        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
                          <CardHeader className="space-y-1 pb-6">
                            <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">
                              Create your account
                            </CardTitle>
                            <CardDescription className="text-center text-gray-600 dark:text-gray-300">
                              Get started with your free{" "}
                              <span className="font-semibold text-accent">
                                Nowaster{" "}
                              </span>
                              account
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid gap-3">
                              <Clerk.Connection name="github" asChild>
                                <Button
                                  variant="outline"
                                  type="button"
                                  disabled={isGlobalLoading}
                                  className="w-full justify-center py-3 text-sm font-medium transition-all duration-200 hover:shadow-md hover:scale-[1.02] border-gray-300 dark:border-gray-600"
                                >
                                  <Clerk.Loading scope="provider:github">
                                    {(isLoading) =>
                                      isLoading ? (
                                        <LoaderCircle className="size-4 animate-spin" />
                                      ) : (
                                        <>
                                          <Github className="mr-2 size-4" />
                                          Continue with GitHub
                                        </>
                                      )
                                    }
                                  </Clerk.Loading>
                                </Button>
                              </Clerk.Connection>

                              <Clerk.Connection name="discord" asChild>
                                <Button
                                  variant="outline"
                                  type="button"
                                  disabled={isGlobalLoading}
                                  className="w-full justify-center py-3 text-sm font-medium transition-all duration-200 hover:shadow-md hover:scale-[1.02] border-gray-300 dark:border-gray-600"
                                >
                                  <Clerk.Loading scope="provider:discord">
                                    {(isLoading) =>
                                      isLoading ? (
                                        <LoaderCircle className="size-4 animate-spin" />
                                      ) : (
                                        <>
                                          <DiscordLogoIcon className="mr-2 size-4" />
                                          Continue with Discord
                                        </>
                                      )
                                    }
                                  </Clerk.Loading>
                                </Button>
                              </Clerk.Connection>

                              <Clerk.Connection name="google" asChild>
                                <Button
                                  variant="outline"
                                  type="button"
                                  disabled={isGlobalLoading}
                                  className="w-full justify-center py-3 text-sm font-medium transition-all duration-200 hover:shadow-md hover:scale-[1.02] border-gray-300 dark:border-gray-600"
                                >
                                  <Clerk.Loading scope="provider:google">
                                    {(isLoading) =>
                                      isLoading ? (
                                        <LoaderCircle className="size-4 animate-spin" />
                                      ) : (
                                        <>
                                          <GoogleIcon className="mr-2 size-4" />
                                          Continue with Google
                                        </>
                                      )
                                    }
                                  </Clerk.Loading>
                                </Button>
                              </Clerk.Connection>
                            </div>
                          </CardContent>
                          <CardFooter className="pt-6">
                            <div className="w-full text-center">
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Already have an account?{" "}
                                <Clerk.Link
                                  navigate="sign-in"
                                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                                >
                                  Sign in instead
                                </Clerk.Link>
                              </p>
                            </div>
                          </CardFooter>
                        </Card>
                      </SignUp.Step>

                      <SignUp.Step name="continue">
                        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 w-full max-w-sm mx-auto">
                          <CardHeader className="space-y-1 pb-6">
                            <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">
                              Complete your profile
                            </CardTitle>
                            <CardDescription className="text-center text-gray-600 dark:text-gray-300">
                              Choose a username to personalize your account
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Clerk.Field name="username" className="space-y-2">
                              <Clerk.Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Username
                              </Clerk.Label>
                              <Clerk.Input
                                type="text"
                                required
                                asChild
                                className="w-full"
                              >
                                <Input
                                  placeholder="Enter your username"
                                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </Clerk.Input>
                              <Clerk.FieldError className="block text-sm text-red-600 dark:text-red-400" />
                            </Clerk.Field>
                          </CardContent>
                          <CardFooter>
                            <SignUp.Action submit asChild>
                              <Button
                                disabled={isGlobalLoading}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                              >
                                <Clerk.Loading>
                                  {(isLoading) => {
                                    return isLoading ? (
                                      <LoaderCircle className="size-4 animate-spin" />
                                    ) : (
                                      "Create Account"
                                    );
                                  }}
                                </Clerk.Loading>
                              </Button>
                            </SignUp.Action>
                          </CardFooter>
                        </Card>
                      </SignUp.Step>

                      <SignUp.Step name="verifications">
                        <SignUp.Strategy name="email_code">
                          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 w-full max-w-sm mx-auto">
                            <CardHeader className="space-y-1 pb-6">
                              <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">
                                Verify your email
                              </CardTitle>
                              <CardDescription className="text-center text-gray-600 dark:text-gray-300">
                                We&apos;ve sent a verification code to your email
                                address
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid items-center justify-center gap-y-4">
                                <Clerk.Field name="code" className="space-y-2">
                                  <Clerk.Label className="sr-only">
                                    Verification Code
                                  </Clerk.Label>
                                  <div className="flex justify-center">
                                    <Clerk.Input
                                      type="otp"
                                      className="flex justify-center has-[:disabled]:opacity-50"
                                      autoSubmit
                                      render={({ value, status }) => {
                                        return (
                                          <div
                                            data-status={status}
                                            className={cn(
                                              "relative flex size-12 items-center justify-center border-y border-r border-input text-lg font-medium transition-all first:rounded-l-md first:border-l last:rounded-r-md bg-white dark:bg-gray-800",
                                              {
                                                "z-10 ring-2 ring-blue-500 ring-offset-background border-blue-500":
                                                  status === "cursor" ||
                                                  status === "selected",
                                              },
                                            )}
                                          >
                                            {value}
                                            {status === "cursor" && (
                                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                                <div className="animate-caret-blink h-6 w-px bg-blue-600 duration-1000" />
                                              </div>
                                            )}
                                          </div>
                                        );
                                      }}
                                    />
                                  </div>
                                  <Clerk.FieldError className="block text-center text-sm text-red-600 dark:text-red-400" />
                                </Clerk.Field>
                              </div>
                            </CardContent>
                            <CardFooter>
                              <SignUp.Action submit asChild>
                                <Button
                                  disabled={isGlobalLoading}
                                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 transition-all duration-200"
                                >
                                  <Clerk.Loading>
                                    {(isLoading) => {
                                      return isLoading ? (
                                        <LoaderCircle className="size-4 animate-spin" />
                                      ) : (
                                        "Verify & Complete Setup"
                                      );
                                    }}
                                  </Clerk.Loading>
                                </Button>
                              </SignUp.Action>
                            </CardFooter>
                          </Card>
                        </SignUp.Strategy>
                      </SignUp.Step>
                    </>
                  )}
                </Clerk.Loading>
              </SignUp.Root>
            </div>
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
