
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/sonner';

interface LoginFormInputs {
  email: string;
  password: string;
}

interface SignupFormInputs extends LoginFormInputs {
  username: string;
  confirmPassword: string;
}

const LoginPage: React.FC = () => {
  const { login, signup, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('login');
  
  const loginForm = useForm<LoginFormInputs>();
  const signupForm = useForm<SignupFormInputs>();

  const onLoginSubmit = async (data: LoginFormInputs) => {
    try {
      await login(data.email, data.password);
    } catch (error) {
      // Error is already handled in the auth context
      console.error("Login failed:", error);
    }
  };

  const onSignupSubmit = async (data: SignupFormInputs) => {
    try {
      if (data.password !== data.confirmPassword) {
        signupForm.setError('confirmPassword', {
          type: 'manual',
          message: 'Las contraseñas no coinciden'
        });
        return;
      }
      
      await signup(data.email, data.password, data.username);
      setActiveTab('login');
      signupForm.reset();
      toast.success('Cuenta creada. Por favor inicia sesión.');
    } catch (error) {
      // Error is already handled in the auth context
      console.error("Signup failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">LuneStock</h1>
          <p className="text-gray-600 mt-2">Gestión de inventario y ventas</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Acceso al Sistema</CardTitle>
            <CardDescription>
              Ingrese sus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      {...loginForm.register("email", { 
                        required: "El email es requerido",
                        pattern: {
                          value: /\S+@\S+\.\S+/,
                          message: "Email inválido"
                        }
                      })}
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-red-500">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <Input
                      id="login-password"
                      type="password"
                      {...loginForm.register("password", { 
                        required: "La contraseña es requerida",
                        minLength: {
                          value: 6,
                          message: "La contraseña debe tener al menos 6 caracteres"
                        }
                      })}
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Iniciando sesión...
                      </span>
                    ) : (
                      'Iniciar Sesión'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={signupForm.handleSubmit(onSignupSubmit)}>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Nombre de Usuario</Label>
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="usuario"
                      {...signupForm.register("username", { 
                        required: "El nombre de usuario es requerido",
                        minLength: {
                          value: 3,
                          message: "El nombre debe tener al menos 3 caracteres"
                        }
                      })}
                    />
                    {signupForm.formState.errors.username && (
                      <p className="text-sm text-red-500">{signupForm.formState.errors.username.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="correo@ejemplo.com"
                      {...signupForm.register("email", { 
                        required: "El email es requerido",
                        pattern: {
                          value: /\S+@\S+\.\S+/,
                          message: "Email inválido"
                        }
                      })}
                    />
                    {signupForm.formState.errors.email && (
                      <p className="text-sm text-red-500">{signupForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      {...signupForm.register("password", { 
                        required: "La contraseña es requerida",
                        minLength: {
                          value: 6,
                          message: "La contraseña debe tener al menos 6 caracteres"
                        }
                      })}
                    />
                    {signupForm.formState.errors.password && (
                      <p className="text-sm text-red-500">{signupForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirmar Contraseña</Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      {...signupForm.register("confirmPassword", { 
                        required: "Confirme su contraseña",
                        validate: value => value === signupForm.getValues('password') || "Las contraseñas no coinciden"
                      })}
                    />
                    {signupForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-500">{signupForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Registrando...
                      </span>
                    ) : (
                      'Registrarse'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
