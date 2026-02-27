import { Navigation } from "@/components/Navigation";
import { Check } from "lucide-react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, updateProfileMutation, updateEmailMutation, updatePasswordMutation } = useAuth();

console.log("user: ", user);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");

  const [goal, setGoal] = useState(user?.onboarding.goal[0] ?? "");
  const [platform, setPlatform] = useState(user?.onboarding.platform ?? "");
  const [product_type, setProductType] = useState(user?.onboarding.productType ?? "");
  const [level, setLevel] = useState(user?.onboarding.level ?? "");


  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");

  useEffect(() => {
    setEmail(user?.email ?? "");
    setFirstName(user?.firstName ?? "");
    setLastName(user?.lastName ?? "");
    setGoal(user?.onboarding.goal[0] ?? "");
    setPlatform(user?.onboarding.platform ?? "");
    setProductType(user?.onboarding.productType ?? "");
    setLevel(user?.onboarding.level ?? "");
  }, [user]);

  const saveName = async () => {
    try {
      await updateProfileMutation.mutateAsync({ firstName, lastName });
      toast({ title: "Profilo aggiornato" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Errore", description: e.message });
    }
  };

  const changeEmail = async () => {
    try {
      await updateEmailMutation.mutateAsync({ newEmail: email, currentPassword });
      toast({ title: "Email aggiornata" });
      setCurrentPassword("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Errore", description: e.message });
    }
  };

  const changePassword = async () => {
    if (newPassword !== newPassword2) {
      toast({ variant: "destructive", title: "Errore", description: "Le password non coincidono" });
      return;
    }
    try {
      await updatePasswordMutation.mutateAsync({ currentPassword, newPassword });
      toast({ title: "Password aggiornata" });
      setCurrentPassword("");
      setNewPassword("");
      setNewPassword2("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Errore", description: e.message });
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navigation />

      <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-2xl mx-auto space-y-8">
          <h1 className="text-2xl font-bold">Profilo</h1>
{/* <table width="100%" border="1">
<tr>
<td width="50%">*/}
          {/* Dati base */}
          <div className="space-y-4 p-4 border rounded-xl bg-white">
            <h2 className="font-semibold">Dati personali</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div>
                <Label>Cognome</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <Button onClick={saveName} disabled={updateProfileMutation.isPending}>
              Salva
            </Button>

            {/* Email */}
            <div className="space-y-4 p-4 border rounded-xl bg-white">
              <h2 className="font-semibold">Email</h2>
              <div>
                <Label>Nuova email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled/>
              </div>
            </div>
          </div>
{/*</td>
<td width="50%">*/}
            {/* OnBoarding */}
            <div className="space-y-4 p-4 border rounded-xl bg-white">
              <h2 className="font-semibold">OnBoarding</h2>
              <div>
                <Label>Obiettivo principale</Label>
                <Input type="goal" value={goal} onChange={(e) => setGoal(e.target.value)} disabled/>
              </div>
              <div>
                <Label>Dove è il tuo pubblico</Label>
                <Input type="platform" value={platform} onChange={(e) => setGoal(e.target.value)} disabled/>
              </div>

              <div>
                <Label>Cosa vendi</Label>
                <Input height="20" size="60" type="product_type" value={product_type} onChange={(e) => setGoal(e.target.value)} disabled/>
              </div>
              <div>
                <Label>Il tuo livello di esperienza</Label>
                <Input type="level" value={level} onChange={(e) => setGoal(e.target.value)} disabled/>
              </div>
            </div>
{/*</td>
</tr>
</table>*/}


{/*           <div>*/}
{/*              <Label>Password attuale (per conferma)</Label>*/}
{/*             <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />*/}
{/*            </div>*/}
{/*            <Button onClick={changeEmail} disabled={updateEmailMutation.isPending}>*/}
{/*              Aggiorna email*/}
{/*            </Button>*/}
{/*          </div>*/}
	
          {/* Password */}
{/*          <div className="space-y-4 p-4 border rounded-xl bg-white">
            <h2 className="font-semibold">Password</h2>
            <div>
              <Label>Password attuale</Label>
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nuova password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div>
                <Label>Conferma nuova password</Label>
                <Input type="password" value={newPassword2} onChange={(e) => setNewPassword2(e.target.value)} />
              </div>
            </div>
            <Button onClick={changePassword} disabled={updatePasswordMutation.isPending}>
              Cambia password
            </Button>
          </div>*/}
        </div>
      </main>
    </div>
  );
}
