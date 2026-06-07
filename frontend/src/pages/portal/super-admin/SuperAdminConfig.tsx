import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PasswordInput } from "@/components/ui/PasswordInput";
import {
  Cog,
  Shield,
  Palette,
  Mail,
  CreditCard,
  Save,
  Globe,
  Bell,
  Lock,
  Database,
  Cloud,
  Zap,
  Loader2,
} from "lucide-react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_CONFIGS, GET_BRANDING } from "@/lib/graphql/queries";
import { UPDATE_CONFIG, SEND_TEST_EMAIL } from "@/lib/graphql/mutations";
import { toast } from "sonner";

export default function SuperAdminConfig() {
  const [activeTab, setActiveTab] = useState("general");
  const { data, loading, refetch } = useQuery(GET_CONFIGS);
  const [updateConfigMutation] = useMutation(UPDATE_CONFIG, {
    refetchQueries: [{ query: GET_CONFIGS }, { query: GET_BRANDING }]
  });
  const [sendTestEmail, { loading: sendingTest }] = useMutation(SEND_TEST_EMAIL);

  const handleTestEmail = async () => {
    try {
      await sendTestEmail({ variables: { to: settings.emailSender } });
      toast.success(`Test email sent to ${settings.emailSender}. Check your inbox!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to send test email");
    }
  };

  const [settings, setSettings] = useState({
    siteName: "Bootskills Academy",
    siteDescription: "Leading tech education in Rwanda.",
    contactEmail: "contact@bootskills.com",
    maintenanceMode: false,
    registrationEnabled: true,
    emailServer: "smtp.zoho.com",
    emailPort: "465",
    emailSender: "admin@bootskills.com",
    emailAppPassword: "0EN2iaThnZAz",
    paymentGateway: "Mobile Money",
    primaryColor: "#EAB308",
    darkMode: true,
    admin2FA: false,
  });

  useEffect(() => {
    const configs = (data as any)?.configs;
    if (configs) {
      const newSettings = { ...settings };
      configs.forEach((c: any) => {
        try {
          (newSettings as any)[c.key] = JSON.parse(c.value);
        } catch {
          (newSettings as any)[c.key] = c.value;
        }
      });
      setSettings(newSettings);
    }
  }, [data]);

  const handleSaveAll = async () => {
    toast.promise(
      Promise.all(Object.entries(settings).map(([key, value]) => 
        updateConfigMutation({
          variables: {
            key,
            value: typeof value === "string" ? value : JSON.stringify(value),
          }
        })
      )),
      {
        loading: 'Saving all settings...',
        success: 'All settings updated successfully!',
        error: 'Error saving settings'
      }
    );
  };

  if (loading) return <PortalLayout><div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-accent" /></div></PortalLayout>;

  return (
    <PortalLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-medium text-foreground">
              Platform Configuration
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage global settings, security, and appearance
            </p>
          </div>
          <Button variant="gold" className="shadow-lg shadow-gold/20" onClick={handleSaveAll}>
            <Save className="w-4 h-4 mr-2" />
            Save All Changes
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card border border-border/50 p-1 h-auto flex-wrap justify-start">
            <TabsTrigger value="general" className="gap-2 px-4 py-2">
              <Globe className="w-4 h-4" /> General
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2 px-4 py-2">
              <Mail className="w-4 h-4" /> Email
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2 px-4 py-2">
              <CreditCard className="w-4 h-4" /> Payments
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 px-4 py-2">
              <Shield className="w-4 h-4" /> Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <div className="grid gap-6">
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>Site Information</CardTitle>
                  <CardDescription>Basic details about your platform (Note: Site Name is also synced with Branding)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="siteName">Site Name</Label>
                      <Input 
                        id="siteName" 
                        value={settings.siteName} 
                        onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Contact Email</Label>
                      <Input 
                        id="contactEmail" 
                        value={settings.contactEmail}
                        onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siteDesc">Site Description</Label>
                    <Textarea 
                        id="siteDesc" 
                        value={settings.siteDescription}
                        onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle>System Status</CardTitle>
                  <CardDescription>Control platform availability</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Development / Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">When on, only admins and super admins can access the platform</p>
                    </div>
                    <Switch 
                        checked={settings.maintenanceMode}
                        onCheckedChange={(v) => setSettings({...settings, maintenanceMode: v})}
                    />
                  </div>
                  <Separator className="bg-border/30" />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>New Registrations</Label>
                      <p className="text-sm text-muted-foreground">Allow new users to sign up</p>
                    </div>
                    <Switch 
                        checked={settings.registrationEnabled}
                        onCheckedChange={(v) => setSettings({...settings, registrationEnabled: v})}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="email">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>SMTP Configuration</CardTitle>
                <CardDescription>Configure your email server for notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SMTP Server</Label>
                    <Input 
                        value={settings.emailServer}
                        onChange={(e) => setSettings({...settings, emailServer: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Port</Label>
                    <Input 
                        value={settings.emailPort}
                        onChange={(e) => setSettings({...settings, emailPort: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Sender Email</Label>
                    <Input 
                        type="email"
                        value={settings.emailSender}
                        onChange={(e) => setSettings({...settings, emailSender: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>App Password</Label>
                    <PasswordInput 
                        placeholder="••••••••••••"
                        value={settings.emailAppPassword || ""}
                        onChange={(e) => setSettings({...settings, emailAppPassword: e.target.value})}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Use a dedicated app-specific password if you are using Zoho or Gmail.
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto"
                  onClick={handleTestEmail}
                  disabled={sendingTest}
                >
                  <Zap className={`w-4 h-4 mr-2 ${sendingTest ? "animate-pulse" : "text-gold"}`} />
                  {sendingTest ? "Sending..." : "Test Connection"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Payment Gateways</CardTitle>
                <CardDescription>Configure how you receive payments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg border border-border/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                      <Zap className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-medium">MTN Mobile Money Rwanda</h4>
                      <p className="text-xs text-muted-foreground">Connected and Active</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure platform security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                  <div>
                    <p className="font-medium">Admin 2FA</p>
                    <p className="text-sm text-muted-foreground">Require Two-Factor Authentication for all admins</p>
                  </div>
                  <Switch 
                    checked={settings.admin2FA}
                    onCheckedChange={(v) => setSettings({...settings, admin2FA: v})}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PortalLayout>
  );
}
