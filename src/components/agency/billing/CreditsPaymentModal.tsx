'use client'

import { useState, useEffect, useRef } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, CreditCard, ShieldCheck, Zap, Coins, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMe } from '@/context/MeContext/MeContext'
import { useParams } from 'next/navigation'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Package {
    id: string
    credits: number
    price: number
    popular?: boolean
}

const packages: Package[] = [
    { id: 'package_100', credits: 100, price: 100 },
    { id: 'package_200', credits: 200, price: 200, popular: true },
    { id: 'package_500', credits: 500, price: 500 },
]

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export default function CreditsPaymentModal({ open, onOpenChange }: Props) {
    const [selectedPackage, setSelectedPackage] = useState<string>('package_200')
    const [customCredits, setCustomCredits] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const { userPrivate } = useMe()

    const params = useParams();
    const agencyId = params.agencyId as string;
    const customInputRef = useRef<HTMLInputElement>(null)

    // Reset state when modal opens
    useEffect(() => {
        if (open) {
            setError(null)
            setLoading(false)
        }
    }, [open])

    // Focus custom input when selected
    useEffect(() => {
        if (selectedPackage === 'custom' && customInputRef.current) {
            customInputRef.current.focus()
        }
    }, [selectedPackage])

    const getCreditsAndPrice = () => {
        if (selectedPackage === 'custom') {
            const credits = parseInt(customCredits) || 0
            const subtotal = credits
            const vat = subtotal * 0.21
            const total = subtotal + vat
            return { credits, subtotal, vat, price: total }
        }

        const pkg = packages.find(p => p.id === selectedPackage)
        const subtotal = pkg?.price || 0
        const vat = subtotal * 0.21
        const total = subtotal + vat
        return { credits: pkg?.credits || 0, subtotal, vat, price: total }
    }

    const handlePayment = async () => {
        const { credits, price } = getCreditsAndPrice()

        if (credits <= 0) {
            setError('Please select a valid number of credits (minimum 1).')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/payments/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    credits,
                    amount: Math.round(price * 100), // Siunčiame GALUTINĘ sumą su PVM centais
                    uid: userPrivate?.id,
                    email: userPrivate?.email,
                    agencyId: agencyId,
                }),
            })

            const session = await response.json()

            if (session.error) {
                setError(session.error)
                setLoading(false)
                return
            }

            const stripe = await stripePromise
            if (!stripe) {
                setError('Payment system is currently unavailable.')
                setLoading(false)
                return
            }

            // Redirect to Stripe Checkout
            window.location.href = session.url
        } catch (err) {
            console.error('Error creating checkout session:', err)
            setError('Something went wrong. Please check your connection and try again.')
            setLoading(false)
        }
    }

    const { credits, subtotal, vat, price } = getCreditsAndPrice()

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* TIKSLIAI TOKIOS PAČIOS KLASĖS KAIP PUBLISH MODALE */}
            <DialogContent className="sm:max-w-3xl md:max-w-4xl lg:max-w-5xl w-[95vw] max-h-[90vh] p-0 flex flex-col overflow-hidden bg-white rounded-2xl">

                {/* Header (Fiksuotas viršuje) */}
                <DialogHeader className="px-6 py-4 bg-white border-b border-border/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary shrink-0">
                            <Coins className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <DialogTitle className="text-xl font-bold text-slate-900">Add Balance</DialogTitle>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Purchase credits to publish press releases. <span className="font-semibold text-foreground">1 Credit = €1.00</span>
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                {/* Main Grid (Padalinta kaip Publish modale: 1.4fr kairė, 1fr dešinė) */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] min-h-[300px] overflow-hidden">

                    {/* LEFT COLUMN: Packages */}
                    <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-border/50 bg-white h-full overflow-hidden">
                        <div className="px-5 py-3 border-b border-border/50 bg-slate-50/50 flex items-center justify-between shrink-0">
                            <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                Choose a Package
                            </h4>
                        </div>
                        <ScrollArea className="flex-1 p-5 md:p-6">
                            <div className="space-y-3 pr-0 lg:pr-4">
                                {packages.map((pkg) => {
                                    const isSelected = selectedPackage === pkg.id
                                    return (
                                        <div
                                            key={pkg.id}
                                            onClick={() => setSelectedPackage(pkg.id)}
                                            className={cn(
                                                "relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                                                isSelected
                                                    ? "border-primary bg-primary/5 shadow-sm"
                                                    : "border-border/60 hover:border-primary/40 hover:bg-slate-50"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                                    isSelected ? "border-primary" : "border-slate-300"
                                                )}>
                                                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                                </div>
                                                <div>
                                                    <p className={cn("font-bold text-base leading-none", isSelected ? "text-primary" : "text-slate-900")}>
                                                        {pkg.credits} Credits
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {pkg.popular && (
                                                    <Badge className="bg-gradient-to-r from-orange-400 to-orange-500 text-white border-none shadow-sm uppercase tracking-widest text-[9px] px-2 py-0.5">
                                                        <Zap className="w-3 h-3 mr-1 fill-current" /> Popular
                                                    </Badge>
                                                )}
                                                <span className="font-semibold text-lg">€{pkg.price.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    )
                                })}

                                {/* Custom Amount Block */}
                                <div
                                    onClick={() => setSelectedPackage('custom')}
                                    className={cn(
                                        "relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
                                        selectedPackage === 'custom'
                                            ? "border-primary bg-primary/5 shadow-sm"
                                            : "border-border/60 hover:border-primary/40 hover:bg-slate-50"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                                            selectedPackage === 'custom' ? "border-primary" : "border-slate-300"
                                        )}>
                                            {selectedPackage === 'custom' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                        </div>
                                        <p className={cn("font-bold text-base leading-none", selectedPackage === 'custom' ? "text-primary" : "text-slate-900")}>
                                            Custom Amount
                                        </p>
                                    </div>

                                    {selectedPackage === 'custom' && (
                                        <div className="mt-4 pl-9 animate-in slide-in-from-top-2 fade-in duration-200">
                                            <Label htmlFor="custom-credits" className="text-xs text-muted-foreground mb-1.5 block">
                                                Enter number of credits you need
                                            </Label>
                                            <div className="relative max-w-[200px]">
                                                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    ref={customInputRef}
                                                    id="custom-credits"
                                                    type="number"
                                                    placeholder="e.g. 150"
                                                    value={customCredits}
                                                    onChange={(e) => setCustomCredits(e.target.value)}
                                                    min="1"
                                                    className="pl-9 h-10 text-base font-semibold bg-background"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ScrollArea>
                    </div>

                    {/* RIGHT COLUMN: Order Summary */}
                    <div className="flex flex-col bg-slate-50 h-full overflow-hidden">
                        <div className="px-5 py-3 border-b border-border/50 bg-white flex items-center justify-between shadow-sm z-10 shrink-0">
                            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-primary" /> Order Summary
                            </h4>
                        </div>

                        <ScrollArea className="flex-1 p-5">
                            <div className="space-y-3 bg-white p-5 rounded-xl border border-border/60 shadow-sm">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Credits selected</span>
                                    <span className="font-bold text-slate-900">{credits.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Subtotal</span>
                                    <span className="font-semibold text-slate-900">€{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">VAT (21%)</span>
                                    <span className="font-semibold text-slate-900">€{vat.toFixed(2)}</span>
                                </div>

                                <div className="border-t border-border/50 pt-3 mt-3 flex justify-between items-center">
                                    <span className="font-bold text-base text-slate-900">Total to pay</span>
                                    <span className="font-extrabold text-2xl text-primary">€{price.toFixed(2)}</span>
                                </div>
                            </div>

                            {error && (
                                <Alert variant="destructive" className="mt-4 bg-red-50 border-red-200 text-red-800">
                                    <AlertCircle className="h-4 w-4 text-red-600" />
                                    <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
                                </Alert>
                            )}
                        </ScrollArea>

                        {/* Right Column Footer with Pay Button */}
                        <div className="p-5 bg-white border-t border-border/50 shrink-0 space-y-3 shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.05)]">
                            <Button
                                onClick={handlePayment}
                                disabled={loading || credits <= 0}
                                className="w-full h-12 text-base font-bold shadow-md shadow-primary/20 transition-all hover:translate-y-[-1px] active:translate-y-[0px]"
                            >
                                {loading ? (
                                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                                ) : (
                                    <><CreditCard className="mr-2 h-5 w-5" /> Pay €{price.toFixed(2)}</>
                                )}
                            </Button>

                            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium">
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                <span>Guaranteed safe & secure checkout by <strong>Stripe</strong></span>
                            </div>
                        </div>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    )
}

