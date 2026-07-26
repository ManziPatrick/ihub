import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@apollo/client/react";
import { PortalLayout } from "@/components/portal/PortalLayout";
import { GET_INTOUCH_BALANCE } from "@/lib/graphql/queries";
import { SEND_DIRECT_MONEY, REQUEST_INTOUCH_PAYMENT } from "@/lib/graphql/mutations";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Loader2,
  Wallet,
  Send,
  RefreshCw,
  CheckCircle,
  XCircle,
  Phone,
  DollarSign,
  Banknote,
  ArrowRightLeft,
  History,
  Info,
  Download,
} from "lucide-react";
import { toast } from "sonner";

// ─── Component ──────────────────────────────────────────────────────────

export default function SuperAdminIntouchPay() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("deposit");

  // ── Balance ──────────────────────────────────────────────────────────
  const {
    data: balanceData,
    loading: balanceLoading,
    refetch: refetchBalance,
  } = useQuery(GET_INTOUCH_BALANCE, {
    fetchPolicy: "network-only",
  });

  const balance: any = (balanceData as any)?.getIntouchBalance;

  // ── Send Money (CASHOUT) ─────────────────────────────────────────────
  const [sendPhone, setSendPhone] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendReason, setSendReason] = useState("");
  const [sendDirectMoney, { loading: sending }] = useMutation(SEND_DIRECT_MONEY);

  // ── Deposit (CASHIN) ─────────────────────────────────────────────────
  const [depositPhone, setDepositPhone] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositReason, setDepositReason] = useState("");
  const [requestIntouchPayment, { loading: depositing }] = useMutation(REQUEST_INTOUCH_PAYMENT);

  // ── Transaction History ──────────────────────────────────────────────
  const [allTransactions, setAllTransactions] = useState<any[]>([]);

  // Load from localStorage — migrate old key if present
  useEffect(() => {
    try {
      // Migrate from old localStorage key if exists
      const oldStored = localStorage.getItem("intouch_sent_transactions");
      const newStored = localStorage.getItem("intouch_transactions");

      if (oldStored && !newStored) {
        // Old data exists but no new data — migrate it
        const parsed = JSON.parse(oldStored);
        const migrated = parsed.map((tx: any) => ({
          ...tx,
          type: tx.type || "withdraw",
        }));
        setAllTransactions(migrated);
        localStorage.setItem("intouch_transactions", JSON.stringify(migrated));
        localStorage.removeItem("intouch_sent_transactions");
      } else if (newStored) {
        setAllTransactions(JSON.parse(newStored));
      }
    } catch {}
  }, []);

  const saveTransaction = (tx: any) => {
    const entry = {
      ...tx,
      timestamp: new Date().toISOString(),
    };
    const updated = [entry, ...allTransactions].slice(0, 100);
    setAllTransactions(updated);
    try {
      localStorage.setItem("intouch_transactions", JSON.stringify(updated));
    } catch {}
  };

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleSendMoney = async () => {
    if (!sendAmount || parseFloat(sendAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!sendPhone || sendPhone.trim() === "") {
      toast.error("Please enter a phone number");
      return;
    }

    try {
      const amt = parseFloat(sendAmount);
      const result = await sendDirectMoney({
        variables: {
          amount: amt,
          phoneNumber: sendPhone.trim(),
          reason: sendReason.trim() || undefined,
        },
      });

      const data = (result.data as any)?.sendDirectMoney;

      if (data?.success) {
        toast.success(`✅ ${data.message || "Money sent successfully!"}`);
        saveTransaction({
          type: "withdraw",
          amount: amt,
          phoneNumber: sendPhone.trim(),
          reason: sendReason.trim() || "Direct payment",
          success: true,
          referenceId: data.referenceId,
          transactionId: data.transactionId,
        });
        setSendAmount("");
        setSendPhone("");
        setSendReason("");
        refetchBalance();
      } else {
        toast.error(`❌ ${data?.message || "Failed to send money"}`);
        saveTransaction({
          type: "withdraw",
          amount: amt,
          phoneNumber: sendPhone.trim(),
          reason: sendReason.trim() || "Direct payment",
          success: false,
          error: data?.message,
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send money");
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!depositPhone || depositPhone.trim() === "") {
      toast.error("Please enter your phone number");
      return;
    }

    try {
      const amt = parseFloat(depositAmount);
      const result = await requestIntouchPayment({
        variables: {
          amount: amt,
          phoneNumber: depositPhone.trim(),
          reason: depositReason.trim() || undefined,
        },
      });

      const data = (result.data as any)?.requestIntouchPayment;

      if (data?.success) {
        toast.success(`✅ ${data.message || "Deposit initiated!"}`);
        saveTransaction({
          type: "deposit",
          amount: amt,
          phoneNumber: depositPhone.trim(),
          reason: depositReason.trim() || "Wallet top-up",
          success: true,
          referenceId: data.referenceId,
          transactionId: data.transactionId,
        });
        setDepositAmount("");
        setDepositPhone("");
        setDepositReason("");
        // Delayed refetch — USSD confirmation typically takes 10-30s
        setTimeout(() => refetchBalance(), 15000);
      } else {
        toast.error(`❌ ${data?.message || "Failed to initiate deposit"}`);
        saveTransaction({
          type: "deposit",
          amount: amt,
          phoneNumber: depositPhone.trim(),
          reason: depositReason.trim() || "Wallet top-up",
          success: false,
          error: data?.message,
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate deposit");
    }
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

  return (
    <PortalLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ArrowRightLeft className="w-6 h-6 text-primary" />
              IntouchPay Management
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Deposit, withdraw, and manage mobile money via IntouchPay
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchBalance()}
            disabled={balanceLoading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${balanceLoading ? "animate-spin" : ""}`}
            />
            Refresh Balance
          </Button>
        </div>

        {/* Balance Card */}
        <Card
          className={`bg-gradient-to-br ${
            balance?.success
              ? "from-green-500/10 via-emerald-500/5 to-green-500/10 border-green-500/20"
              : "from-amber-500/10 via-yellow-500/5 to-amber-500/10 border-amber-500/20"
          }`}
        >
          <CardContent className="p-6">
            {balanceLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : balance ? (
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-full ${
                      balance.success
                        ? "bg-green-500/20 text-green-600"
                        : "bg-amber-500/20 text-amber-600"
                    }`}
                  >
                    <Wallet className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      IntouchPay Wallet Balance
                    </p>
                    <p className="text-4xl font-black tracking-tight">
                      {balance.balance?.toLocaleString() || "0"}{" "}
                      <span className="text-lg font-bold text-muted-foreground">
                        {balance.currency || "RWF"}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      {balance.success ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          Balance fetched successfully
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-red-500" />
                          {balance.message || "Failed to fetch balance"}
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setActiveTab("deposit")}
                    variant="outline"
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Deposit
                  </Button>
                  <Button
                    onClick={() => setActiveTab("send")}
                    className="gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send Money
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Wallet className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="font-medium">Unable to load balance</p>
                <p className="text-sm mt-1">
                  Check your IntouchPay configuration
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="deposit"
              className="flex items-center gap-2 data-[state=active]:bg-green-500/20 data-[state=active]:text-green-700 dark:data-[state=active]:text-green-400 hover:text-foreground/80 transition-colors"
            >
              <Download className="w-4 h-4" />
              Deposit
            </TabsTrigger>
            <TabsTrigger
              value="send"
              className="flex items-center gap-2 data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-700 dark:data-[state=active]:text-orange-400 hover:text-foreground/80 transition-colors"
            >
              <Send className="w-4 h-4" />
              Send Money
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex items-center gap-2 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 hover:text-foreground/80 transition-colors"
            >
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* ─── TAB: Deposit (CASHIN) ───────────────────────────────── */}
          <TabsContent value="deposit" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Download className="w-5 h-5 text-primary" />
                  Deposit / Top Up Wallet
                </CardTitle>
                <CardDescription>
                  Deposit money into your IntouchPay merchant wallet. You'll
                  receive a USSD prompt on your phone to confirm the payment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Balance display */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border">
                  <Banknote className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Current Balance:{" "}
                  </span>
                  <span className="font-bold text-lg">
                    {balance?.balance?.toLocaleString() || "0"}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      RWF
                    </span>
                  </span>
                </div>

                <div className="grid gap-4 max-w-lg">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      Your Phone Number
                    </Label>
                    <Input
                      value={depositPhone}
                      onChange={(e) => setDepositPhone(e.target.value)}
                      placeholder="e.g. 0784086021 or 250784086021"
                    />
                    <p className="text-xs text-muted-foreground">
                      The phone number that will receive the USSD payment prompt
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      Amount (RWF)
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="e.g. 50000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-muted-foreground" />
                      Reason (optional)
                    </Label>
                    <Input
                      value={depositReason}
                      onChange={(e) => setDepositReason(e.target.value)}
                      placeholder="e.g. Wallet top-up, Monthly settlement"
                    />
                  </div>

                  <Button
                    onClick={handleDeposit}
                    disabled={depositing || !depositAmount || !depositPhone}
                    className="w-full gap-2 mt-2"
                    size="lg"
                  >
                    {depositing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                    {depositing ? "Initiating..." : "Deposit Money"}
                  </Button>
                </div>

                {/* How it works */}
                <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20 text-sm space-y-2">
                  <p className="font-medium flex items-center gap-1 text-green-600">
                    <Info className="w-4 h-4" />
                    How it works
                  </p>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-1 text-xs">
                    <li>
                      Enter your mobile money phone number and the amount to
                      deposit
                    </li>
                    <li>
                      Click "Deposit Money" — IntouchPay sends a payment request
                      to your phone
                    </li>
                    <li>
                      Check your phone for the USSD prompt and enter your PIN to
                      confirm
                    </li>
                    <li>
                      Money is immediately credited to the IntouchPay merchant
                      wallet
                    </li>
                    <li>
                      The balance card above will update after the transaction
                      completes
                    </li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TAB: Send Money (CASHOUT) ───────────────────────────── */}
          <TabsContent value="send" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" />
                  Send Money via IntouchPay
                </CardTitle>
                <CardDescription>
                  Send money directly to any mobile money subscriber (mentors,
                  trainers, salary payments, etc.)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Balance display */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border">
                  <Banknote className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Available Balance:{" "}
                  </span>
                  <span className="font-bold text-lg">
                    {balance?.balance?.toLocaleString() || "0"}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      RWF
                    </span>
                  </span>
                </div>

                <div className="grid gap-4 max-w-lg">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      Recipient Phone Number
                    </Label>
                    <Input
                      value={sendPhone}
                      onChange={(e) => setSendPhone(e.target.value)}
                      placeholder="e.g. 0784086021 or 250784086021"
                    />
                    <p className="text-xs text-muted-foreground">
                      Rwandan phone number — local (078...) or international
                      (250...)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      Amount (RWF)
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      placeholder="e.g. 5000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-muted-foreground" />
                      Reason (optional)
                    </Label>
                    <Input
                      value={sendReason}
                      onChange={(e) => setSendReason(e.target.value)}
                      placeholder="e.g. Salary payment, Mentor fee, Trainer payout"
                    />
                  </div>

                  <Button
                    onClick={handleSendMoney}
                    disabled={sending || !sendAmount || !sendPhone}
                    className="w-full gap-2 mt-2"
                    size="lg"
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                    {sending ? "Sending..." : "Send Money"}
                  </Button>
                </div>

                <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 text-sm space-y-2">
                  <p className="font-medium flex items-center gap-1 text-blue-600">
                    <Info className="w-4 h-4" />
                    Important Notes
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 text-xs">
                    <li>
                      Money is sent via IntouchPay RequestDeposit API (CASHOUT)
                    </li>
                    <li>
                      The recipient receives the money directly on their mobile
                      money account
                    </li>
                    <li>
                      Your IntouchPay merchant account must have sufficient
                      balance
                    </li>
                    <li>
                      A transaction reference is generated for each payment for
                      tracking
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TAB: Transaction History ────────────────────────────── */}
          <TabsContent value="history" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  All Transactions
                </CardTitle>
                <CardDescription>
                  Deposits and withdrawals made from this dashboard (last 100)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {allTransactions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No transactions yet</p>
                    <p className="text-sm mt-1">
                      Deposits and withdrawals will appear here after you use
                      the tabs above
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allTransactions.map((tx, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                          tx.success
                            ? tx.type === "deposit"
                              ? "bg-green-500/5 border-green-500/20"
                              : "bg-orange-500/5 border-orange-500/20"
                            : "bg-red-500/5 border-red-500/20"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-2 rounded-full shrink-0 ${
                              tx.success
                                ? tx.type === "deposit"
                                  ? "bg-green-500/20 text-green-600"
                                  : "bg-orange-500/20 text-orange-600"
                                : "bg-red-500/20 text-red-600"
                            }`}
                          >
                            {tx.success ? (
                              tx.type === "deposit" ? (
                                <Download className="w-4 h-4" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm">
                              <span
                                className={
                                  tx.type === "deposit"
                                    ? "text-green-600"
                                    : "text-orange-600"
                                }
                              >
                                {tx.type === "deposit" ? "DEPOSIT" : "WITHDRAW"}
                              </span>{" "}
                              — {tx.amount?.toLocaleString()} RWF{" "}
                              {tx.type === "deposit"
                                ? `from ${tx.phoneNumber}`
                                : `→ ${tx.phoneNumber}`}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {tx.reason || (tx.type === "deposit" ? "Wallet top-up" : "Direct payment")}
                            </p>
                            {tx.referenceId && (
                              <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                                Ref: {tx.referenceId}
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
                            className={`text-[10px] font-medium ${
                              tx.success
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {tx.success ? "Success" : "Failed"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="p-4 text-xs text-muted-foreground flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                For full commission disbursement tracking (retries, stats),
                visit the{" "}
                <a
                  href="/portal/super-admin/disbursements"
                  className="text-primary hover:underline font-medium"
                >
                  Disbursements page
                </a>
                .
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PortalLayout>
  );
}
