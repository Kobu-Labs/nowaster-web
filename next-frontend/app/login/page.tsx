"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/tabs";
import { LoginForm } from "@/components/visualizers/LoginForm";
import { RegisterForm } from "@/components/visualizers/RegisterForm";


export default function LoginPage() {
  return (
    <div className="mt-24 flex items-center justify-center">
      <Tabs defaultValue="login" className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <LoginForm></LoginForm>
        </TabsContent>
        <TabsContent value="register">
          <RegisterForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
