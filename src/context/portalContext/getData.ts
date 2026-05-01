import { db } from "@/lib/firebase";
import { PortalPublic } from "@/types/portalPublic";
import { collection, DocumentData, getDocs, query, QuerySnapshot, where } from "firebase/firestore";


export class DataProvider {
    private static _instance: DataProvider;
    public data: PortalPublic[] = [];
    private gettingDocs: Promise<QuerySnapshot<DocumentData, DocumentData>> | undefined

    private constructor() {
        this.SubscribeToFirebase()
    }

    private SubscribeToFirebase() {
        const colRef = collection(db, "portals")
        const queryRef = query(colRef, where("active", "==", true))

        const aa = getDocs(queryRef)
        this.gettingDocs = aa

        aa.then((result) => {
            const serverData = result.docs.map(x => x.data() as PortalPublic)
            console.log("-----> pb", serverData);
            this.data = serverData
            this.gettingDocs = undefined;
        }
        ).catch((error) => {
            console.error("PB Error fetching data: ", error);
        });
    }

    public static get Instance() {
        return this._instance || (this._instance = new this());
    }

    public async GetData() {
        if (this.gettingDocs) {
            const result = await this.gettingDocs;
            const serverData = result.docs.map(x => x.data() as PortalPublic)
            return serverData;
        }
        return this.data;
    }

    public GetName(id: string | undefined) {
        if (!id) return "..";

        if (this.data == null) return "Kraunasi..";

        return this.data.find(x => x.id === id)?.title;
    }
}