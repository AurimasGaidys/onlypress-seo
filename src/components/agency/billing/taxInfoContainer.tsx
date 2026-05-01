
"use client";

// import { z } from "zod";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";

// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";

// import { useEffect, useState } from "react";
// import { useAgencyData } from "@/hooks/useAgencyData";

// const formSchema = z.object({
//     name: z.string().nonempty({ message: "Įmonės pavadinimas yra privalomas" }),
//     companyCode: z.string().nonempty({ message: "Įmonės kodas yra privalomas" }),
//     adress: z.string().nonempty({ message: "Adresas yra privalomas" }),
//     city: z.string().nonempty({ message: "Miestas yra privalomas" }),
//     postalCode: z.string().nonempty({ message: "Pašto kodas yra privalomas" }),
//     country: z.string().nonempty({ message: "Šalis yra privaloma" }),
//     VIT: z.string().optional(),
// });

interface TaxInfoContainerProps {
    onSave: () => void;
}

export const TaxInfoContainer = ({ onSave }: TaxInfoContainerProps) => {
    onSave(); // Call onSave immediately for testing purposes, replace with actual save logic later
    // const [loading, setLoading] = useState(false);

    // const { userPrivate } = useAgencyData();

    // const form = useForm({
    //     defaultValues: {
    //         name: userPrivate?.userTaxDetails?.name ?? "UAB Mano Įmonė",
    //         companyCode: userPrivate?.userTaxDetails?.companyCode ?? "123456789",
    //         adress: userPrivate?.userTaxDetails?.adress ?? "Gedimino pr. 1",
    //         city: userPrivate?.userTaxDetails?.city ?? "Vilnius",
    //         postalCode: userPrivate?.userTaxDetails?.postalCode ?? "LT-01101",
    //         country: userPrivate?.userTaxDetails?.country ?? "Lietuva",
    //         VIT: userPrivate?.userTaxDetails?.VIT ?? "",
    //     },
    //     resolver: zodResolver(formSchema),
    // });

    // useEffect(() => {
    //     form.reset({
    //         name: userPrivate?.userTaxDetails?.name ?? "UAB Mano Įmonė",
    //         companyCode: userPrivate?.userTaxDetails?.companyCode ?? "123456789",
    //         adress: userPrivate?.userTaxDetails?.adress ?? "Gedimino pr. 1",
    //         city: userPrivate?.userTaxDetails?.city ?? "Vilnius",
    //         postalCode: userPrivate?.userTaxDetails?.postalCode ?? "LT-01101",
    //         country: userPrivate?.userTaxDetails?.country ?? "Lietuva",
    //         VIT: userPrivate?.userTaxDetails?.VIT ?? "",
    //     });
    // }, [userPrivate]);

    // function onSubmit(values: z.infer<typeof formSchema>) {
    //     console.log(values);

    //     // create or update customper details in stripe

    //     if (userPrivate) {
    //         setLoading(true);
    //         // 

    //         ApiSaveTaxDetails({
    //             id: userPrivate.userTaxDetails?.id ?? "",
    //             name: values.name ?? "",
    //             companyCode: values.companyCode ?? "",
    //             adress: values.adress ?? "",
    //             VIT: values.VIT ?? "",
    //             licenseNumber: userPrivate.userTaxDetails?.licenseNumber ?? "",
    //             type: userPrivate.userTaxDetails?.type ?? "",
    //             created: userPrivate.userTaxDetails?.created ?? 0,
    //             // Additional fields for the extended form
    //             city: values.city ?? "",
    //             postalCode: values.postalCode ?? "",
    //             country: values.country ?? ""
    //         } as any).then(() => {
    //             setLoading(false);
    //             onSave();
    //         });
    //     }
    // }

        return <p>Loading...</p>;

    // if (!userPrivate) {
    //     return <p>Loading...</p>;
    // }

    // return (
    //     <Form {...form}>
    //         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 p-4">
    //             <FormField
    //                 control={form.control}
    //                 name="name"
    //                 render={({ field }: any) => (
    //                     <FormItem>
    //                         <FormLabel>Įmonės pavadinimas</FormLabel>
    //                         <FormControl>
    //                             <Input
    //                                 placeholder="UAB Mano Įmonė"
    //                                 disabled={loading}
    //                                 {...field}
    //                             />
    //                         </FormControl>
    //                         <FormMessage />
    //                     </FormItem>
    //                 )}
    //             />
    //             <FormField
    //                 control={form.control}
    //                 name="companyCode"
    //                 render={({ field }: any) => (
    //                     <FormItem>
    //                         <FormLabel>Įmonės kodas</FormLabel>
    //                         <FormControl>
    //                             <Input
    //                                 placeholder="123456789"
    //                                 disabled={loading}
    //                                 {...field}
    //                             />
    //                         </FormControl>
    //                         <FormMessage />
    //                     </FormItem>
    //                 )}
    //             />
    //             <FormField
    //                 control={form.control}
    //                 name="adress"
    //                 render={({ field }: any) => (
    //                     <FormItem>
    //                         <FormLabel>Adresas</FormLabel>
    //                         <FormControl>
    //                             <Input
    //                                 placeholder="Gedimino pr. 1"
    //                                 disabled={loading}
    //                                 {...field}
    //                             />
    //                         </FormControl>
    //                         <FormMessage />
    //                     </FormItem>
    //                 )}
    //             />
    //             <FormField
    //                 control={form.control}
    //                 name="city"
    //                 render={({ field }: any) => (
    //                     <FormItem>
    //                         <FormLabel>Miestas</FormLabel>
    //                         <FormControl>
    //                             <Input
    //                                 placeholder="Vilnius"
    //                                 disabled={loading}
    //                                 {...field}
    //                             />
    //                         </FormControl>
    //                         <FormMessage />
    //                     </FormItem>
    //                 )}
    //             />
    //             <FormField
    //                 control={form.control}
    //                 name="postalCode"
    //                 render={({ field }: any) => (
    //                     <FormItem>
    //                         <FormLabel>Pašto kodas</FormLabel>
    //                         <FormControl>
    //                             <Input
    //                                 placeholder="LT-01101"
    //                                 disabled={loading}
    //                                 {...field}
    //                             />
    //                         </FormControl>
    //                         <FormMessage />
    //                     </FormItem>
    //                 )}
    //             />
    //             <FormField
    //                 control={form.control}
    //                 name="country"
    //                 render={({ field }: any) => (
    //                     <FormItem>
    //                         <FormLabel>Šalis</FormLabel>
    //                         <FormControl>
    //                             <Input
    //                                 placeholder="Lietuva"
    //                                 disabled={loading}
    //                                 {...field}
    //                             />
    //                         </FormControl>
    //                         <FormMessage />
    //                     </FormItem>
    //                 )}
    //             />
    //             <FormField
    //                 control={form.control}
    //                 name="VIT"
    //                 render={({ field }: any) => (
    //                     <FormItem>
    //                         <FormLabel>PVM mokėtojo kodas (jei taikoma)</FormLabel>
    //                         <FormControl>
    //                             <Input
    //                                 placeholder="PVM mokėtojo kodas..."
    //                                 disabled={loading}
    //                                 {...field}
    //                             />
    //                         </FormControl>
    //                         <FormMessage />
    //                     </FormItem>
    //                 )}
    //             />
    //             <Button disabled={loading} variant="default">
    //                 {loading ? "Saving..." : "Save"}
    //             </Button>
    //         </form>
    //     </Form>
    // );
};
