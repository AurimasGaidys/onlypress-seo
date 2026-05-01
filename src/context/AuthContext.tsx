// src/context/AuthContext.tsx
'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDocs, query, collection, writeBatch } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  // Funkcijos
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}
import Smartlook from 'smartlook-client';
import { DatabaseTables } from '@/lib/constants/databaseTables';

// // ======================= PRADEDAME PAKEITIMĄ ČIA =======================

// // NAUJA PAGALBINĖ FUNKCIJA
// const createUserDocumentIfNotExists = async (user: User) => {
//   if (!user) return;
//   const userRef = doc(db, "users", user.uid);
//   const userSnap = await getDoc(userRef);

//   if (!userSnap.exists()) {
//     try {
//       await setDoc(userRef, {
//         email: user.email,
//         displayName: user.displayName,
//         createdAt: new Date(),
//       }, { merge: true }); // Naudojame merge, kad netyčia neperrašytume esamų laukų, pvz., 'agencies'
//       console.log(`User document created for ${user.email}`);
//     } catch (error) {
//       console.error("Error creating user document:", error);
//     }
//   } else {
//     const userData = userSnap.data();
//     if (!userData.email || !userData.displayName) {
//       try {
//         await setDoc(userRef, {
//           email: userData.email || user.email,
//           displayName: userData.displayName || user.displayName,
//         }, { merge: true });
//         console.log(`User document updated with missing fields for ${user.email}`);
//       } catch (error) {
//         console.error("Error updating user document:", error);
//       }
//     }
//   }
// };

// ======================= PAKEITIMO PABAIGA =======================

// Funkcija tikrinti laukiančius kvietimus
const checkPendingInvites = async (user: User) => {
  try {
    // Patikriname ar vartotojas turi email
    if (!user.email) {
      console.warn('User has no email, skipping pending invites check');
      return;
    }

    // Randamos visos agentūros (be filtro, nes Firestore nepalaiko nested where su kintamais laukais)
    // Ir filtruojame client-side, kur yra pending kvietimai šiam email'ui
    const agenciesQuery = query(collection(db, DatabaseTables.agency));
    const agenciesSnapshot = await getDocs(agenciesQuery);
    const batch = writeBatch(db);
    let foundInvite = false;

    for (const agencyDoc of agenciesSnapshot.docs) {
      const agencyData = agencyDoc.data();
      const pendingInvite = agencyData.pendingInvites?.[user.email];

      if (pendingInvite) {
        foundInvite = true;
        const agencyRef = doc(db, DatabaseTables.agency, agencyDoc.id);
        const userRef = doc(db, 'users', user.uid);

        // Pridedame vartotoją prie agentūros
        batch.update(agencyRef, {
          [`members.${user.uid}`]: pendingInvite.role,
          [`pendingInvites.${user.email}`]: null // Ištrinam pending kvietimą
        });

        // Pridedame agentūrą prie vartotojo
        batch.set(userRef, {
          agencies: { [agencyDoc.id]: pendingInvite.role }
        }, { merge: true });
      }
    }

    if (foundInvite) {
      await batch.commit();
      toast.success('You have been automatically added to invited agencies!');
    }
  } catch (error) {
    console.error('Error checking pending invites:', error);
  }
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signInWithGoogle: async () => { },
  signInWithEmail: async () => { },
  signUpWithEmail: async () => { },
  signOutUser: async () => { },
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        Smartlook.init("c77bc891518947f97bd45b85985cf55313752a15", { region: 'eu' });
        Smartlook.identify(user.uid, {
          email: user.email || "",
          name: user.displayName || "",
        });
        // ======================= PRADEDAME PAKEITIMĄ ČIA =======================
        // IŠKVIEČIAME NAUJĄ FUNKCIJĄ KASKART, KAI PASIKEIČIA VARTOTOJO BŪSENA
        // NX firebase cloud functions tsi padaro
        //await createUserDocumentIfNotExists(user);
        // ======================= PAKEITIMO PABAIGA =======================
        await checkPendingInvites(user);
      }

      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // `onAuthStateChanged` atliks likusį darbą
    } catch (err) {
      setError(err as Error);
      setLoading(false); // Reset loading on error
      toast.error("Google Sign-In Failed", { description: (err as Error).message });
    } finally {
      // Nereikia setLoading(false), nes onAuthStateChanged tai padarys, but we set on error
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      setError(err as Error);
      setLoading(false); // Reset loading on error
      toast.error("Sign-In Failed", { description: (err as Error).message });
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      
      // If name is provided, update the user's profile
      if (name && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: name
        });
      }
    } catch (err) {
      setError(err as Error);
      setLoading(false); // Reset loading on error
      toast.error("Sign-Up Failed", { description: (err as Error).message });
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      toast.success("You have been logged out.");
    } catch (err) {
      setError(err as Error);
      toast.error("Logout Failed", { description: (err as Error).message });
    }
  };

  const value = { user, loading, error, signInWithGoogle, signInWithEmail, signUpWithEmail, signOutUser };

  // Rodome krovimo būseną tik pačioje pradžioje
  if (loading && user === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Sukuriame custom hook'ą patogiam naudojimui
export const useAuth = () => useContext(AuthContext);
