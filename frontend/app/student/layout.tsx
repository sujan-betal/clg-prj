import PortalShell from "@/components/PortalShell";
import RequireAuth from "@/components/RequireAuth";

const links: [string, string][] = [
  ["Overview", "/student"],
  ["Attendance", "/student/attendance"],
  ["Results", "/student/results"],
  ["Fees", "/student/fees"],
  ["Materials", "/student/materials"],
  ["Assignments", "/student/assignments"],
  ["Notices", "/student/notices"],
  ["Certificates", "/student/certificates"],
  ["Leave", "/student/leave"],
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth role="STUDENT">
      <PortalShell brand="AstraVidya" role="STUDENT" links={links}>
        {children}
      </PortalShell>
    </RequireAuth>
  );
}
