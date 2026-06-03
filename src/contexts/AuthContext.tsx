// Third-party imports
import React, { useEffect, useMemo, useState, useRef } from "react";
import { Session } from "@supabase/supabase-js";

// Supabase client
import { supabase } from "@/integrations/supabase/client";

// UI components
import { toast } from "@/components/ui/use-toast";

// Import context and types from definition file
import { AuthContext, User, RegistrationData } from "./AuthContextDefinition";

// Import database types
import { Database } from "@/integrations/supabase/types";

const isLocalPreviewAuth =
  import.meta.env.VITE_MOCK_AUTH === "true" ||
  import.meta.env.VITE_SUPABASE_PROJECT_ID === "dummy-project" ||
  import.meta.env.VITE_SUPABASE_URL?.includes("dummy-project") ||
  (import.meta.env.DEV &&
    (!import.meta.env.VITE_SUPABASE_URL ||
      !import.meta.env.VITE_SUPABASE_ANON_KEY));

const MOCK_PASSWORD = "Password123";

const mockUsers: Record<string, User & { isMockUser: true }> = {
  "admin@demo.local": {
    id: "11111111-1111-4111-8111-111111111111",
    email: "admin@demo.local",
    namaBisnis: "Baskit Internal",
    kota: "Jakarta",
    role: "admin",
    status: "active",
    isApproved: true,
    profileComplete: true,
    isMockUser: true,
  },
  "distributor@demo.local": {
    id: "22222222-2222-4222-8222-222222222222",
    email: "distributor@demo.local",
    namaBisnis: "PT Demo Distributor Aktif",
    kota: "Jakarta Selatan",
    role: "user",
    status: "active",
    isApproved: true,
    profileComplete: true,
    isMockUser: true,
  },
  "pending@demo.local": {
    id: "33333333-3333-4333-8333-333333333333",
    email: "pending@demo.local",
    namaBisnis: "CV Demo Menunggu Approval",
    kota: "Kota Bandung",
    role: "user",
    status: "pending",
    isApproved: false,
    profileComplete: true,
    isMockUser: true,
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const loadUserSession = async (session: Session | null) => {
      if (session) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from("distributor_profiles")
            .select("*")
            .eq("user_id", session.user.id)
            .maybeSingle<
              Database["public"]["Tables"]["distributor_profiles"]["Row"]
            >();

          if (profileError && profileError.code !== "PGRST116") {
            console.error("Error fetching profile:", profileError);
          }
          const userStatus =
            (profile?.status as
              | "pending"
              | "active"
              | "inactive"
              | "rejected") || "pending";

          const profileComplete = Boolean(
            profile?.nama_bisnis &&
              profile?.alamat_lengkap &&
              profile?.kota &&
              profile?.nama_pemilik &&
              profile?.kontak_pemilik &&
              profile?.email_pemilik
          );

          const userData = {
            id: session.user.id,
            email: session.user.email || "",
            namaBisnis: profile?.nama_bisnis,
            kota: profile?.kota,
            role: session.user.app_metadata?.role || "user",
            status: userStatus,
            isApproved: userStatus === "active",
            profileComplete: profileComplete,
          };

          setUser(userData);
          localStorage.setItem("baskit_user", JSON.stringify(userData));
        } catch (err) {
          console.error("Profile fetch error:", err);
          const userData = {
            id: session.user.id,
            email: session.user.email || "",
            role: session.user.app_metadata?.role || "user",
            status: "pending" as const,
            isApproved: false,
          };

          setUser(userData);
          localStorage.setItem("baskit_user", JSON.stringify(userData));
        }
      } else {
        setUser(null);
        localStorage.removeItem("baskit_user");
      }
    };

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          await loadUserSession(session);
        } else {
          const stored = localStorage.getItem("baskit_user");
          if (stored) {
            try {
              const userData = JSON.parse(stored);
              const uuidRegex =
                /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

              if (userData.id && uuidRegex.test(userData.id)) {
                setUser(userData);
              } else {
                console.warn(
                  "Invalid user ID in localStorage, clearing stored user data"
                );
                localStorage.removeItem("baskit_user");
              }
            } catch (err) {
              console.error("Error parsing stored user data:", err);
              localStorage.removeItem("baskit_user");
            }
          }
        }
      } catch (error) {
        console.error("Session initialization error:", error);
        const stored = localStorage.getItem("baskit_user");
        if (stored) {
          try {
            const userData = JSON.parse(stored);
            // Validate that user ID is a proper UUID format
            const uuidRegex =
              /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

            if (userData.id && uuidRegex.test(userData.id)) {
              setUser(userData);
            } else {
              console.warn(
                "Invalid user ID in localStorage, clearing stored user data"
              );
              localStorage.removeItem("baskit_user");
            }
          } catch (err) {
            console.error("Error parsing stored user data:", err);
            localStorage.removeItem("baskit_user");
          }
        }
      } finally {
        setIsLoading(false);
        isInitializedRef.current = true;
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isInitializedRef.current) return;

      if (event === "SIGNED_OUT") {
        setUser(null);
        localStorage.removeItem("baskit_user");
      } else if (event === "SIGNED_IN" && session) {
        await loadUserSession(session);
      } else if (event === "TOKEN_REFRESHED" && session) {
        await loadUserSession(session);
      }
    });

    // Auto-logout when session is expired
    const sessionMonitor = setInterval(async () => {
      if (isLocalPreviewAuth) {
        try {
          const stored = localStorage.getItem("baskit_user");
          const storedUser = stored ? JSON.parse(stored) : null;
          if (storedUser?.isMockUser) return;
        } catch {
          // Continue with the normal session check if local storage is malformed.
        }
      }

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // If no session or expired, force logout
        if (!session || (session.expires_at && session.expires_at * 1000 <= Date.now())) {
          await supabase.auth.signOut();
          setUser(null);
          localStorage.removeItem("baskit_user");
          toast({
            title: "Sesi Berakhir",
            description: "Sesi Anda telah berakhir. Silakan masuk kembali.",
            variant: "destructive",
          });
        }
      } catch (e) {
        // If getSession fails unexpectedly, ensure user is logged out to avoid stale state
        await supabase.auth.signOut();
        setUser(null);
        localStorage.removeItem("baskit_user");
      }
    }, 60_000); // check every 60 seconds

    initializeAuth();

    return () => {
      subscription.unsubscribe();
      clearInterval(sessionMonitor);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      if (isLocalPreviewAuth) {
        const normalizedEmail = email.trim().toLowerCase();
        const mockUser = mockUsers[normalizedEmail];

        if (mockUser) {
          if (password !== MOCK_PASSWORD) {
            throw new Error("Password demo salah. Gunakan Password123.");
          }

          setUser(mockUser);
          localStorage.setItem("baskit_user", JSON.stringify(mockUser));

          toast({
            title: "Login Demo Berhasil",
            description: `Masuk sebagai ${mockUser.email}.`,
            variant: "default",
          });

          return;
        }
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error("Login failed. No user data returned.");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Terjadi kesalahan";
      console.error("Login error:", errorMessage);

      toast({
        title: "Login Gagal",
        description:
          errorMessage || "Terjadi kesalahan saat login. Silakan coba lagi.",
        variant: "destructive",
      });

      throw error;
    }
  };

  const register = async (data: RegistrationData) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: "user",
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        let profileError = null;

        const profileData = {
          user_id: authData.user.id,
          email: data.email,
          nama_bisnis: data.namaBisnis,
          alamat_lengkap: data.alamatLengkap,
          kota: data.kota,
          nama_pemilik: data.namaPemilik,
          kontak_pemilik: data.kontakPemilik,
          status: "pending",
          province_id: data.provinsiId || null,
          province_name: data.provinceName || null,
          regency_id: data.regencyId || null,
          regency_name: data.regencyName || null,
          district_id: data.districtId || null,
          district_name: data.districtName || null,
          email_perusahaan: data.emailPerusahaan || null,
          nomor_telp_perusahaan: data.nomorTelpPerusahaan || null,
          nama_direktur: data.namaDirektur || null,
          status_pkp: data.statusPkp || "Non-PKP",
          npwp_number: data.npwpNumber || null,
          nib_number: data.nibNumber || null,
          store_photo_url: data.storePhotoUrl || null,
          ktp_url: data.ktpUrl || null,
          akta_url: data.aktaUrl || null,
          npwp_url: data.npwpUrl || null,
        };

        try {
          const { data: insertResult, error } = await (
            supabase.from("distributor_profiles") as unknown as {
              insert: (data: typeof profileData | (typeof profileData)[]) => {
                select: () => Promise<{ data: unknown; error: unknown }>;
              };
            }
          )
            .insert(profileData)
            .select();

          if (error) {
            console.error("Profile creation error:", error);
          }
          profileError = error;
        } catch (err) {
          console.error("Profile creation exception:", err);
          profileError = {
            message: "Failed to create profile due to exception",
          };
        }

        if (profileError) {
          throw new Error(`Profile creation failed: ${profileError.message}`);
        } else {
          toast({
            title: "Pendaftaran Berhasil",
            description: "Akun distributor Anda telah berhasil dibuat.",
            variant: "default",
          });
        }

        const userData: User = {
          id: authData.user.id,
          email: data.email,
          namaBisnis: data.namaBisnis,
          kota: data.kota,
          role: "user",
          status: "pending",
          isApproved: false,
        };

        setUser(userData);
        localStorage.setItem("baskit_user", JSON.stringify(userData));
      }
    } catch (error: unknown) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out from Supabase:", error);
    }

    localStorage.removeItem("baskit_user");
    setUser(null);

    toast({
      title: "Logout Berhasil",
      description: "Anda telah berhasil keluar dari akun.",
      variant: "default",
    });
  };

  const value = useMemo(
    () => ({ user, isLoading, login, register, logout }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
