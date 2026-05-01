import { functions } from "@/lib/firebase";
import { PublishOrder } from "@/types/publishOrder";
import { httpsCallable, HttpsCallableResult } from "firebase/functions";

export interface ApiBuyerOrderCreateDto {
    order: PublishOrder;
    payCredit: boolean; // if true, then pay credit from user
    agencyId: string;
}

const debug = true

export const ApiBuyerOrderCreate = (dto: ApiBuyerOrderCreateDto) => {
    const onCreateOrder = httpsCallable(functions, 'onBuyerOrderCreateCall');
    return onCreateOrder(dto)
        .then((result) => {
            // Read result of the Cloud Function.
            const data = (result as HttpsCallableResult<{ success: boolean, message?:string }>).data;
            if (debug) console.log("onBuyerOrderCreateCall", result, data)

            return data
        });
}
