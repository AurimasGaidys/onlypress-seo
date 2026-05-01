import { db } from "@/lib/firebase";
import { UserPublic } from "@/types/user";
import { DatabaseTables } from "@/lib/constants/databaseTables";
import { collection, DocumentData, getDocs, QuerySnapshot } from "firebase/firestore";

export class UsersDataProvider {
    private static _instance: UsersDataProvider;
    public data: UserPublic[] = [];
    private gettingDocs: Promise<QuerySnapshot<DocumentData, DocumentData>> | undefined;

    private constructor() {
        this.SubscribeToFirebase();
    }

    private SubscribeToFirebase() {
        const colRef = collection(db, DatabaseTables.userPublic);
        const aa = getDocs(colRef);
        this.gettingDocs = aa;

        aa.then((result) => {
            const serverData = result.docs.map(x => ({ ...x.data(), id: x.id } as UserPublic));
            console.log("-----> users loaded", serverData.length);
            this.data = serverData;
            this.gettingDocs = undefined;
        }).catch((error) => {
            console.error("Users Error fetching data: ", error);
        });
    }

    public static get Instance() {
        return this._instance || (this._instance = new this());
    }

    public async GetData() {
        if (this.gettingDocs) {
            const result = await this.gettingDocs;
            const serverData = result.docs.map(x => ({ ...x.data(), id: x.id } as UserPublic));
            return serverData;
        }
        return this.data;
    }

    public GetUser(id: string | undefined): UserPublic | undefined {
        if (!id) return undefined;
        if (this.data == null) return undefined;
        return this.data.find(x => x.id === id);
    }

    public GetEmail(id: string | undefined): string | undefined {
        if (!id) return undefined;
        const user = this.GetUser(id);
        return user?.email;
    }
}
