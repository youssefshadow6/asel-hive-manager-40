
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

interface AuthPageProps {
  language: 'en' | 'ar';
}

export const AuthPage = ({ language }: AuthPageProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });
  const { toast } = useToast();

  const translations = {
    en: {
      signIn: "Sign In",
      signUp: "Sign Up",
      forgotPassword: "Forgot Password",
      email: "Email",
      password: "Password",
      fullName: "Full Name",
      dontHaveAccount: "Don't have an account?",
      alreadyHaveAccount: "Already have an account?",
      backToLogin: "Back to Login",
      resetPassword: "Reset Password",
      sendResetLink: "Send Reset Link",
      signInSuccess: "Signed in successfully!",
      signUpSuccess: "Account created successfully!",
      resetLinkSent: "Password reset link sent to your email!",
      invalidCredentials: "Invalid email or password",
      emailRequired: "Email is required",
      passwordRequired: "Password is required",
      weakPassword: "Password should be at least 6 characters",
      emailAlreadyExists: "An account with this email already exists"
    },
    ar: {
      signIn: "تسجيل الدخول",
      signUp: "إنشاء حساب",
      forgotPassword: "نسيت كلمة المرور",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      fullName: "الاسم الكامل",
      dontHaveAccount: "ليس لديك حساب؟",
      alreadyHaveAccount: "لديك حساب بالفعل؟",
      backToLogin: "العودة لتسجيل الدخول",
      resetPassword: "إعادة تعيين كلمة المرور",
      sendResetLink: "إرسال رابط الإعادة",
      signInSuccess: "تم تسجيل الدخول بنجاح!",
      signUpSuccess: "تم إنشاء الحساب بنجاح!",
      resetLinkSent: "تم إرسال رابط إعادة تعيين كلمة المرور!",
      invalidCredentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
      emailRequired: "البريد الإلكتروني مطلوب",
      passwordRequired: "كلمة المرور مطلوبة",
      weakPassword: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
      emailAlreadyExists: "يوجد حساب بهذا البريد الإلكتروني بالفعل"
    }
  };

  const t = translations[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      toast({
        title: "Error",
        description: t.emailRequired,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/`
        });
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: t.resetLinkSent
        });
        setIsForgotPassword(false);
      } else if (isLogin) {
        if (!formData.password) {
          toast({
            title: "Error",
            description: t.passwordRequired,
            variant: "destructive"
          });
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Error",
              description: t.invalidCredentials,
              variant: "destructive"
            });
          } else {
            throw error;
          }
          return;
        }

        toast({
          title: "Success",
          description: t.signInSuccess
        });
      } else {
        if (!formData.password) {
          toast({
            title: "Error",
            description: t.passwordRequired,
            variant: "destructive"
          });
          return;
        }

        if (formData.password.length < 6) {
          toast({
            title: "Error",
            description: t.weakPassword,
            variant: "destructive"
          });
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName || formData.email
            },
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: "Error",
              description: t.emailAlreadyExists,
              variant: "destructive"
            });
          } else {
            throw error;
          }
          return;
        }

        toast({
          title: "Success",
          description: t.signUpSuccess
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            {isForgotPassword ? t.resetPassword : isLogin ? t.signIn : t.signUp}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {!isForgotPassword && (
              <div>
                <Label htmlFor="password">{t.password}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            {!isLogin && !isForgotPassword && (
              <div>
                <Label htmlFor="fullName">{t.fullName}</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  disabled={loading}
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "..." : isForgotPassword ? t.sendResetLink : isLogin ? t.signIn : t.signUp}
            </Button>

            <div className="text-center space-y-2">
              {!isForgotPassword && (
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setIsLogin(!isLogin)}
                  disabled={loading}
                  className="text-sm"
                >
                  {isLogin ? t.dontHaveAccount : t.alreadyHaveAccount} {isLogin ? t.signUp : t.signIn}
                </Button>
              )}

              {isLogin && !isForgotPassword && (
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setIsForgotPassword(true)}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {t.forgotPassword}
                </Button>
              )}

              {isForgotPassword && (
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setIsForgotPassword(false)}
                  disabled={loading}
                  className="text-sm"
                >
                  {t.backToLogin}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
