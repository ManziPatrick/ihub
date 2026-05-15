import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_BRANDING } from "@/lib/graphql/queries";
import { UPDATE_BRANDING } from "@/lib/graphql/mutations";
import { toast } from "sonner";
import { Palette, Save, Layout, Type, Image as ImageIcon, Globe, Sparkles, Eye, RotateCcw, Award } from "lucide-react";

export default function AdminBranding() {
  const { data, loading } = useQuery(GET_BRANDING);
  const [updateBranding, { loading: updating }] = useMutation(UPDATE_BRANDING, {
    refetchQueries: [{ query: GET_BRANDING }],
  });

  const [formData, setFormData] = useState({
    primaryColor: "#C9A24D",
    secondaryColor: "#2B2B2D",
    accentColor: "#C9A24D",
    logoUrl: "",
    siteName: "MultiCourses",
    portalTitle: "Academy Hub",
    signerName: "Patrick Manzi",
    signerSignature: ""
  });

  useEffect(() => {
    const branding = (data as any)?.branding;
    if (branding) {
      setFormData(prev => ({
        ...prev,
        primaryColor: branding.primaryColor || "#BC9229",
        secondaryColor: branding.secondaryColor || "#E6B94D",
        accentColor: branding.accentColor || "#BC9229",
        logoUrl: branding.logoUrl || "",
        siteName: branding.siteName || "MultiCourses",
        portalTitle: branding.portalTitle || "Academy Hub",
        signerName: prev.signerName,
        signerSignature: prev.signerSignature
      }));
    }
    
    // Fetch certificate signer settings via REST
    fetch('/api/certificates/signer-settings', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.signerName || data.signerSignature) {
            setFormData(prev => ({
                ...prev,
                signerName: data.signerName || "Patrick Manzi",
                signerSignature: data.signerSignature || ""
            }));
        }
    })
    .catch(err => console.error("Failed to fetch signer settings", err));
  }, [data]);

  const handleSave = async () => {
    try {
      await updateBranding({
        variables: { 
            primaryColor: formData.primaryColor,
            secondaryColor: formData.secondaryColor,
            accentColor: formData.accentColor,
            logoUrl: formData.logoUrl,
            siteName: formData.siteName,
            portalTitle: formData.portalTitle
        }
      });
      
      // Save signer settings via REST
      await fetch('/api/certificates/signer-settings', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
              signerName: formData.signerName,
              signerSignature: formData.signerSignature
          })
      });
      
      toast.success("Branding and Certificate settings updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update settings");
    }
  };

  if (loading) return null;

  return (
    <PortalLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/50 pb-6"
        >
          <div>
            <h1 className="font-heading text-3xl font-medium text-foreground flex items-center gap-3">
              <Palette className="w-8 h-8 text-primary" />
              Brand Configuration
            </h1>
            <p className="text-muted-foreground mt-1">
              Maintain visual consistency across the entire platform
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setFormData({
                primaryColor: "#C9A24D",
                secondaryColor: "#2B2B2D",
                accentColor: "#C9A24D",
                logoUrl: "",
                siteName: "MultiCourses",
                portalTitle: "Academy Hub",
                signerName: "Patrick Manzi",
                signerSignature: ""
              })}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <Button variant="gold" onClick={handleSave} disabled={updating} className="shadow-lg shadow-primary/20">
              <Save className="w-4 h-4 mr-2" />
              {updating ? "Saving..." : "Apply Changes"}
            </Button>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Identity Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Globe className="w-5 h-5 text-primary" />
                <h3 className="font-heading text-xl font-medium">Core Identity</h3>
              </div>
              <Card className="border-border/50 shadow-sm overflow-hidden">
                <CardContent className="p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Platform Name</label>
                      <Input 
                        value={formData.siteName} 
                        onChange={(e) => setFormData({...formData, siteName: e.target.value})}
                        placeholder="e.g. MultiCourses"
                        className="bg-muted/30"
                      />
                      <p className="text-xs text-muted-foreground">This appears in the header and copyright sections.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Portal Subtitle</label>
                      <Input 
                        value={formData.portalTitle} 
                        onChange={(e) => setFormData({...formData, portalTitle: e.target.value})}
                        placeholder="e.g. Academy Hub"
                        className="bg-muted/30"
                      />
                      <p className="text-xs text-muted-foreground">Used for the dashboard and internal portal pages.</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Logo URL</label>
                    <div className="flex gap-2">
                      <Input 
                        value={formData.logoUrl} 
                        onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
                        placeholder="https://..."
                        className="bg-muted/30"
                      />
                      <div className="p-2 border border-border rounded-md bg-white dark:bg-black/20 flex items-center justify-center w-12 shrink-0">
                        {formData.logoUrl ? <img src={formData.logoUrl} className="max-h-6 w-auto" /> : <ImageIcon className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Visual Style Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-heading text-xl font-medium">Visual Aesthetics</h3>
              </div>
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-6 space-y-8">
                   <div className="space-y-4">
                     <label className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Global Brand Color</label>
                     <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                          { name: 'Academic Gold', color: '#BC9229' },
                          { name: 'Oxford Blue', color: '#002147' },
                          { name: 'Royal Purple', color: '#6A0DAD' },
                          { name: 'Forest Green', color: '#013220' },
                          { name: 'Modern Indigo', color: '#6366F1' },
                          { name: 'Slate Gray', color: '#1E293B' },
                        ].map((preset) => (
                          <button
                            key={preset.color}
                            onClick={() => setFormData({ ...formData, primaryColor: preset.color, accentColor: preset.color })}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all group ${
                              formData.primaryColor === preset.color 
                              ? "border-primary bg-primary/5 shadow-md" 
                              : "border-border/30 hover:border-border hover:bg-muted/50"
                            }`}
                          >
                            <div className="w-full h-8 rounded-md shadow-inner" style={{ backgroundColor: preset.color }} />
                            <span className="text-[10px] font-medium uppercase tracking-tight text-center">{preset.name}</span>
                          </button>
                        ))}
                     </div>
                   </div>

                   <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-border/50">
                     <div className="space-y-4">
                        <label className="text-sm font-medium">Custom Primary Color</label>
                        <div className="flex gap-3">
                          <div className="relative group">
                            <input 
                              type="color"
                              value={formData.primaryColor}
                              onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                            />
                            <div 
                              className="w-14 h-12 rounded-xl border border-border shadow-md transition-transform active:scale-95 flex items-center justify-center overflow-hidden" 
                              style={{ backgroundColor: formData.primaryColor }}
                            >
                              <div className="w-full h-1/2 mt-auto bg-black/10 backdrop-blur-sm flex items-center justify-center">
                                <Palette className="w-3 h-3 text-white/80" />
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 space-y-1">
                            <Input 
                              value={formData.primaryColor} 
                              onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                              className="font-mono uppercase"
                            />
                            <p className="text-[10px] text-muted-foreground">Affects buttons, icons, and menus.</p>
                          </div>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <label className="text-sm font-medium">Gradient/Secondary Color</label>
                        <div className="flex gap-3">
                        <div className="relative group">
                            <input 
                              type="color"
                              value={formData.secondaryColor}
                              onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                            />
                            <div 
                              className="w-14 h-12 rounded-xl border border-border shadow-md transition-transform active:scale-95 flex items-center justify-center overflow-hidden" 
                              style={{ backgroundColor: formData.secondaryColor }}
                            >
                              <div className="w-full h-1/2 mt-auto bg-black/10 backdrop-blur-sm flex items-center justify-center">
                                <Sparkles className="w-3 h-3 text-white/80" />
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 space-y-1">
                            <Input 
                              value={formData.secondaryColor} 
                              onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                              className="font-mono uppercase"
                            />
                            <p className="text-[10px] text-muted-foreground">Used for subtle gradients and backgrounds.</p>
                          </div>
                        </div>
                     </div>
                   </div>
                </CardContent>
              </Card>
            </section>

            {/* Certificate Settings Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <Award className="w-5 h-5 text-primary" />
                <h3 className="font-heading text-xl font-medium">Certification Settings</h3>
              </div>
              <Card className="border-border/50 shadow-sm overflow-hidden">
                <CardContent className="p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Default Authorized Signatory</label>
                      <Input 
                        value={formData.signerName} 
                        onChange={(e) => setFormData({...formData, signerName: e.target.value})}
                        placeholder="e.g. Patrick Manzi"
                        className="bg-muted/30"
                      />
                      <p className="text-xs text-muted-foreground">The name that appears on all auto-generated certificates.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Signature Image URL</label>
                      <div className="flex gap-2">
                        <Input 
                          value={formData.signerSignature} 
                          onChange={(e) => setFormData({...formData, signerSignature: e.target.value})}
                          placeholder="https://..."
                          className="bg-muted/30"
                        />
                        <div className="p-2 border border-border rounded-md bg-white flex items-center justify-center w-12 shrink-0">
                          {formData.signerSignature ? <img src={formData.signerSignature} className="max-h-6 w-auto" /> : <Palette className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Transparent PNG recommended for signatures.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>

          {/* Preview Aside */}
          <div className="space-y-4">
              <div className="flex items-center gap-2 px-1 sticky top-24">
                <Eye className="w-5 h-5 text-primary" />
                <h3 className="font-heading text-xl font-medium">Live Preview</h3>
              </div>
              <div className="sticky top-32 space-y-6">
                <div 
                  className="rounded-2xl border-2 border-border/50 bg-background overflow-hidden shadow-2xl transition-all duration-500"
                >
                  <div className="h-12 border-b border-border/50 bg-card px-4 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] text-white font-bold" style={{ backgroundColor: formData.primaryColor }}>≪</div>
                       <span className="text-xs font-bold" style={{ color: formData.primaryColor }}>{formData.siteName}</span>
                     </div>
                     <div className="flex gap-2">
                        <div className="w-4 h-4 rounded-full bg-muted" />
                        <div className="w-8 h-4 rounded-full" style={{ backgroundColor: formData.primaryColor }} />
                     </div>
                  </div>
                  <div className="p-6 space-y-6 bg-muted/20">
                    <div className="space-y-2">
                       <div className="h-2 w-12 rounded bg-primary/20" />
                       <h4 className="text-xl font-heading font-semibold leading-tight">
                         Transforming Lives Through <span style={{ color: formData.primaryColor }}>Quality Tech Education</span>
                       </h4>
                       <div className="space-y-1">
                         <div className="h-1 w-full rounded bg-muted-foreground/10" />
                         <div className="h-1 w-2/3 rounded bg-muted-foreground/10" />
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <Card className="p-3 border-none shadow-sm bg-card">
                         <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center mb-2">
                           <Layout className="w-3 h-3 text-primary" style={{ color: formData.primaryColor }} />
                         </div>
                         <div className="h-1 w-10 rounded bg-muted-foreground/20 mb-1" />
                         <div className="h-1 w-6 rounded bg-muted-foreground/10" />
                       </Card>
                       <Card className="p-3 border-none shadow-sm bg-card">
                         <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center mb-2">
                           <Type className="w-3 h-3 text-primary" style={{ color: formData.primaryColor }} />
                         </div>
                         <div className="h-1 w-10 rounded bg-muted-foreground/20 mb-1" />
                         <div className="h-1 w-6 rounded bg-muted-foreground/10" />
                       </Card>
                    </div>
                    <Button className="w-full text-xs h-9 font-bold" style={{ backgroundColor: formData.primaryColor }}>
                       Enroll Now
                    </Button>
                  </div>
                </div>

                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
                   <p className="text-xs text-muted-foreground leading-relaxed">
                     <span className="font-bold text-primary block mb-1">💡 Design Tip</span>
                     Using a rich, deep primary color enhances the professional look of the academy portal. The Academic Gold is recommended for tech education platforms.
                   </p>
                </div>
              </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
