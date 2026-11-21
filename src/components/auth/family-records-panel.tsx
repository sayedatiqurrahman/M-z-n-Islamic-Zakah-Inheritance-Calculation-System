"use client";

import { useEffect, useMemo, useState } from "react";
import { GitBranch, Loader2, Plus, Shield, Trash2, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Person = {
  id: string;
  fullName: string;
  gender: "MALE" | "FEMALE" | null;
  dateOfBirth: string | null;
  dateOfDeath: string | null;
  isDeceased: boolean;
  email: string | null;
  relationToOwner: string | null;
  notes: string | null;
  nidMasked: string | null;
  deathCertificateMasked: string | null;
  identityVerificationStatus: "UNDECLARED" | "SELF_DECLARED" | "PENDING_REVIEW" | "VERIFIED" | "REJECTED";
};

type Relationship = {
  id: string;
  fromPersonId: string;
  toPersonId: string;
  relationType: "PARENT_OF" | "SPOUSE_OF" | "SIBLING_OF" | "GUARDIAN_OF" | "OTHER";
  notes: string | null;
};

const emptyPerson = {
  fullName: "",
  gender: "",
  dateOfBirth: "",
  dateOfDeath: "",
  isDeceased: false,
  email: "",
  relationToOwner: "",
  notes: "",
  nidNumber: "",
  deathCertificateNumber: "",
};

function statusLabel(s: Person["identityVerificationStatus"]) {
  return s.replace(/_/g, " ");
}

export function FamilyRecordsPanel() {
  const [loading, setLoading] = useState(true);
  const [people, setPeople] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...emptyPerson });
  const [relForm, setRelForm] = useState({ fromPersonId: "", toPersonId: "", relationType: "PARENT_OF" as Relationship["relationType"] });
  const [relSaving, setRelSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/account/family", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed");
      setPeople(data.people ?? []);
      setRelationships(data.relationships ?? []);
    } catch {
      toast.error("Unable to load family records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const personById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  const createPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/account/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          gender: form.gender || null,
          dateOfBirth: form.dateOfBirth || null,
          dateOfDeath: form.dateOfDeath || null,
          email: form.email || null,
          relationToOwner: form.relationToOwner || null,
          notes: form.notes || null,
          nidNumber: form.nidNumber || null,
          deathCertificateNumber: form.deathCertificateNumber || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed");
      setOpen(false);
      setForm({ ...emptyPerson });
      toast.success("Family record saved.");
      await load();
    } catch (err: any) {
      toast.error(err?.message || "Unable to save record.");
    } finally {
      setSaving(false);
    }
  };

  const removePerson = async (id: string) => {
    if (!window.confirm("Delete this family record?")) return;
    const res = await fetch(`/api/account/family/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Unable to delete record."); return; }
    toast.success("Record deleted.");
    await load();
  };

  const addRelationship = async () => {
    if (!relForm.fromPersonId || !relForm.toPersonId) return;
    setRelSaving(true);
    try {
      const res = await fetch("/api/account/family/relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(relForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed");
      setRelForm({ fromPersonId: "", toPersonId: "", relationType: "PARENT_OF" });
      toast.success("Relationship saved.");
      await load();
    } catch (err: any) {
      toast.error(err?.message || "Unable to save relationship.");
    } finally {
      setRelSaving(false);
    }
  };

  const removeRelationship = async (id: string) => {
    const res = await fetch(`/api/account/family/relationships/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.error("Unable to remove relationship."); return; }
    toast.success("Relationship removed.");
    await load();
  };

  return (
    <div className="space-y-6">
      <Card className="border-emerald-100">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">Family & Nasab Records</CardTitle>
            <CardDescription>
              Maintain family records, heir relationships, and identity verification details privately in your account. Sensitive identifiers are stored securely and only visible to you.
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-700 hover:bg-emerald-800"><Plus className="size-4" /> Add person</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader><DialogTitle>Add family / heir record</DialogTitle></DialogHeader>
              <form onSubmit={createPerson} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Full name</Label>
                  <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required maxLength={200} />
                </div>
                <div className="space-y-1.5">
                  <Label>Gender</Label>
                  <Select value={form.gender || "none"} onValueChange={(v) => setForm({ ...form, gender: v === "none" ? "" : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Relation to owner</Label>
                  <Input value={form.relationToOwner} onChange={(e) => setForm({ ...form, relationToOwner: e.target.value })} placeholder="Father, Son, Spouse, etc." />
                </div>
                <div className="space-y-1.5">
                  <Label>Date of birth</Label>
                  <Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Date of death</Label>
                  <Input type="date" value={form.dateOfDeath} onChange={(e) => setForm({ ...form, dateOfDeath: e.target.value, isDeceased: Boolean(e.target.value) || form.isDeceased })} />
                </div>
                <div className="space-y-1.5">
                  <Label>NID number (private)</Label>
                  <Input value={form.nidNumber} onChange={(e) => setForm({ ...form, nidNumber: e.target.value })} placeholder="Stored securely" />
                </div>
                <div className="space-y-1.5">
                  <Label>Death certificate number (private)</Label>
                  <Input value={form.deathCertificateNumber} onChange={(e) => setForm({ ...form, deathCertificateNumber: e.target.value })} placeholder="Stored securely" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Email (optional)</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
                </div>
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input type="checkbox" checked={form.isDeceased} onChange={(e) => setForm({ ...form, isDeceased: e.target.checked })} />
                  Mark as deceased
                </label>
                <div className="sm:col-span-2 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={saving} className="bg-emerald-700 hover:bg-emerald-800">
                    {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Save record
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            <Shield className="mr-1 inline size-3.5" /> Privacy-first: family records are private to your account. For identity verification, providing any one of NID, date of birth, or death certificate number is sufficient. Sensitive identifiers are stored encrypted and displayed only as masked values; external legal/government verification is not performed automatically.
          </div>
        </CardContent>
      </Card>

      <Card className="border-emerald-100">
        <CardHeader>
          <CardTitle className="text-base">Nasab / Heir Chain</CardTitle>
          <CardDescription>Link people to preserve lineage and inheritance relationships. Use “Parent of” to build descent chains.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_1fr_auto]">
            <Select value={relForm.fromPersonId} onValueChange={(v) => setRelForm({ ...relForm, fromPersonId: v })}>
              <SelectTrigger><SelectValue placeholder="From person" /></SelectTrigger>
              <SelectContent>{people.map((p) => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={relForm.relationType} onValueChange={(v) => setRelForm({ ...relForm, relationType: v as Relationship["relationType"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PARENT_OF">Parent of</SelectItem>
                <SelectItem value="SPOUSE_OF">Spouse of</SelectItem>
                <SelectItem value="SIBLING_OF">Sibling of</SelectItem>
                <SelectItem value="GUARDIAN_OF">Guardian of</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={relForm.toPersonId} onValueChange={(v) => setRelForm({ ...relForm, toPersonId: v })}>
              <SelectTrigger><SelectValue placeholder="To person" /></SelectTrigger>
              <SelectContent>{people.map((p) => <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={() => void addRelationship()} disabled={relSaving || !relForm.fromPersonId || !relForm.toPersonId || relForm.fromPersonId === relForm.toPersonId}>
              {relSaving ? <Loader2 className="size-4 animate-spin" /> : <GitBranch className="size-4" />} Link
            </Button>
          </div>
          {relationships.length > 0 ? (
            <div className="space-y-2">
              {relationships.map((r) => {
                const from = personById.get(r.fromPersonId);
                const to = personById.get(r.toPersonId);
                return (
                  <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                    <div className="min-w-0">
                      <span className="font-medium">{from?.fullName ?? r.fromPersonId}</span>
                      <span className="mx-2 text-muted-foreground">{r.relationType.replace(/_/g, " ").toLowerCase()}</span>
                      <span className="font-medium">{to?.fullName ?? r.toPersonId}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => void removeRelationship(r.id)}><Trash2 className="size-4" /></Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No relationships added yet.</p>
          )}
        </CardContent>
      </Card>

      <Card className="border-emerald-100">
        <CardHeader>
          <CardTitle className="text-base">Saved people</CardTitle>
          <CardDescription>Deceased persons, heirs, and family members saved to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading...</div>
          ) : people.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No family records yet. Add a person to start building nasab/heir records.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {people.map((p) => (
                <div key={p.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"><UserRound className="size-5" /></span>
                      <div>
                        <p className="font-medium">{p.fullName}</p>
                        <p className="text-xs text-muted-foreground">{p.relationToOwner || "Family record"}{p.isDeceased ? " · Deceased" : ""}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => void removePerson(p.id)}><Trash2 className="size-4" /></Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline">{statusLabel(p.identityVerificationStatus)}</Badge>
                    {p.nidMasked && <Badge variant="secondary">NID {p.nidMasked}</Badge>}
                    {p.deathCertificateMasked && <Badge variant="secondary">Death cert {p.deathCertificateMasked}</Badge>}
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {p.dateOfBirth && <p>DOB: {p.dateOfBirth}</p>}
                    {p.dateOfDeath && <p>Date of death: {p.dateOfDeath}</p>}
                    {p.email && <p>Email: {p.email}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
