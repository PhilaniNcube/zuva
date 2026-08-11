"use client";

import { useState, useTransition, ChangeEvent } from "react";
import { toast } from "sonner";
import { Upload, FileText, UserPlus, AlertCircle, CheckCircle2, Mail, Users, History } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { bulkEnrollScholars } from "../cohort-actions";

interface ScholarItem {
  name: string;
  email: string;
  country?: string;
  degree?: string;
}

interface ScholarBulkEnrollFormProps {
  cohortId: string;
  cohortStatus?: string;
  isHistorical?: boolean;
}

export function ScholarBulkEnrollForm({
  cohortId,
  cohortStatus,
  isHistorical = false,
}: ScholarBulkEnrollFormProps) {
  const isPast = isHistorical || cohortStatus === "completed";
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [rawText, setRawText] = useState("");
  const [parsedScholars, setParsedScholars] = useState<ScholarItem[]>([]);
  const [sendEmail, setSendEmail] = useState(false); // Default FALSE for bulk/past to avoid unintended notifications
  const [markOnboardingCompleted, setMarkOnboardingCompleted] = useState(isPast);

  const [result, setResult] = useState<{
    enrolledCount: number;
    skippedCount: number;
    errors: string[];
  } | null>(null);

  function parseLine(line: string): ScholarItem | null {
    const parts = line.split(/[,;\t]/).map((p) => p.trim());
    if (parts.length < 2) return null;
    const name = parts[0];
    const email = parts[1];
    const country = parts[2] || undefined;
    const degree = parts[3] || undefined;

    if (!name || !email || !email.includes("@")) return null;
    return { name, email, country, degree };
  }

  function handleTextChange(val: string) {
    setRawText(val);
    const lines = val.split("\n");
    const parsed: ScholarItem[] = [];
    for (const l of lines) {
      const item = parseLine(l);
      if (item) parsed.push(item);
    }
    setParsedScholars(parsed);
  }

  function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleTextChange(content);
      }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (parsedScholars.length === 0) {
      toast.error("No valid scholar entries found to import");
      return;
    }

    startTransition(async () => {
      const res = await bulkEnrollScholars({
        cohortId,
        scholars: parsedScholars,
        sendEmail,
        markOnboardingCompleted,
      });

      if (res.ok) {
        setResult(res.data);
        toast.success(`Successfully processed ${res.data.enrolledCount} scholars`);
      } else {
        toast.error(res.error || "Failed to import scholars");
      }
    });
  }

  function handleReset() {
    setRawText("");
    setParsedScholars([]);
    setResult(null);
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (!newOpen) {
      handleReset();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button>
            <Upload className="mr-1.5 size-4" />
            Bulk Import Scholars
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5 text-primary" />
            Bulk Import Scholars
          </DialogTitle>
          <DialogDescription>
            Import multiple scholars at once into this cohort using CSV or structured text format.
          </DialogDescription>
        </DialogHeader>

        {isPast ? (
          <div className="flex items-start gap-2.5 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300 border border-amber-500/20">
            <History className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <span className="font-semibold">Historical Import Mode:</span> Importing past scholars. Invitation emails to scholars & coaches are suppressed by default.
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 rounded-lg bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
            <Mail className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <div>
              <span className="font-semibold">Current Import Mode:</span> Active cohort bulk enrolment.
            </div>
          </div>
        )}

        {result ? (
          <div className="flex flex-col gap-4 py-2">
            <div className="rounded-lg border bg-muted/40 p-4 text-sm space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="size-5" />
                <span>Import Complete</span>
              </div>
              <p>
                Successfully enrolled <span className="font-semibold text-foreground">{result.enrolledCount}</span> scholar(s).
              </p>

              {result.skippedCount > 0 && (
                <div className="text-amber-600 dark:text-amber-400 text-xs space-y-1 pt-2 border-t">
                  <p className="font-semibold flex items-center gap-1">
                    <AlertCircle className="size-3.5" />
                    Skipped or had errors ({result.skippedCount}):
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 max-h-32 overflow-y-auto">
                    {result.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-2">
            <Tabs defaultValue="paste" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="paste" className="flex items-center gap-1.5">
                  <FileText className="size-3.5" />
                  Paste Text / CSV
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-1.5">
                  <Upload className="size-3.5" />
                  Upload CSV File
                </TabsTrigger>
              </TabsList>

              <TabsContent value="paste" className="pt-3">
                <Field>
                  <FieldLabel className="text-xs">
                    Paste scholar entries (Format: <code className="font-mono text-primary">Name, Email, Country, Degree</code>)
                  </FieldLabel>
                  <Textarea
                    value={rawText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder={`Ama Mensah, ama@example.com, Ghana, Master of Science\nKofi Baah, kofi@example.com, Nigeria, PhD Economics`}
                    rows={5}
                    className="font-mono text-xs"
                  />
                </Field>
              </TabsContent>

              <TabsContent value="upload" className="pt-3">
                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                  <Upload className="size-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Select a CSV file to upload</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">
                    Columns: Name, Email, Country (optional), Degree (optional)
                  </p>
                  <Input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="max-w-xs text-xs"
                  />
                </div>
              </TabsContent>
            </Tabs>

            {parsedScholars.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Parsed Preview ({parsedScholars.length} scholars found)</span>
                </p>
                <div className="max-h-40 overflow-y-auto rounded-md border text-xs">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Degree</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedScholars.map((s, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell>{s.email}</TableCell>
                          <TableCell>{s.country || "—"}</TableCell>
                          <TableCell>{s.degree || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2 border-t">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <Mail className="size-3.5 text-muted-foreground" />
                    <Label htmlFor="bulk-send-email-switch">Send invitation emails</Label>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Sends account credentials email to imported scholars. Kept OFF by default so past scholars/coaches are not notified.
                  </p>
                </div>
                <Switch
                  id="bulk-send-email-switch"
                  checked={sendEmail}
                  onCheckedChange={setSendEmail}
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <CheckCircle2 className="size-3.5 text-muted-foreground" />
                    <Label htmlFor="bulk-onboarding-switch">Mark onboarding as completed</Label>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Flags scholars as having already completed onboarding (recommended for historical scholars).
                  </p>
                </div>
                <Switch
                  id="bulk-onboarding-switch"
                  checked={markOnboardingCompleted}
                  onCheckedChange={setMarkOnboardingCompleted}
                />
              </div>
            </div>

            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleImport}
                disabled={isPending || parsedScholars.length === 0}
              >
                {isPending
                  ? "Importing…"
                  : `Import ${parsedScholars.length} Scholar${parsedScholars.length === 1 ? "" : "s"}`}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
