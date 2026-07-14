import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { getApiBaseUrl } from "@/lib/env";

import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Loader2,
  Globe,
  Send,
  RefreshCw,
  XCircle,
  Phone,
  DollarSign,
  Info,
  Smartphone,
  Wallet,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  Banknote,
  Landmark,
  TrendingUp,
  CircleAlert,
  NotebookPen,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Bug,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRef } from "react";

// ─── Types ──────────────────────────────────────────────────────────────

interface WalletBalance {
  country: string;
  currency: string;
  balance: number;
  provider: string;
}

interface PawaPayStatus {
  connected: boolean;
  activeConfigs: number;
  countries: string[];
  supportedCountries: CountryInfo[];
  message: string | null;
}

interface CountryInfo {
  countryCode: string;
  currency: string;
  providers: ProviderInfo[];
}

interface ProviderInfo {
  providerId: string;
  name: string;
}

// ─── Currency → Country Mapping with Flags ──────────────────────────────

const CURRENCY_MAP: Record<string, { flag: string; name: string; country: string }> = {
  RWF: { flag: "🇷🇼", name: "Rwandan Franc", country: "Rwanda" },
  KES: { flag: "🇰🇪", name: "Kenyan Shilling", country: "Kenya" },
  UGX: { flag: "🇺🇬", name: "Ugandan Shilling", country: "Uganda" },
  TZS: { flag: "🇹🇿", name: "Tanzanian Shilling", country: "Tanzania" },
  GHS: { flag: "🇬🇭", name: "Ghanaian Cedi", country: "Ghana" },
  NGN: { flag: "🇳🇬", name: "Nigerian Naira", country: "Nigeria" },
  ZMW: { flag: "🇿🇲", name: "Zambian Kwacha", country: "Zambia" },
  XAF: { flag: "🇨🇲", name: "CFA Franc BEAC", country: "Cameroon" },
  XOF: { flag: "🇨🇮", name: "CFA Franc BCEAO", country: "Côte d'Ivoire" },
  CDF: { flag: "🇨🇩", name: "Congolese Franc", country: "DR Congo" },
  MWK: { flag: "🇲🇼", name: "Malawian Kwacha", country: "Malawi" },
  ETB: { flag: "🇪🇹", name: "Ethiopian Birr", country: "Ethiopia" },
  MZN: { flag: "🇲🇿", name: "Mozambican Metical", country: "Mozambique" },
  LSL: { flag: "🇱🇸", name: "Lesotho Loti", country: "Lesotho" },
  SLE: { flag: "🇸🇱", name: "Sierra Leonean Leone", country: "Sierra Leone" },
  SOS: { flag: "🇸🇴", name: "Somali Shilling", country: "Somalia" },
};

const COUNTRY_META: Record<string, { name: string; flag: string }> = {
  RWA: { name: "Rwanda", flag: "🇷🇼" },
  KEN: { name: "Kenya", flag: "🇰🇪" },
  UGA: { name: "Uganda", flag: "🇺🇬" },
  TZA: { name: "Tanzania", flag: "🇹🇿" },
  GHA: { name: "Ghana", flag: "🇬🇭" },
  NGA: { name: "Nigeria", flag: "🇳🇬" },
  ZMB: { name: "Zambia", flag: "🇿🇲" },
  CMR: { name: "Cameroon", flag: "🇨🇲" },
  CIV: { name: "Côte d'Ivoire", flag: "🇨🇮" },
  SEN: { name: "Senegal", flag: "🇸🇳" },
  COD: { name: "DR Congo", flag: "🇨🇩" },
  MWI: { name: "Malawi", flag: "🇲🇼" },
  BEN: { name: "Benin", flag: "🇧🇯" },
  BFA: { name: "Burkina Faso", flag: "🇧🇫" },
  ETH: { name: "Ethiopia", flag: "🇪🇹" },
  GAB: { name: "Gabon", flag: "🇬🇦" },
  LSO: { name: "Lesotho", flag: "🇱🇸" },
  MOZ: { name: "Mozambique", flag: "🇲🇿" },
  SLE: { name: "Sierra Leone", flag: "🇸🇱" },
  SOM: { name: "Somalia", flag: "🇸🇴" },
};

// ─── Component ──────────────────────────────────────────────────────────

export default function SuperAdminPawaPay() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("send");

  // ── Wallet Balances ──────────────────────────────────────────────────
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [balancesLoading, setBalancesLoading] = useState(true);
  const [balancesError, setBalancesError] = useState<string | null>(null);

  // ── Status ───────────────────────────────────────────────────────────
  const [status, setStatus] = useState<PawaPayStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // ── Send / Withdraw Form ─────────────────────────────────────────────
  const [selectedCurrency, setSelectedCurrency] = useState("RWF");
  const [sendPhone, setSendPhone] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendReason, setSendReason] = useState("");
  const [detectedProvider, setDetectedProvider] = useState<{
    provider: string;
    country: string;
  } | null>(null);
  const [detectingProvider, setDetectingProvider] = useState(false);
  const [sending, setSending] = useState(false);
  const [internalNote, setInternalNote] = useState("");

  // ── Test Payout ─────────────────────────────────────────────────────
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testSectionOpen, setTestSectionOpen] = useState(false);
  const balanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Bulk CSV Payout ──────────────────────────────────────────────────
  const [csvRaw, setCsvRaw] = useState("");
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkResults, setBulkResults] = useState<any[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ── Transaction History (localStorage) ────────────────────────────────
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("pawapay_withdrawals");
      if (stored) setTransactions(JSON.parse(stored));
    } catch {}
  }, []);

  const saveTransaction = (tx: any) => {
    const entry = { ...tx, timestamp: new Date().toISOString() };
    const updated = [entry, ...transactions].slice(0, 100);
    setTransactions(updated);
    try {
      localStorage.setItem("pawapay_withdrawals", JSON.stringify(updated));
    } catch {}
  };

  // ── Fetch Wallet Balance ─────────────────────────────────────────────
  const fetchBalances = useCallback(async () => {
    setBalancesLoading(true);
    setBalancesError(null);
    try {
      const baseUrl = getApiBaseUrl();
      const token = localStorage.getItem("ihub_token");
      const res = await fetch(`${baseUrl}/api/payments/pawapay/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || errData?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.success && data.balances) {
        setBalances(data.balances);
        // Auto-select first currency with balance
        const hasBalance = data.balances.find((b: any) => b.balance > 0);
        if (hasBalance && !selectedCurrency) {
          setSelectedCurrency(hasBalance.currency);
        }
      } else {
        setBalancesError(data.message || "Failed to fetch balances");
      }
    } catch (err: any) {
      setBalancesError(err.message || "Failed to fetch balances");
    } finally {
      setBalancesLoading(false);
    }
  }, []);

  // ── Fetch Status ─────────────────────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const baseUrl = getApiBaseUrl();
      const token = localStorage.getItem("ihub_token");
      const res = await fetch(`${baseUrl}/api/payments/pawapay/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || errData?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setStatus(data);
    } catch {} finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalances();
    fetchStatus();
  }, [fetchBalances, fetchStatus]);

  // ── Auto-detect provider from phone number ───────────────────────────
  useEffect(() => {
    const detect = async () => {
      const phone = sendPhone.trim();
      if (phone.length < 8) {
        setDetectedProvider(null);
        return;
      }
      setDetectingProvider(true);
      try {
        const baseUrl = getApiBaseUrl();
        const token = localStorage.getItem("ihub_token");
        // Use the predict-provider API via the /api/payments/countries endpoint
        // For now, use the local country mapping
        const clean = phone.replace(/[^0-9]/g, "");
        // Determine country from prefix
        let country = "RWA";
        if (clean.startsWith("254")) country = "KEN";
        else if (clean.startsWith("256")) country = "UGA";
        else if (clean.startsWith("255")) country = "TZA";
        else if (clean.startsWith("233")) country = "GHA";
        else if (clean.startsWith("234")) country = "NGA";
        else if (clean.startsWith("260")) country = "ZMB";
        else if (clean.startsWith("237")) country = "CMR";
        else if (clean.startsWith("243")) country = "COD";
        else if (clean.startsWith("265")) country = "MWI";
        else if (clean.startsWith("251")) country = "ETH";
        else if (clean.startsWith("266")) country = "LSO";
        else if (clean.startsWith("258")) country = "MOZ";
        else if (clean.startsWith("232")) country = "SLE";
        else if (clean.startsWith("252")) country = "SOM";
        else if (clean.startsWith("221")) country = "SEN";
        else if (clean.startsWith("225")) country = "CIV";
        else if (clean.startsWith("226")) country = "BFA";
        else if (clean.startsWith("229")) country = "BEN";
        else if (clean.startsWith("241")) country = "GAB";

        const meta = COUNTRY_META[country];
        const currencyMap: Record<string, string> = {
          RWA: "RWF", KEN: "KES", UGA: "UGX", TZA: "TZS", GHA: "GHS",
          NGA: "NGN", ZMB: "ZMW", CMR: "XAF", CIV: "XOF", SEN: "XOF",
          COD: "CDF", MWI: "MWK", ETH: "ETB", GAB: "XAF", LSO: "LSL",
          MOZ: "MZN", SLE: "SLE", SOM: "SOS", BEN: "XOF", BFA: "XOF",
        };

        setDetectedProvider({
          provider: meta?.name || country,
          country: country,
        });

        // Also auto-set currency if not manually changed
        if (currencyMap[country]) {
          setSelectedCurrency(currencyMap[country]);
        }
      } catch {
        setDetectedProvider(null);
      } finally {
        setDetectingProvider(false);
      }
    };
    detect();
  }, [sendPhone]);

  // ── Wallet totals ────────────────────────────────────────────────────
  const totalAvailable = balances.reduce((sum, b) => sum + b.balance, 0);
  const currentBalance = balances.find((b) => b.currency === selectedCurrency);
  const maxAmount = currentBalance?.balance || 0;
  const remainingAfterSend = maxAmount - (parseFloat(sendAmount) || 0);

  // ── Test Payout Handler ─────────────────────────────────────────────
  const handleTestPayout = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const baseUrl = getApiBaseUrl();
      const token = localStorage.getItem("ihub_token");
      const testPhone = sendPhone.trim() || "250788123456";
      const testAmount = 100;
      const res = await fetch(`${baseUrl}/api/payments/pawapay/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: testAmount,
          phoneNumber: testPhone,
          reason: "Test payout — please ignore",
          currency: selectedCurrency,
        }),
      });

      const data = await res.json();
      setTestResult({
        statusCode: res.status,
        statusText: res.statusText,
        ok: res.ok,
        headers: {
          "content-type": res.headers.get("content-type"),
        },
        body: data,
      });
    } catch (err: any) {
      setTestResult({
        error: true,
        message: err.message,
      });
    } finally {
      setTestLoading(false);
    }
  };

  // ── Send / Withdraw Handler ──────────────────────────────────────────
  const handleSendMoney = async () => {
    const amount = parseFloat(sendAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (amount > maxAmount) {
      toast.error(
        `Insufficient balance. You have ${maxAmount.toLocaleString()} ${selectedCurrency} available.`
      );
      return;
    }
    if (!sendPhone || sendPhone.trim() === "") {
      toast.error("Please enter a recipient phone number");
      return;
    }

    setSending(true);
    try {
      const baseUrl = getApiBaseUrl();
      const token = localStorage.getItem("ihub_token");
      const res = await fetch(`${baseUrl}/api/payments/pawapay/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          phoneNumber: sendPhone.trim(),
          reason: sendReason.trim() || undefined,
          currency: selectedCurrency,
        }),
      });

      const data = await res.json();
      const success = data.success || data.payoutId;

      if (success) {
        toast.success(`✅ ${data.message || "Withdrawal sent!"}`);
        saveTransaction({
          amount,
          currency: selectedCurrency,
          phoneNumber: sendPhone.trim(),
          reason: sendReason.trim() || "Wallet withdrawal",
          success: true,
          payoutId: data.payoutId,
          status: data.status,
          balanceBefore: maxAmount,
          balanceAfter: remainingAfterSend,
          internalNote: internalNote.trim() || undefined,
        });
        setSendAmount("");
        setSendPhone("");
        setSendReason("");
        setInternalNote("");

        // Refresh balances after a short delay
        if (balanceTimerRef.current) clearTimeout(balanceTimerRef.current);
        balanceTimerRef.current = setTimeout(() => {
          fetchBalances();
          balanceTimerRef.current = null;
        }, 2000);
      } else {
        toast.error(`❌ ${data.error || data.message || "Failed to send"}`);
        saveTransaction({
          amount,
          currency: selectedCurrency,
          phoneNumber: sendPhone.trim(),
          reason: sendReason.trim() || "Wallet withdrawal",
          success: false,
          error: data.message || data.error,
          internalNote: internalNote.trim() || undefined,
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send money");
      saveTransaction({
        amount,
        currency: selectedCurrency,
        phoneNumber: sendPhone.trim(),
        reason: sendReason.trim() || "Wallet withdrawal",
        success: false,
        error: err.message,
        internalNote: internalNote.trim() || undefined,
      });
    } finally {
      setSending(false);
    }
  };

  // ── CSV Parser ───────────────────────────────────────────────────────
  const parseCSV = useCallback((raw: string) => {
    const lines = raw
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) {
      setParsedRows([]);
      setCsvErrors(["CSV must have a header row and at least one data row"]);
      return;
    }

    const errors: string[] = [];
    const rows: any[] = [];

    // Parse header — support comma, semicolon, or tab
    const delimiter = lines[0].includes(";")
      ? ";"
      : lines[0].includes("\t")
        ? "\t"
        : ",";
    const headers = lines[0]
      .split(delimiter)
      .map((h) => h.trim().toLowerCase());

    const phoneIdx = headers.findIndex(
      (h) => h.includes("phone") || h.includes("tel") || h === "number"
    );
    const amountIdx = headers.findIndex(
      (h) => h.includes("amount") || h.includes("value") || h.includes("sum")
    );
    const currencyIdx = headers.findIndex(
      (h) => h.includes("curr") || h === "ccy"
    );
    const reasonIdx = headers.findIndex(
      (h) => h.includes("reason") || h.includes("note") || h.includes("desc")
    );

    if (phoneIdx === -1)
      errors.push('Missing "phone" column');
    if (amountIdx === -1)
      errors.push('Missing "amount" column');

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(delimiter).map((c) => c.trim());
      const phone = cols[phoneIdx] || "";
      const amount = parseFloat(cols[amountIdx] || "0");
      const currency = currencyIdx >= 0
        ? cols[currencyIdx].toUpperCase()
        : selectedCurrency;
      const reason = reasonIdx >= 0 ? cols[reasonIdx] : "";

      const rowErrors: string[] = [];
      if (!phone || phone.length < 6)
        rowErrors.push("Invalid phone");
      if (!amount || amount <= 0)
        rowErrors.push("Invalid amount");

      rows.push({
        line: i,
        phone,
        amount,
        currency: currency || selectedCurrency,
        reason,
        errors: rowErrors,
        valid: rowErrors.length === 0,
      });
    }

    setParsedRows(rows);
    setCsvErrors(errors);
  }, [selectedCurrency]);

  // ── Handle Bulk Send ─────────────────────────────────────────────────
  const handleBulkSend = async () => {
    const validRows = parsedRows.filter((r) => r.valid);
    if (validRows.length === 0) {
      toast.error("No valid rows to send");
      return;
    }

    setBulkSending(true);
    setBulkResults(null);
    try {
      const baseUrl = getApiBaseUrl();
      const token = localStorage.getItem("ihub_token");
      const res = await fetch(`${baseUrl}/api/payments/pawapay/bulk-send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ payouts: validRows }),
      });

      const data = await res.json();
      const results = data.results || [];
      setBulkResults(results);

      const accepted = results.filter((r: any) => r.success).length;
      const failed = results.filter((r: any) => !r.success).length;

      if (accepted > 0) {
        toast.success(
          `✅ ${accepted} payout${accepted !== 1 ? "s" : ""} sent, ${failed} failed`
        );
        // Save each successful payout to transaction history
        results.forEach((r: any) => {
          if (r.success) {
            saveTransaction({
              amount: r.amount,
              currency: r.currency || selectedCurrency,
              phoneNumber: r.phoneNumber,
              reason: r.reason || "Bulk payout",
              success: true,
              payoutId: r.payoutId,
              status: "ACCEPTED",
              internalNote: "Bulk CSV payout",
            });
          }
        });
        setTimeout(() => fetchBalances(), 3000);
      } else {
        toast.error(`❌ All ${failed} payout(s) failed`);
      }
    } catch (err: any) {
      toast.error(err.message || "Bulk send failed");
    } finally {
      setBulkSending(false);
    }
  };

  // ── Handle file upload ───────────────────────────────────────────────
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        setCsvRaw(text);
        parseCSV(text);
      };
      reader.readAsText(file);
    },
    [parseCSV]
  );

  // ── Format helpers ───────────────────────────────────────────────────
  const formatCurrency = (value: number, currency?: string) => {
    return value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (ts: string) => {
    try {
      return new Date(ts).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return ts;
    }
  };

  const getCountryForCurrency = (currency: string) => {
    return CURRENCY_MAP[currency as keyof typeof CURRENCY_MAP] || {
      flag: "💳",
      name: currency,
      country: currency,
    };
  };

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <PortalLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Landmark className="w-6 h-6 text-primary" />
              PawaPay Wallet — Withdraw
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Send money directly from your PawaPay wallet to any mobile money subscriber across Africa
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchBalances();
                fetchStatus();
              }}
              disabled={balancesLoading}
            >
              <RefreshCw
                className={cn(
                  "w-4 h-4 mr-2",
                  balancesLoading && "animate-spin"
                )}
              />
              Refresh
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/portal/super-admin/disbursements">
                <ArrowRight className="w-4 h-4 mr-1.5" />
                Disbursements
              </a>
            </Button>
          </div>
        </motion.div>

        {/* ── Wallet Balances (Per Currency) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-emerald-500/[0.02] to-transparent">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      PawaPay Wallet Balances
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {status?.connected
                        ? `Connected · ${status.activeConfigs} active configs`
                        : statusLoading
                          ? "Checking connection..."
                          : "Connection unavailable"}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    totalAvailable > 0
                      ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10"
                      : "text-muted-foreground"
                  )}
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {totalAvailable.toLocaleString()} total
                </Badge>
              </div>

              {balancesLoading ? (
                <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading wallet balances...
                </div>
              ) : balancesError ? (
                <div className="flex items-center gap-2 py-4 text-sm text-amber-600">
                  <CircleAlert className="w-4 h-4 shrink-0" />
                  {balancesError}
                </div>
              ) : balances.length === 0 ? (
                <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                  <Info className="w-4 h-4 shrink-0" />
                  No wallet balances found. Your PawaPay wallet may be empty.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {balances.map((b) => {
                    const info = getCountryForCurrency(b.currency);
                    const isSelected = b.currency === selectedCurrency;
                    // Country from PawaPay API response, or fall back to local mapping
                    const countryName = b.country || info.country;
                    return (
                      <button
                        key={`${b.country}-${b.currency}`}
                        onClick={() => {
                          setSelectedCurrency(b.currency);
                          setActiveTab("send");
                        }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                          isSelected
                            ? "border-emerald-500/50 bg-emerald-500/10 ring-1 ring-emerald-500/30"
                            : "border-border/40 bg-background/60 hover:border-emerald-500/30 hover:bg-emerald-500/5"
                        )}
                      >
                        <span className="text-2xl">{info.flag}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {countryName}
                          </p>
                          <p className="text-lg font-bold text-foreground">
                            {b.balance.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                            <span className="text-xs font-normal text-muted-foreground ml-1">
                              {b.currency}
                            </span>
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger
              value="send"
              className="flex items-center gap-2 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-400"
            >
              <Send className="w-4 h-4" />
              Withdraw
            </TabsTrigger>
            <TabsTrigger
              value="bulk"
              className="flex items-center gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-700 dark:data-[state=active]:text-orange-400"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Bulk Payout
            </TabsTrigger>
            <TabsTrigger
              value="overview"
              className="flex items-center gap-2 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400"
            >
              <Globe className="w-4 h-4" />
              Countries
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex items-center gap-2 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-400"
            >
              <ArrowUpRight className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* ══════════ TAB: Send / Withdraw ══════════ */}
          <TabsContent value="send" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="w-5 h-5 text-emerald-600" />
                  Withdraw from PawaPay Wallet
                </CardTitle>
                <CardDescription>
                  Send money directly from your wallet to any mobile money
                  subscriber — no PIN required on recipient side
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ── Selected Balance Card ── */}
                <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-600">
                    <Banknote className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      Selected Wallet
                    </p>
                    <p className="text-2xl font-black text-foreground mt-0.5">
                      {getCountryForCurrency(selectedCurrency).flag}{" "}
                      {maxAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        {selectedCurrency}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getCountryForCurrency(selectedCurrency).country} ·{" "}
                      {getCountryForCurrency(selectedCurrency).name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Select
                      value={selectedCurrency}
                      onValueChange={setSelectedCurrency}
                    >
                      <SelectTrigger className="w-[120px] h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {balances.map((b) => {
                          const info = getCountryForCurrency(b.currency);
                          return (
                            <SelectItem key={b.currency} value={b.currency}>
                              <span className="flex items-center gap-2">
                                {info.flag} {b.currency}
                              </span>
                            </SelectItem>
                          );
                        })}
                        {balances.length === 0 &&
                          ["RWF", "KES", "UGX", "TZS"].map((c) => {
                            const info = getCountryForCurrency(c);
                            return (
                              <SelectItem key={c} value={c}>
                                <span className="flex items-center gap-2">
                                  {info.flag} {c}
                                </span>
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* ── Withdraw Form ── */}
                <div className="grid gap-5 max-w-lg">
                  {/* Recipient Phone */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      Recipient Phone Number
                      {detectingProvider && (
                        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                      )}
                    </Label>
                    <Input
                      value={sendPhone}
                      onChange={(e) => setSendPhone(e.target.value)}
                      placeholder="e.g. 254712345678 (Kenya) or 256771234567 (Uganda)"
                      className="h-11"
                    />
                    <div className="flex items-center gap-2 flex-wrap min-h-[20px]">
                      {detectedProvider && (
                        <span className="text-xs text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <Smartphone className="w-3 h-3" />
                          {detectedProvider.country} ·{" "}
                          {COUNTRY_META[detectedProvider.country]?.flag}
                        </span>
                      )}
                      {sendPhone.trim().length > 0 && !detectedProvider && !detectingProvider && (
                        <span className="text-xs text-amber-600 flex items-center gap-1">
                          <CircleAlert className="w-3 h-3" />
                          Could not detect — may not be supported
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        Enter full number with country code (254 for Kenya, 256 for Uganda, etc.)
                      </span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      Amount ({selectedCurrency})
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min={1}
                        max={maxAmount}
                        step={selectedCurrency === "RWF" ? 100 : 1}
                        value={sendAmount}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (parseFloat(val) <= maxAmount || val === "")
                            setSendAmount(val);
                        }}
                        placeholder={`e.g. ${(maxAmount * 0.5).toFixed(0)}`}
                        className="h-11 pr-24"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground font-mono">
                          / {formatCurrency(maxAmount)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setSendAmount(maxAmount.toString())
                          }
                          className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded"
                        >
                          MAX
                        </button>
                      </div>
                    </div>

                    {/* Balance Preview */}
                    <AnimatePresence mode="wait">
                      {parseFloat(sendAmount) > 0 && (
                        <motion.div
                          key="balance-preview"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="flex items-center gap-3 p-3 rounded-lg bg-background/80 border border-border/50 text-xs">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
                              <span>After withdraw:</span>
                            </div>
                            <span className="font-bold text-foreground">
                              {getCountryForCurrency(selectedCurrency).flag}{" "}
                              {remainingAfterSend >= 0
                                ? formatCurrency(remainingAfterSend)
                                : "0.00"}{" "}
                              <span className="font-normal text-muted-foreground">
                                {selectedCurrency}
                              </span>
                            </span>
                            {remainingAfterSend < 0 && (
                              <span className="text-red-500 font-medium flex items-center gap-1">
                                <CircleAlert className="w-3 h-3" />
                                Insufficient balance
                              </span>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Reason */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Info className="w-4 h-4 text-muted-foreground" />
                      Reason (optional)
                    </Label>
                    <Input
                      value={sendReason}
                      onChange={(e) => setSendReason(e.target.value)}
                      placeholder="e.g. Salary, Commission payout, Payment"
                      className="h-11"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Will appear as the customer message (max 22 chars)
                    </p>
                  </div>

                  {/* Internal Note */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <NotebookPen className="w-4 h-4 text-muted-foreground" />
                      Internal Note (optional)
                    </Label>
                    <Textarea
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      placeholder="e.g. This payment is for John's salary advance"
                      className="min-h-[60px] resize-none"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Visible only to you in the withdrawal history — not sent to the recipient
                    </p>
                  </div>

                  {/* Send Button */}
                  <Button
                    onClick={handleSendMoney}
                    disabled={
                      sending ||
                      !sendAmount ||
                      parseFloat(sendAmount) <= 0 ||
                      remainingAfterSend < 0 ||
                      !sendPhone.trim()
                    }
                    className="w-full gap-2 h-12 text-base font-semibold"
                    size="lg"
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                    {sending
                      ? `Withdrawing ${sendAmount ? parseFloat(sendAmount).toLocaleString() : ""} ${selectedCurrency}...`
                      : `Withdraw ${sendAmount ? parseFloat(sendAmount).toLocaleString() : ""} ${selectedCurrency}`}
                  </Button>

                  {/* Quick Amount Buttons */}
                  <div className="flex gap-2">
                    {[0.25, 0.5, 0.75, 1].map((frac) => (
                      <button
                        key={frac}
                        type="button"
                        onClick={() => {
                          const val = Math.floor(maxAmount * frac);
                          if (selectedCurrency === "RWF") {
                            // Round to nearest 100
                            setSendAmount(Math.floor(val / 100) * 100 + "");
                          } else {
                            setSendAmount(val + "");
                          }
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-background/80 border border-border/40 text-[10px] font-medium text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30 transition-all"
                      >
                        {frac === 0.25
                          ? "25%"
                          : frac === 0.5
                            ? "50%"
                            : frac === 0.75
                              ? "75%"
                              : "MAX"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Test Payout Section ── */}
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setTestSectionOpen(!testSectionOpen)}
                    className="w-full flex items-center justify-between p-4 text-sm font-medium hover:bg-amber-500/10 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Bug className="w-4 h-4 text-amber-600" />
                      Send Test Payout
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {testSectionOpen ? "Collapse" : "Expand"}
                    </span>
                  </button>

                  {testSectionOpen && (
                    <div className="px-4 pb-4 space-y-4">
                      <p className="text-xs text-muted-foreground">
                        Sends a <strong>small test amount</strong> (100 {selectedCurrency}) to the phone number
                        entered above, or to <code className="text-amber-600 bg-amber-500/10 px-1 rounded">250788123456</code>{' '}
                        if none is entered. Shows the full API response for debugging.
                      </p>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleTestPayout}
                          disabled={testLoading}
                          className="gap-2 border-amber-500/40 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400"
                        >
                          {testLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Bug className="w-4 h-4" />
                          )}
                          {testLoading ? "Sending…" : `Send 100 ${selectedCurrency} Test`}
                        </Button>

                        {testResult && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setTestResult(null)}
                            className="text-xs"
                          >
                            Clear
                          </Button>
                        )}
                      </div>

                      {/* ── Raw API Response ── */}
                      {testResult && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "text-xs font-semibold px-2 py-0.5 rounded-full",
                                testResult.error
                                  ? "bg-red-500/10 text-red-600"
                                  : testResult.ok
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : "bg-amber-500/10 text-amber-600"
                              )}
                            >
                              {testResult.error
                                ? "Network Error"
                                : `HTTP ${testResult.statusCode}`}
                            </span>
                            {!testResult.error && (
                              <span className="text-xs text-muted-foreground">
                                {testResult.statusText}
                              </span>
                            )}
                          </div>
                          <pre className="text-[11px] font-mono bg-background/80 border rounded-lg p-3 overflow-x-auto max-h-[400px] overflow-y-auto whitespace-pre-wrap break-all">
                            {JSON.stringify(testResult.body || testResult, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Info Card ── */}
                <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-sm space-y-2">
                  <p className="font-medium flex items-center gap-1 text-emerald-600">
                    <ShieldCheck className="w-4 h-4" />
                    How withdrawals work
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 text-xs">
                    <li>
                      Money is sent <strong>directly from your PawaPay wallet</strong>{" "}
                      to the recipient's mobile money account
                    </li>
                    <li>
                      <strong>No PIN required</strong> from the recipient — the money
                      arrives instantly in their mobile money wallet
                    </li>
                    <li>
                      The wallet balance above updates automatically after each
                      successful withdrawal
                    </li>
                    <li>
                      Provider is <strong>auto-detected</strong> from the phone
                      number (MTN, M-Pesa, Airtel, Orange, etc.)
                    </li>
                    <li>
                      Supported across{" "}
                      <strong>20 African countries</strong> — Rwanda via
                      IntouchPay (use the IntouchPay tab for Rwandan payouts)
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════════ TAB: Bulk Payout (CSV Upload) ══════════ */}
          <TabsContent value="bulk" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-orange-600" />
                  Bulk CSV Payout
                </CardTitle>
                <CardDescription>
                  Send money to multiple recipients at once — upload a CSV file or
                  paste comma-separated data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Upload area */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center cursor-pointer hover:border-orange-500/40 hover:bg-orange-500/5 transition-all"
                >
                  <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="font-medium text-sm">
                    Click to upload a CSV file
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Columns: phone, amount, currency, reason (currency optional, defaults to wallet currency)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.tsv,.txt"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>

                {/* Or paste raw data */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <NotebookPen className="w-4 h-4 text-muted-foreground" />
                    Or paste data manually
                  </Label>
                  <Textarea
                    value={csvRaw}
                    onChange={(e) => {
                      setCsvRaw(e.target.value);
                      parseCSV(e.target.value);
                    }}
                    placeholder={`phone,amount,currency,reason\n254712345678,5000,KES,Salary payment\n256771234567,10000,UGX,Commission\n233501234567,200,GHS,Refund`}
                    className="min-h-[120px] font-mono text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Supports comma, semicolon, or tab delimiters
                  </p>
                </div>

                {/* CSV errors */}
                {csvErrors.length > 0 && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 space-y-1">
                    {csvErrors.map((err, i) => (
                      <p key={i} className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {err}
                      </p>
                    ))}
                  </div>
                )}

                {/* Preview table */}
                {parsedRows.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                        Preview ({parsedRows.length} rows, {parsedRows.filter((r) => r.valid).length} valid)
                      </p>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto rounded-xl border">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/50 sticky top-0">
                          <tr>
                            <th className="p-2 text-left font-medium">#</th>
                            <th className="p-2 text-left font-medium">Phone</th>
                            <th className="p-2 text-right font-medium">Amount</th>
                            <th className="p-2 text-center font-medium">Currency</th>
                            <th className="p-2 text-left font-medium">Reason</th>
                            <th className="p-2 text-center font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedRows.map((row, idx) => (
                            <tr
                              key={idx}
                              className={cn(
                                "border-t border-border/40",
                                row.valid
                                  ? ""
                                  : "bg-red-500/5"
                              )}
                            >
                              <td className="p-2 text-muted-foreground">
                                {idx + 1}
                              </td>
                              <td className={`p-2 font-mono ${row.valid ? "" : "text-red-500"}`}>
                                {row.phone}
                              </td>
                              <td className="p-2 text-right font-mono">
                                {row.amount.toLocaleString()}
                              </td>
                              <td className="p-2 text-center">
                                <Badge
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  {row.currency}
                                </Badge>
                              </td>
                              <td className="p-2 text-muted-foreground max-w-[150px] truncate">
                                {row.reason || "—"}
                              </td>
                              <td className="p-2 text-center">
                                {row.valid ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                                ) : (
                                  <span className="text-[10px] text-red-500">
                                    {row.errors.join(", ")}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Bulk send button */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-1 gap-y-0.5">
                        Total:{" "}
                        {(() => {
                          const validRows = parsedRows.filter((r) => r.valid);
                          const byCurrency: Record<string, number> = {};
                          validRows.forEach((r) => {
                            const ccy = r.currency || selectedCurrency;
                            byCurrency[ccy] = (byCurrency[ccy] || 0) + r.amount;
                          });
                          return Object.entries(byCurrency).map(
                            ([ccy, total], i, arr) => (
                              <span key={ccy}>
                                <span className="font-semibold text-foreground">
                                  {total.toLocaleString()}{" "}
                                </span>
                                <span className="font-semibold">{ccy}</span>
                                {i < arr.length - 1 ? (
                                  <span className="mx-1 text-muted-foreground/50">
                                    +
                                  </span>
                                ) : null}
                              </span>
                            )
                          );
                        })()}{" "}
                        across{" "}
                        {parsedRows.filter((r) => r.valid).length} recipient
                        {parsedRows.filter((r) => r.valid).length !== 1
                          ? "s"
                          : ""}
                      </div>
                      <Button
                        onClick={handleBulkSend}
                        disabled={
                          bulkSending ||
                          parsedRows.filter((r) => r.valid).length === 0
                        }
                        className="gap-2"
                      >
                        {bulkSending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        {bulkSending
                          ? `Sending ${parsedRows.filter((r) => r.valid).length} payout(s)...`
                          : `Send ${parsedRows.filter((r) => r.valid).length} Payout(s)`}
                      </Button>
                    </div>

                    {/* Bulk results */}
                    {bulkResults && bulkResults.length > 0 && (
                      <div className="p-4 rounded-xl border space-y-2">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          Results
                        </p>
                        <div className="space-y-1 max-h-[200px] overflow-y-auto">
                          {bulkResults.map((r, i) => (
                            <div
                              key={i}
                              className={cn(
                                "flex items-center justify-between p-2 rounded-lg text-xs",
                                r.success
                                  ? "bg-emerald-500/5"
                                  : "bg-red-500/5"
                              )}
                            >
                              <span className="font-mono">
                                {r.phoneNumber}
                              </span>
                              <span className="font-semibold">
                                {r.amount?.toLocaleString()} {r.currency || selectedCurrency}
                              </span>
                              <span
                                className={cn(
                                  "font-medium",
                                  r.success
                                    ? "text-emerald-600"
                                    : "text-red-500"
                                )}
                              >
                                {r.success
                                  ? "✅ Accepted"
                                  : `❌ ${r.message || "Failed"}`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════════ TAB: Overview / Countries ══════════ */}
          <TabsContent value="overview" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Supported Countries (PawaPay)
                </CardTitle>
                <CardDescription>
                  20 African countries — provider is auto-detected from the
                  phone number
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statusLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : status ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {(status.supportedCountries || []).map((c) => {
                      const meta = COUNTRY_META[c.countryCode] || {
                        name: c.countryCode,
                        flag: "🌍",
                      };
                      return (
                        <div
                          key={c.countryCode}
                          className="p-4 rounded-xl border bg-card hover:bg-accent/5 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{meta.flag}</span>
                            <span className="font-semibold text-sm">
                              {meta.name}
                            </span>
                            <Badge
                              variant="outline"
                              className="ml-auto text-[10px]"
                            >
                              {c.currency}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            {c.providers.map((p, pIdx) => (
                              <div
                                key={`${c.countryCode}-${p.providerId}-${pIdx}`}
                                className="flex items-center gap-2 text-xs text-muted-foreground"
                              >
                                <Smartphone className="w-3 h-3 shrink-0" />
                                <span className="truncate">{p.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <CircleAlert className="w-5 h-5 mr-2" />
                    Could not load countries
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-muted/30 border-border/50">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">
                      How provider detection works
                    </p>
                    <p className="text-xs">
                      When you enter a phone number, PawaPay automatically
                      detects the mobile money provider from the number prefix.
                      E.g., <strong>07XX</strong> → MTN Rwanda,{" "}
                      <strong>2547XX</strong> → M-Pesa Kenya,{" "}
                      <strong>25677XX</strong> → MTN Uganda.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ══════════ TAB: Withdrawal History ══════════ */}
          <TabsContent value="history" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-primary" />
                  Withdrawal History
                </CardTitle>
                <CardDescription>
                  Money sent from your PawaPay wallet (last 100 transactions)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Send className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No withdrawals yet</p>
                    <p className="text-sm mt-1">
                      Use the withdraw tab to send money from your wallet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transactions.map((tx, idx) => {
                      const info = getCountryForCurrency(tx.currency || "RWF");
                      return (
                        <div
                          key={idx}
                          className={cn(
                            "p-3 rounded-lg border flex items-center justify-between gap-3",
                            tx.success
                              ? "bg-emerald-500/5 border-emerald-500/20"
                              : "bg-red-500/5 border-red-500/20"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={cn(
                                "p-2 rounded-full shrink-0",
                                tx.success
                                  ? "bg-emerald-500/20 text-emerald-600"
                                  : "bg-red-500/20 text-red-600"
                              )}
                            >
                              {tx.success ? (
                                <Send className="w-4 h-4" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm">
                                <span className="text-emerald-600 font-semibold">
                                  {info.flag}
                                </span>{" "}
                                {tx.amount?.toLocaleString()} {tx.currency || "RWF"}{" "}
                                → {tx.phoneNumber}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {tx.reason || "Wallet withdrawal"}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {tx.payoutId && (
                                  <p className="text-[10px] font-mono text-muted-foreground">
                                    ID: {tx.payoutId.slice(-12).toUpperCase()}
                                  </p>
                                )}
                                {tx.balanceBefore != null && (
                                  <span className="text-[10px] text-muted-foreground">
                                    Balance: {info.flag}{" "}
                                    {formatCurrency(tx.balanceBefore)} →{" "}
                                    {formatCurrency(tx.balanceAfter || 0)}
                                  </span>
                                )}
                              </div>
                              {tx.internalNote && (
                                <p className="text-[10px] text-muted-foreground/70 mt-0.5 italic flex items-center gap-1">
                                  <NotebookPen className="w-2.5 h-2.5" />
                                  {tx.internalNote}
                                </p>
                              )}
                              {tx.error && (
                                <p className="text-xs text-red-500 mt-0.5">
                                  {tx.error}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs text-muted-foreground">
                              {formatDate(tx.timestamp)}
                            </p>
                            <span
                              className={cn(
                                "text-[10px] font-medium",
                                tx.success ? "text-emerald-500" : "text-red-500"
                              )}
                            >
                              {tx.success
                                ? tx.status === "ACCEPTED"
                                  ? "Accepted"
                                  : "Success"
                                : "Failed"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PortalLayout>
  );
}
