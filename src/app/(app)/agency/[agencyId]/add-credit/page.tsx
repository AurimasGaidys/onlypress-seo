"use client"

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { BillingDashboard } from "@/components/agency/billing/billing"
// import { useParams } from "next/navigation";
// import { useEffect } from "react";
// import { Loader2 } from "lucide-react";
// import { doc, getDoc } from "firebase/firestore";
// import { db } from "@/lib/firebase";
// import { DatabaseTables } from "@/lib/constants/databaseTables";

export default function Portals() {

    // const params = useParams();
    // const agencyId = params.agencyId as string;

    // useEffect(() => {
    //   if (!agencyId) return;
    //   const fetchAgency = async () => {
    //     const docRef = doc(db, DatabaseTables.agency, agencyId);
    //     const docSnap = await getDoc(docRef);
    //     if (docSnap.exists()) {
    //       const data = docSnap.data();
    //       setAgencyName(data.name);
    //       setAgencyOwnerId(data.ownerId);
    //     }
    //     setLoading(false);
    //   };
    //   fetchAgency();
    // }, [agencyId]);

    // if (workspaceLoading) {
    //     return (
    //         <div className="flex justify-center items-center h-64">
    //             <Loader2 className="h-8 w-8 animate-spin" />
    //         </div>
    //     );
    // }

    return (
        <div className="flex flex-col flex-1">
            <header className="flex h-14 shrink-0 items-center gap-2 px-6 border-b bg-white/50 backdrop-blur-sm sticky top-0 z-30">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="/buyer/dashboard">
                                Marketplace
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Billing & Invoices</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            <div className="flex flex-1 flex-col gap-6 p-6">
                <BillingDashboard />
            </div>
        </div>
    )
}
