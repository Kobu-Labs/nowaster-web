"use client";

import { Button } from "@/components/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/card";
import { env } from "@/env";
import { DiscordLogoIcon } from "@radix-ui/react-icons";
import { Github } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type IconProps = React.HTMLAttributes<SVGElement>;

const GoogleIcon = (props: IconProps) => (
  <svg role="img" viewBox="0 0 24 24" {...props}>
    <path
      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
      fill="currentColor"
    />
  </svg>
);

export default function SignInPage() {
  const handleOAuthLogin = (provider: "discord" | "github" | "google") => {
    const authUrl = `${env.NEXT_PUBLIC_API_URL}/auth/oauth/${provider}`;
    globalThis.location.href = authUrl;
  };

  return (
    <div className="min-h-screen">
      <div className="flex flex-col md:flex-row min-h-screen items-center justify-center">
        {/* Left side - Branding */}
        <div className="flex flex-col justify-center lg:px-8 xl:px-12 items-center">
          <div className="w-full max-w-sm">
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full shadow-lg">
                <Image
                  alt="Nowaster Logo"
                  className="h-12 w-12"
                  height={48}
                  src="/logo.png"
                  width={48}
                />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                Welcome Back
              </h1>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                Track your time efficiently with
                <span className="font-semibold text-accent"> Nowaster</span>
              </p>
              <div className="mt-8 space-y-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center justify-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span>Simple time tracking</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span>Detailed analytics</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                  <span>Team collaboration</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
            <div className="mx-auto w-full max-w-sm lg:w-96">
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm dark:bg-gray-800/80">
                <CardHeader className="space-y-1 pb-6">
                  <CardTitle className="text-2xl font-bold text-center text-gray-900 dark:text-white">
                    Sign in to your account
                  </CardTitle>
                  <CardDescription className="text-center text-gray-600 dark:text-gray-300">
                    Choose your preferred sign-in method
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3">
                    <Button
                      className="w-full justify-center py-3 text-sm font-medium transition-all duration-200 hover:shadow-md hover:scale-[1.02] border-gray-300 dark:border-gray-600"
                      onClick={() => handleOAuthLogin("github")}
                      type="button"
                      variant="outline"
                    >
                      <Github className="mr-2 size-4" />
                      Continue with GitHub
                    </Button>

                    <Button
                      className="w-full justify-center py-3 text-sm font-medium transition-all duration-200 hover:shadow-md hover:scale-[1.02] border-gray-300 dark:border-gray-600"
                      onClick={() => handleOAuthLogin("discord")}
                      type="button"
                      variant="outline"
                    >
                      <DiscordLogoIcon className="mr-2 size-4" />
                      Continue with Discord
                    </Button>

                    <Button
                      className="w-full justify-center py-3 text-sm font-medium transition-all duration-200 hover:shadow-md hover:scale-[1.02] border-gray-300 dark:border-gray-600"
                      onClick={() => handleOAuthLogin("google")}
                      type="button"
                      variant="outline"
                    >
                      <GoogleIcon className="mr-2 size-4" />
                      Continue with Google
                    </Button>
                  </div>
                </CardContent>
                <CardFooter className="pt-6">
                  <div className="w-full text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Don&apos;t have an account?
                      <Link
                        className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200 ml-1"
                        href="/"
                      >
                        Sign up for free
                      </Link>
                    </p>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
