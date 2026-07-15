import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_DISCOUNT_CODES } from "@/lib/graphql/queries";
import {
  CREATE_DISCOUNT_CODE,
  UPDATE_DISCOUNT_CODE,
  DELETE_DISCOUNT_CODE,
} from "@/lib/graphql/mutations";
import { GET_COURSES } from "@/lib/graphql/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Tag, RefreshCw } from "lucide-react";

export default function SuperAdminDiscountCodes() {
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");
  const [description, setDescription] = useState("");

  const { data: coursesData } = useQuery(GET_COURSES, {
    variables: { limit: 200 },
  });

  const { data: codesData, loading, refetch } = useQuery(GET_DISCOUNT_CODES, {
    variables: { courseId: selectedCourseId || undefined, limit: 100 },
    skip: !selectedCourseId,
  });

  const [createCode, { loading: creating }] = useMutation(CREATE_DISCOUNT_CODE, {
    onCompleted: () => {
      toast.success("Discount code created!");
      refetch();
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const [deleteCode, { loading: deleting }] = useMutation(DELETE_DISCOUNT_CODE, {
    onCompleted: () => {
      toast.success("Discount code deleted");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setCode("");
    setDiscountType("percentage");
    setDiscountValue("");
    setMaxUses("1");
    setExpiresAt("");
    setDescription("");
    setShowForm(false);
  };

  const handleCreate = () => {
    if (!code.trim() || !discountValue) {
      toast.error("Code and discount value are required");
      return;
    }
    createCode({
      variables: {
        code: code.trim().toUpperCase(),
        courseId: selectedCourseId,
        discountType,
        discountValue: parseFloat(discountValue),
        maxUses: parseInt(maxUses) || 1,
        expiresAt: expiresAt || null,
        description: description || null,
      },
    });
  };

  const courses = coursesData?.courses?.items || [];
  const discountCodes = codesData?.discountCodes?.items || [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-widest flex items-center gap-3">
            <Tag className="w-6 h-6 text-accent" />
            Discount Codes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and manage discount codes per course
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Course Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest">
            Select Course
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                <SelectTrigger className="h-12 bg-muted/20 border-border/50 rounded-xl">
                  <SelectValue placeholder="Choose a course to manage codes" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title} — {c.price === 0 ? "Free" : `${c.price} RWF`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedCourseId && (
              <Button
                variant="gold"
                onClick={() => setShowForm(!showForm)}
                className="h-12 px-6 gap-2 text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
                {showForm ? "Cancel" : "New Code"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Form */}
      {showForm && selectedCourseId && (
        <Card className="border-accent/20 bg-accent/5">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-accent">
              Create Discount Code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Code *
                </Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SAVE50"
                  className="h-12 bg-background border-border/50 rounded-xl text-lg font-bold tracking-widest uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Max Uses
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  className="h-12 bg-background border-border/50 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Discount Type
                </Label>
                <Select value={discountType} onValueChange={setDiscountType}>
                  <SelectTrigger className="h-12 bg-background border-border/50 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (RWF)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {discountType === "percentage" ? "Percentage (%) *" : "Amount (RWF) *"}
                </Label>
                <Input
                  type="number"
                  min="0"
                  max={discountType === "percentage" ? "100" : undefined}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === "percentage" ? "e.g. 50" : "e.g. 5000"}
                  className="h-12 bg-background border-border/50 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Expires At (Optional)
                </Label>
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="h-12 bg-background border-border/50 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Description (Optional)
                </Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Internal note about this code"
                  className="h-12 bg-background border-border/50 rounded-xl"
                />
              </div>
            </div>

            <Button
              variant="gold"
              onClick={handleCreate}
              disabled={creating}
              className="w-full h-12 gap-2 text-xs font-bold"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {creating ? "Creating..." : "Create Discount Code"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Codes List */}
      {selectedCourseId && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            {discountCodes.length} Discount Code{discountCodes.length !== 1 ? "s" : ""}
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : discountCodes.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-border/20 rounded-2xl">
              <Tag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-sm font-bold text-muted-foreground/60">
                No discount codes for this course yet
              </p>
              <p className="text-xs text-muted-foreground/40 mt-1">
                Click "New Code" to create one
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {discountCodes.map((dc: any) => (
                <div
                  key={dc.id}
                  className="flex items-center justify-between p-5 rounded-2xl border border-border/40 bg-muted/20 hover:border-accent/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Tag className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-lg font-black tracking-widest text-foreground">
                          {dc.code}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            dc.isActive
                              ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/30"
                              : "text-red-400 bg-red-400/10 border-red-400/30"
                          }
                        >
                          {dc.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {dc.discountType === "percentage"
                            ? `${dc.discountValue}% off`
                            : `${dc.discountValue} RWF off`}
                        </span>
                        <span>
                          Used {dc.currentUses}/{dc.maxUses} times
                        </span>
                        {dc.expiresAt && (
                          <span>
                            Expires {new Date(dc.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {dc.description && (
                      <span className="text-[10px] text-muted-foreground/50 max-w-[200px] truncate">
                        {dc.description}
                      </span>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 rounded-xl hover:bg-destructive/10 text-destructive hover:text-destructive"
                      onClick={() => deleteCode({ variables: { id: dc.id } })}
                      disabled={deleting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}