"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Wallet, Plus, Receipt, Building2, CreditCard, ArrowDownRight, ArrowUpRight, Loader2 } from "lucide-react";

import moment from "moment";
import { LoadingSpinner } from "@/components/aaa_todo/loadingSpinner";
import { useMe } from "@/context/MeContext/MeContext";
import { formatEuro } from "@/utils/helpers/formatEuro";
import TaxDetailsEditor from "../TaxDetailsEditor";
import { useParams } from "next/navigation";
import { useAgencyInfo } from "@/hooks/useAgencyInfo";
import CreditsPaymentModal from "./CreditsPaymentModal";

export function BillingDashboard() {
    const params = useParams();
    const agencyId = params.agencyId as string;
    // const { agency, loading, error } = useAgencyInfo(agencyId); // Tik pagrindinė info
    // const { activeWorkspace, setActiveWorkspace, availableWorkspaces } = useWorkspace();
    // const { userPrivate } = useMe();
    const [paymentModalOpen, setPaymentModalOpen] = React.useState(false);

    const { userPrivate, loading: userLoading } = useMe();
    // const { activeWorkspace, isAgencyWorkspace } = useWorkspace();

    // Fetch agency data only when agency workspace is selected
    const { agency, loading: agencyLoading } = useAgencyInfo(
        agencyId
    );

    // Determine which credit to display based on workspace type
    const loading = agencyLoading || userLoading;
    const credit = agency?.credit || userPrivate?.credit;

    console.log("BillingDashboard - agency:", paymentModalOpen);

    // // Automatiškai nustatome agency workspace'ą pagal URL
    // useEffect(() => {
    //     if (agencyId && agency && !loading) {
    //         const currentWorkspace = availableWorkspaces.find(ws => ws.id === agencyId);
    //         if (currentWorkspace && (!activeWorkspace.id || currentWorkspace.id !== activeWorkspace.id)) {
    //             console.log('Setting workspace from URL:', agencyId);
    //             setActiveWorkspace(currentWorkspace);
    //         }
    //     }
    // }, [agencyId, agency, loading, availableWorkspaces, activeWorkspace.id, setActiveWorkspace]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-4 text-muted-foreground">Loading agency data...</p>
            </div>
        );
    }

    // if (error) {
    //     return <div className="text-destructive text-center p-8">{error}</div>;
    // }

    if (!agency) {
        return <div className="text-center p-8">Agency not found.#3 {agencyId}</div>;
    }


    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center py-20">
                <LoadingSpinner label="Loading billing information..." />
            </div>
        );
    }

    // Rūšiuojame transakcijas nuo naujausios
    const transactions: any[] = [];//[...(userPrivate?.creditDeductions || [])].sort((a, b) => b.date - a.date);

    return (
        <>
            <div className="flex flex-1 flex-col gap-6 p-6 max-w-6xl mx-auto w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Billing & Credits</h2>
                        <p className="text-sm text-muted-foreground font-medium">
                            Manage your account balance, transaction history, and billing details.
                        </p>
                    </div>
                    <Button
                        onClick={() => setPaymentModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add Funds
                    </Button>
                </div>

                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full md:w-[400px] grid-cols-3 mb-6 bg-muted/50 p-1 rounded-xl">
                        <TabsTrigger value="overview" className="rounded-lg text-xs font-bold">Overview</TabsTrigger>
                        <TabsTrigger value="transactions" className="rounded-lg text-xs font-bold">Transactions</TabsTrigger>
                        <TabsTrigger value="details" className="rounded-lg text-xs font-bold">Billing Details</TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview" className="space-y-6 focus-visible:outline-none">
                        <div className="grid gap-6 md:grid-cols-3">
                            <Card className="md:col-span-2 border-border/50 shadow-sm bg-gradient-to-br from-blue-50/50 to-white">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                        <Wallet className="w-4 h-4 text-blue-600" /> Current Balance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-end justify-between">
                                        <div className="text-5xl font-black text-slate-900 tracking-tight">
                                            {formatEuro(credit || 0)}
                                        </div>
                                        <Button variant="outline" onClick={() => setPaymentModalOpen(true)} className="mb-1 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50">
                                            Buy Credits
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-4">
                                        1 Credit = 1 EUR. Credits are used to pay for article publications.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-border/50 shadow-sm">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">Active Orders</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold text-slate-900">
                                        --
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Pending publications
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border-border/50 shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/40">
                                <div className="space-y-1">
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <Receipt className="w-4 h-4 text-muted-foreground" /> Recent Activity
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {transactions.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground text-sm">
                                        No transactions yet.
                                    </div>
                                ) : (
                                    <Table>
                                        <TableBody>
                                            {transactions.slice(0, 5).map((tx, idx) => (
                                                <TableRow key={idx} className="hover:bg-muted/30">
                                                    <TableCell className="w-[50px] py-4">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.amount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                                            {tx.amount > 0 ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <p className="font-semibold text-sm text-slate-900">{tx.reason}</p>
                                                        <p className="text-xs text-muted-foreground">{moment(tx.date).format("MMM D, YYYY HH:mm")}</p>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-sm">
                                                        <span className={tx.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}>
                                                            {tx.amount > 0 ? '+' : ''}{formatEuro(tx.amount)}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TRANSACTIONS TAB */}
                    <TabsContent value="transactions" className="focus-visible:outline-none">
                        <Card className="border-border/50 shadow-sm">
                            <CardHeader className="border-b border-border/40">
                                <CardTitle className="text-lg">All Transactions</CardTitle>
                                <CardDescription>A complete history of your purchases and deductions.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {transactions.length === 0 ? (
                                    <div className="p-12 text-center text-muted-foreground">
                                        <Receipt className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        <p>No transaction history found.</p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow>
                                                <TableHead className="w-[200px]">Date</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {transactions.map((tx, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell className="text-sm font-medium text-slate-600">
                                                        {moment(tx.date).format("YYYY-MM-DD HH:mm")}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {tx.reason}
                                                        {tx.invoiceId && <span className="block text-xs text-muted-foreground font-mono mt-0.5">ID: {tx.invoiceId}</span>}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-none hover:bg-emerald-50 text-[10px] uppercase">
                                                            Completed
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold">
                                                        <span className={tx.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}>
                                                            {tx.amount > 0 ? '+' : ''}{formatEuro(tx.amount)}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* BILLING DETAILS TAB */}
                    <TabsContent value="details" className="focus-visible:outline-none">
                        <div className="grid lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <Card className="border-border/50 shadow-sm">
                                    <CardHeader className="border-b border-border/40">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Building2 className="w-5 h-5 text-primary" /> Company Details
                                        </CardTitle>
                                        <CardDescription>This information will appear on your invoices.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <TaxDetailsEditor
                                            agencyId={agencyId}
                                            taxDetails={agency?.taxDetails}
                                        />
                                    </CardContent>
                                </Card>
                            </div>

                            <div>
                                <Card className="bg-slate-50 border-border/50">
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <CreditCard className="w-4 h-4 text-slate-500" /> Payment Methods
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            We use Stripe for secure payments. Payment methods are handled securely during the checkout process.
                                        </p>
                                        <Button variant="outline" className="w-full bg-white" onClick={() => setPaymentModalOpen(true)}>
                                            Top up balance
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <CreditsPaymentModal
                open={paymentModalOpen}
                onOpenChange={setPaymentModalOpen}
            />
        </>
    );
}
