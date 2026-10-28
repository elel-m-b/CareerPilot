import { api } from "@/api/endpoints";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useComingSoon } from "@/components/ComingSoon";
import { Panel } from "@/components/Panel";
import { CvUploadDialog } from "@/components/cv/CvUploadDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useResource } from "@/hooks/use-resource";
import type { Resume } from "@/api/types";
import { describeError } from "@/lib/cv/report";
import { formatBytes } from "@/lib/cv/validation";
import { TONE_TEXT, formatRelative, scoreTone, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Download,
  FileText,
  MoreHorizontal,
  Pencil,
  ScanLine,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

function formatLabel(fileType: string, name: string): string {
  if (fileType.includes("pdf") || name.toLowerCase().endsWith(".pdf")) return "PDF";
  if (fileType.includes("word") || name.toLowerCase().endsWith(".docx")) return "DOCX";
  return titleCase(fileType.split("/").pop() ?? "file");
}

function ScorePill({ score }: { score: number | null }) {
  if (score === null) return <span className="text-sm text-muted-foreground">—</span>;
  return (
    <span className={cn("text-sm tabular-nums", TONE_TEXT[scoreTone(score)])}>{score}%</span>
  );
}

export default function MyCv() {
  const resumes = useResource(() => api.resumes.list(), []);
  const navigate = useNavigate();
  const { showComingSoon } = useComingSoon();

  const [deleting, setDeleting] = useState<Resume | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await api.resumes.remove(deleting.id);
      toast.success("CV deleted.");
      setDeleting(null);
      resumes.reload();
    } catch (cause) {
      toast.error(describeError(cause, "We could not delete that CV."));
    } finally {
      setBusy(false);
    }
  }

  const rows = resumes.data ?? [];
  const current = rows[0];

  return (
    <AppShell area="My CV">
      <PageHeader
        eyebrow="CV library"
        title="My CV"
        description="Every document you upload keeps its own scan history, so you can compare reports and see whether an edit actually improved the score."
        actions={
          <CvUploadDialog
            trigger={
              <Button className="gap-2">
                <Upload className="size-4" />
                Scan a CV
              </Button>
            }
            onUploaded={(resumeId) => navigate(`/cv/${resumeId}`)}
          />
        }
      />

      {resumes.loading ? (
        <div className="mt-10 flex flex-col gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : resumes.error ? (
        <Alert variant="destructive" className="mt-10 rounded-md">
          <AlertCircle className="size-4" />
          <AlertTitle className="text-sm">We could not load your CVs</AlertTitle>
          <AlertDescription className="text-sm leading-relaxed">
            {resumes.error.message}
          </AlertDescription>
        </Alert>
      ) : rows.length === 0 ? (
        <div className="mt-12 rounded-md border border-dashed border-border">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-6 py-16 text-center">
            <span className="grid size-10 place-items-center rounded-md border border-border">
              <FileText className="size-4 text-muted-foreground" />
            </span>
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-medium tracking-tight text-foreground">
                Your CV library is empty
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Upload a text-based PDF or DOCX file up to 10 MB. Scanned images have no text layer,
                so they cannot be analysed — export the document again from your editor.
              </p>
            </div>
            <CvUploadDialog
              trigger={
                <Button className="gap-2">
                  <Upload className="size-4" />
                  Upload my CV
                </Button>
              }
              onUploaded={(resumeId) => navigate(`/cv/${resumeId}`)}
            />
          </div>
        </div>
      ) : (
        <div className="mt-10 flex flex-col gap-6">
          {current && (
            <Panel
              title="Most recent CV"
              action={
                <Button size="sm" variant="outline" onClick={() => navigate(`/cv/${current.id}`)}>
                  Open report
                </Button>
              }
            >
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <span
                    className={cn(
                      "text-4xl font-medium tabular-nums tracking-[-0.03em]",
                      TONE_TEXT[scoreTone(current.latestScore ?? undefined)],
                    )}
                  >
                    {current.latestScore !== null ? `${current.latestScore}%` : "—"}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {current.originalFilename}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {formatLabel(current.fileType, current.originalFilename)} ·{" "}
                      {formatBytes(current.fileSize)} · uploaded{" "}
                      {formatRelative(Date.parse(current.uploadedAt))}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {current.latestAnalysisId
                        ? "Scored by the deterministic seven-dimension engine."
                        : "Not scored yet — open the report to run the first scan."}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => showComingSoon("Downloading the original file")}
                  >
                    <Download className="size-4" />
                    Download
                  </Button>
                  <CvUploadDialog
                    trigger={
                      <Button size="sm" variant="outline" className="gap-2">
                        <Upload className="size-4" />
                        Upload another
                      </Button>
                    }
                    onUploaded={(resumeId) => navigate(`/cv/${resumeId}`)}
                  />
                </div>
              </div>
            </Panel>
          )}

          <Panel title={`All CVs (${rows.length})`} bodyClassName="px-0 py-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/80 hover:bg-transparent">
                  <TableHead className="pl-6 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Document
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Format
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Score
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Uploaded
                  </TableHead>
                  <TableHead className="pr-6 text-right text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} className="border-border/80">
                    <TableCell className="pl-6 align-top whitespace-normal">
                      <div className="flex flex-col gap-1">
                        <Link
                          to={`/cv/${row.id}`}
                          className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                        >
                          {row.originalFilename}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {formatBytes(row.fileSize)} ·{" "}
                          {formatRelative(Date.parse(row.uploadedAt))}
                        </span>
                        {row.id === current?.id && (
                          <span className="w-fit rounded-[3px] border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-foreground">
                            Most recent
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-sm text-foreground">
                      {formatLabel(row.fileType, row.originalFilename)}
                    </TableCell>
                    <TableCell className="align-top">
                      <ScorePill score={row.latestScore} />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {row.latestAnalysisId ? "Latest scan" : "Not scanned"}
                      </p>
                    </TableCell>
                    <TableCell className="align-top text-xs text-muted-foreground">
                      {formatRelative(Date.parse(row.uploadedAt))}
                    </TableCell>
                    <TableCell className="pr-6 align-top text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${row.originalFilename}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => navigate(`/cv/${row.id}`)}>
                            <ScanLine className="size-4" />
                            Open report
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => showComingSoon("Downloading the original file")}
                          >
                            <Download className="size-4" />
                            Download file
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={row.id === current?.id}
                            onClick={() => showComingSoon("Choosing a current CV")}
                          >
                            <Star className="size-4" />
                            Set as current
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => showComingSoon("Renaming a CV")}>
                            <Pencil className="size-4" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-critical focus:text-critical"
                            onClick={() => setDeleting(row)}
                          >
                            <Trash2 className="size-4" />
                            Delete CV
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Deleting a CV also deletes every analysis recorded for it. Original-file download,
            renaming and choosing a current version are not implemented yet and show a Coming Soon
            notice.
          </p>
        </div>
      )}

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-medium tracking-tight">
              Delete “{deleting?.originalFilename}”?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-relaxed">
              This removes the stored document and every analysis recorded for it. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              disabled={busy}
              className="bg-critical text-white hover:bg-critical/90"
            >
              {busy ? "Deleting…" : "Delete CV"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
