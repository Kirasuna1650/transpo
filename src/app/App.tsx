import { useState, useEffect } from "react";
import { SplashScreen } from "./components/SplashScreen";
import { OnboardingScreen } from "./components/OnboardingScreen";
import { AuthScreen } from "./components/AuthScreen";
import { HomeScreen } from "./components/HomeScreen";
import { RoutePlannerScreen } from "./components/RoutePlannerScreen";
import { LiveTrackingScreen } from "./components/LiveTrackingScreen";
import { NotificationsScreen } from "./components/NotificationsScreen";
import { SavedRoutesScreen } from "./components/SavedRoutesScreen";
import { ProfileScreen } from "./components/ProfileScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { BottomNav } from "./components/BottomNav";
import { RouteMapModal } from "./components/RouteMapModal";
import {
  clearLocalGuestProfile,
  ensureGuestUser,
  getLocalGuestProfile,
  hasLocalGuestProfile,
  loadProfile,
  profileFromUser,
  saveLocalGuestProfile,
  signInWithOAuth,
  supabase,
  upsertProfile,
  type OAuthProvider,
  type ProfileRecord,
} from "./lib/supabase";
import type { User } from "@supabase/supabase-js";

export type VehicleType = "jeepney" | "bus" | "train" | "uvexpress";
export type CapacityLevel = "available" | "limited" | "full";

export interface Vehicle {
  id: string;
  type: VehicleType;
  routeName: string;
  plateNo: string;
  capacity: CapacityLevel;
  eta: number;
  distance: string;
  occupancy: number;
  maxOccupancy: number;
  stops: string[];
  currentStop: number;
  emoji: string;
}

type AppPhase = "splash" | "onboarding" | "auth" | "app";
type AppTab = "home" | "routes" | "notifications" | "saved" | "profile";
type SubScreen = null | "tracking" | "settings";
type HomeFlow = "prompt" | "map" | "routes";

export default function App() {
  const [phase, setPhase] = useState<AppPhase>("splash");
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [homeFlow, setHomeFlow] = useState<HomeFlow>("prompt");
  const [homeActiveRouteId, setHomeActiveRouteId] = useState<string | null>(null);
  const [subScreen, setSubScreen] = useState<SubScreen>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [routeModal, setRouteModal] = useState<{ from: string; to: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (phase === "splash") {
      const t = setTimeout(() => {
        if (hasLocalGuestProfile()) {
          const localGuest = getLocalGuestProfile();
          setProfile(localGuest);
          setIsGuest(true);
          setPhase("app");
          return;
        }
        setPhase("onboarding");
      }, 2800);
      return () => clearTimeout(t);
    }
  }, [phase]);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setCurrentUser(data.session.user);
        const anonymous = Boolean(data.session.user.is_anonymous);
        setIsGuest(anonymous);
        loadProfile(data.session.user).then((nextProfile) => {
          const profileToUse = anonymous ? { ...getLocalGuestProfile(), id: data.session.user.id, email: data.session.user.email ?? null } : nextProfile;
          setProfile(profileToUse);
          void upsertProfile(profileToUse);
        });
        setPhase("app");
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
      if (session?.user) {
        const anonymous = Boolean(session.user.is_anonymous);
        setIsGuest(anonymous);
        const nextProfile = anonymous
          ? { ...getLocalGuestProfile(), id: session.user.id, email: session.user.email ?? null }
          : profileFromUser(session.user);
        setProfile(nextProfile);
        void upsertProfile(nextProfile);
        setPhase("app");
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleOAuth = async (provider: OAuthProvider) => {
    setAuthError("");
    const { error } = await signInWithOAuth(provider);
    if (error) setAuthError(error.message);
  };

  const handleGuest = () => {
    setCurrentUser(null);
    const guestProfile = getLocalGuestProfile();
    saveLocalGuestProfile(guestProfile);
    setProfile(guestProfile);
    setIsGuest(true);
    setAuthError("");
    setPhase("app");
  };

  const handleSaveProfile = async (nextProfile: ProfileRecord) => {
    if (isGuest) {
      saveLocalGuestProfile(nextProfile);
      setProfile(nextProfile);

      const { user, error } = await ensureGuestUser();
      if (error || !user) return error?.message || "Saved locally. Supabase guest sign-in is not configured yet.";

      const guestProfile = {
        ...nextProfile,
        id: user.id,
        email: user.email ?? null,
      };
      saveLocalGuestProfile(guestProfile);
      setCurrentUser(user);
      setProfile(guestProfile);
      const { error: profileError } = await upsertProfile(guestProfile);
      return profileError ? profileError.message : "Saved locally and synced to Supabase.";
    }

    if (!currentUser) return "Sign in before saving profile changes.";

    const signedInProfile = {
      ...nextProfile,
      id: currentUser.id,
      email: currentUser.email ?? nextProfile.email,
    };
    setProfile(signedInProfile);
    const { error } = await upsertProfile(signedInProfile);
    return error ? error.message : "Profile saved.";
  };

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut();
    clearLocalGuestProfile();
    setCurrentUser(null);
    setIsGuest(false);
    setProfile(null);
    setActiveTab("home");
    setSubScreen(null);
    setPhase("auth");
  };

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center justify-center w-full h-full" style={{ background: "#0a0a0a" }}>
      <div
        className="relative overflow-hidden flex flex-col"
        style={{
          width: "100%",
          maxWidth: 390,
          height: "100%",
          maxHeight: 844,
          background: "#000",
          boxShadow: "0 0 60px rgba(0,0,0,0.8)",
        }}
      >
        {children}
      </div>
    </div>
  );

  if (phase === "splash") return <Shell><SplashScreen /></Shell>;
  if (phase === "onboarding") return <Shell><OnboardingScreen onComplete={() => setPhase("auth")} /></Shell>;
  if (phase === "auth") return (
    <Shell>
      <AuthScreen onOAuth={handleOAuth} onGuest={handleGuest} authError={authError} />
    </Shell>
  );

  return (
    <Shell>
      {subScreen === "tracking" && selectedVehicle ? (
        <LiveTrackingScreen vehicle={selectedVehicle} onBack={() => setSubScreen(null)} />
      ) : subScreen === "settings" ? (
        <SettingsScreen onBack={() => setSubScreen(null)} />
      ) : (
        <>
          <div className="flex-1 overflow-hidden">
            {activeTab === "home" && (
              <HomeScreen
                user={currentUser}
                flow={homeFlow}
                activeRouteId={homeActiveRouteId}
                onFlowChange={setHomeFlow}
                onActiveRouteChange={setHomeActiveRouteId}
                onVehicleSelect={(v) => { setSelectedVehicle(v); setSubScreen("tracking"); }}
              />
            )}
            {activeTab === "routes" && (
              <RoutePlannerScreen onShowMap={(from, to) => setRouteModal({ from, to })} />
            )}
            {activeTab === "notifications" && <NotificationsScreen />}
            {activeTab === "saved" && (
              <SavedRoutesScreen onShowMap={(from, to) => setRouteModal({ from, to })} />
            )}
            {activeTab === "profile" && (
              <ProfileScreen
                user={currentUser}
                isGuest={isGuest}
                profile={profile}
                onSettings={() => setSubScreen("settings")}
                onSaveProfile={handleSaveProfile}
                onSignOut={handleSignOut}
              />
            )}
          </div>
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
        </>
      )}

      {/* Route map modal — rendered above everything including bottom nav */}
      {routeModal && (
        <RouteMapModal
          from={routeModal.from}
          to={routeModal.to}
          onClose={() => setRouteModal(null)}
        />
      )}
    </Shell>
  );
}
