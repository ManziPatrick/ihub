import React from "react";

/* ─── Helpers (kept local so the print doc is self-contained) ─── */
function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? "—" : dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "—";
  }
}

function fmtRWF(n: number | null | undefined): string {
  return `${(n || 0).toLocaleString()} RWF`;
}

/* ─── Reusable print blocks ─── */

function PrintSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 print:mb-5">
      <h3 className="text-[13px] font-bold uppercase tracking-widest text-gray-700 border-b-2 border-gray-300 pb-1.5 mb-2.5 print:break-after-avoid">
        {title}
      </h3>
      {children}
    </section>
  );
}

function PrintTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full border-collapse print:w-full">
      <thead>
        <tr>
          {headers.map((h) => (
            <th
              key={h}
              className="text-left text-[10px] uppercase tracking-wider text-gray-600 font-bold bg-gray-100 px-2 py-1.5 border border-gray-300"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function PrintCell({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <td className={`text-[11px] text-gray-800 px-2 py-1.5 border border-gray-300 align-top ${right ? "text-right" : ""}`}>
      {children}
    </td>
  );
}

function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-[11px] text-gray-500 px-2 py-3 border border-gray-300 text-center italic">
        {text}
      </td>
    </tr>
  );
}

/* ─── Summary metrics grid ─── */

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-gray-300 rounded px-2.5 py-2 print:break-inside-avoid">
      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{label}</p>
      <p className="text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}

/* ─── Main print document ─── */

export default function ReportPrintDocument({ report }: { report: any }) {
  const { user, stats, courses, grades, projects, internships, createdCourses, createdPrograms, managedStudents, applications } = report;
  const isStaff = user.role === "admin" || user.role === "trainer" || user.role === "super_admin";
  const isStudent = user.role === "student";
  const generatedAt = new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });

  const staffMetrics = [
    { label: "Created Courses", value: stats.totalCreatedCourses },
    { label: "Programs Created", value: stats.totalCreatedPrograms },
    { label: "Students Managed", value: stats.totalManagedStudents },
    { label: "Revenue", value: fmtRWF(stats.revenue) },
    { label: "Submissions", value: stats.totalSubmissions },
    { label: "Avg Grade", value: stats.averageGrade ?? "—" },
  ];

  const studentMetrics = [
    { label: "Courses", value: stats.totalCourses },
    { label: "Courses Completed", value: stats.totalCoursesCompleted },
    { label: "Lessons Done", value: stats.totalLessonsCompleted },
    { label: "Applications", value: stats.totalApplications },
    { label: "Projects", value: stats.totalProjects },
    { label: "Avg Grade", value: stats.averageGrade ?? "—" },
  ];

  const metrics = isStaff ? staffMetrics : studentMetrics;

  return (
    <div className="bg-white text-gray-900 p-6 print:p-0" style={{ fontFamily: "'Outfit', 'Segoe UI', Arial, sans-serif" }}>
      {/* ── Letterhead ── */}
      <div className="flex items-start justify-between mb-5 pb-4 border-b-2 border-gray-300 print:break-after-avoid">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Full User Report</h1>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Generated {generatedAt} · Platform report
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-gray-900">{user.fullName || user.username}</p>
          <p className="text-[11px] text-gray-600">{user.email}</p>
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-1">{user.role?.replace("_", " ")}</p>
        </div>
      </div>

      {/* ── Contact strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 print:break-inside-avoid">
        <Metric label="Joined" value={fmtDate(user.createdAt)} />
        <Metric label="Location" value={user.location || "—"} />
        <Metric label="School" value={user.school || "—"} />
        <Metric label="Phone" value={user.phone || "—"} />
      </div>

      {/* ── Summary metrics ── */}
      <PrintSection title="Summary">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 print:break-inside-avoid">
          {metrics.map((m) => (
            <Metric key={m.label} label={m.label} value={m.value} />
          ))}
        </div>
      </PrintSection>

      {/* ── Staff: Created Courses ── */}
      {isStaff && (
        <PrintSection title={`Created Courses (${createdCourses.length})`}>
          <PrintTable headers={["Course", "Category", "Level", "Students", "Modules", "Price", "Status"]}>
            {createdCourses.length === 0 ? (
              <EmptyRow colSpan={7} text="No courses created" />
            ) : (
              createdCourses.map((c: any) => (
                <tr key={c.id} className="print:break-inside-avoid">
                  <PrintCell>{c.title}</PrintCell>
                  <PrintCell>{c.category || "—"}</PrintCell>
                  <PrintCell>{c.level || "—"}</PrintCell>
                  <PrintCell right>{c.studentsEnrolledCount}</PrintCell>
                  <PrintCell right>{c.modulesCount}</PrintCell>
                  <PrintCell right>{c.price ? fmtRWF(c.price) : "Free"}</PrintCell>
                  <PrintCell>{c.status || "—"}</PrintCell>
                </tr>
              ))
            )}
          </PrintTable>
        </PrintSection>
      )}

      {/* ── Staff: Programs ── */}
      {isStaff && (
        <PrintSection title={`Programs Created (${createdPrograms.length})`}>
          <PrintTable headers={["Program", "Organization", "Duration", "Starts", "Ends", "Price", "Status"]}>
            {createdPrograms.length === 0 ? (
              <EmptyRow colSpan={7} text="No programs created" />
            ) : (
              createdPrograms.map((p: any) => (
                <tr key={p.id} className="print:break-inside-avoid">
                  <PrintCell>{p.title}</PrintCell>
                  <PrintCell>{p.organization || "—"}</PrintCell>
                  <PrintCell>{p.duration || "—"}</PrintCell>
                  <PrintCell>{fmtDate(p.startDate)}</PrintCell>
                  <PrintCell>{fmtDate(p.endDate)}</PrintCell>
                  <PrintCell right>{p.price ? fmtRWF(p.price) : "Free"}</PrintCell>
                  <PrintCell>{p.status || "—"}</PrintCell>
                </tr>
              ))
            )}
          </PrintTable>
        </PrintSection>
      )}

      {/* ── Staff: Revenue summary ── */}
      {isStaff && (
        <PrintSection title="Revenue">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 print:break-inside-avoid">
            <Metric label="Total Revenue" value={fmtRWF(stats.revenue)} />
            <Metric label="Courses" value={stats.totalCreatedCourses} />
            <Metric label="Programs" value={stats.totalCreatedPrograms} />
            <Metric label="Students" value={stats.totalManagedStudents} />
          </div>
        </PrintSection>
      )}

      {/* ── Staff: Student roster ── */}
      {isStaff && (
        <PrintSection title={`Student Roster (${managedStudents.length})`}>
          <PrintTable headers={["Student", "Email", "School", "Joined"]}>
            {managedStudents.length === 0 ? (
              <EmptyRow colSpan={4} text="No students managed" />
            ) : (
              managedStudents.map((s: any) => (
                <tr key={s.id} className="print:break-inside-avoid">
                  <PrintCell>{s.fullName || s.username}</PrintCell>
                  <PrintCell>{s.email || "—"}</PrintCell>
                  <PrintCell>{s.school || "—"}</PrintCell>
                  <PrintCell>{fmtDate(s.createdAt)}</PrintCell>
                </tr>
              ))
            )}
          </PrintTable>
        </PrintSection>
      )}

      {/* ── Student: Applications ── */}
      {isStudent && (
        <PrintSection title={`Applications (${applications.length})`}>
          <PrintTable headers={["Type", "Title", "Organization", "Status", "Applied"]}>
            {applications.length === 0 ? (
              <EmptyRow colSpan={5} text="No applications submitted" />
            ) : (
              applications.map((a: any) => (
                <tr key={a.id} className="print:break-inside-avoid">
                  <PrintCell>{a.type === "course" ? "Course" : "Opportunity"}</PrintCell>
                  <PrintCell>{a.title}</PrintCell>
                  <PrintCell>{a.organization || "—"}</PrintCell>
                  <PrintCell>{a.status}</PrintCell>
                  <PrintCell>{fmtDate(a.appliedAt)}</PrintCell>
                </tr>
              ))
            )}
          </PrintTable>
        </PrintSection>
      )}

      {/* ── Enrolled courses (everyone) ── */}
      {!isStaff && courses.length > 0 && (
        <PrintSection title={`Courses (${courses.length})`}>
          <PrintTable headers={["Course", "Level", "Progress", "Lessons", "Status"]}>
            {courses.map((c: any) => (
              <tr key={c.courseId} className="print:break-inside-avoid">
                <PrintCell>{c.courseTitle}</PrintCell>
                <PrintCell>{c.courseLevel || "—"}</PrintCell>
                <PrintCell right>{c.overallProgress}%</PrintCell>
                <PrintCell right>{c.completedLessons}/{c.totalLessons}</PrintCell>
                <PrintCell>{c.status}</PrintCell>
              </tr>
            ))}
          </PrintTable>
        </PrintSection>
      )}

      {/* ── Grades ── */}
      {grades.length > 0 && (
        <PrintSection title={`Grades (${grades.length})`}>
          <PrintTable headers={["Lesson", "Score", "Status", "Date"]}>
            {grades.map((g: any, idx: number) => (
              <tr key={idx} className="print:break-inside-avoid">
                <PrintCell>{g.lessonTitle || "Assessment"}</PrintCell>
                <PrintCell right>{g.score}/100</PrintCell>
                <PrintCell>{g.score >= 70 ? "PASSED" : "REVISION"}</PrintCell>
                <PrintCell>{fmtDate(g.gradedAt)}</PrintCell>
              </tr>
            ))}
          </PrintTable>
        </PrintSection>
      )}

      {/* ── Projects ── */}
      {projects.length > 0 && (
        <PrintSection title={`Projects (${projects.length})`}>
          <PrintTable headers={["Project", "Status", "Progress", "Grade", "Deadline"]}>
            {projects.map((p: any) => (
              <tr key={p.id} className="print:break-inside-avoid">
                <PrintCell>{p.title}</PrintCell>
                <PrintCell>{p.status || "—"}</PrintCell>
                <PrintCell right>{p.progress || 0}%</PrintCell>
                <PrintCell right>{p.grade || "—"}</PrintCell>
                <PrintCell>{fmtDate(p.deadline)}</PrintCell>
              </tr>
            ))}
          </PrintTable>
        </PrintSection>
      )}

      {/* ── Internships ── */}
      {internships.length > 0 && (
        <PrintSection title={`Opportunities (${internships.length})`}>
          <PrintTable headers={["Title", "Organization", "Status", "Stage", "Start"]}>
            {internships.map((i: any) => (
              <tr key={i.id} className="print:break-inside-avoid">
                <PrintCell>{i.title}</PrintCell>
                <PrintCell>{i.organization || "—"}</PrintCell>
                <PrintCell>{i.status || "—"}</PrintCell>
                <PrintCell>{i.currentStage || "—"}</PrintCell>
                <PrintCell>{fmtDate(i.startDate)}</PrintCell>
              </tr>
            ))}
          </PrintTable>
        </PrintSection>
      )}

      {/* ── Certificates ── */}
      {report.certificates && report.certificates.length > 0 && (
        <PrintSection title={`Certificates (${report.certificates.length})`}>
          <PrintTable headers={["Course", "Status", "Grade", "Issued", "Credential ID"]}>
            {report.certificates.map((c: any) => (
              <tr key={c.id} className="print:break-inside-avoid">
                <PrintCell>{c.courseTitle}</PrintCell>
                <PrintCell>{c.status}</PrintCell>
                <PrintCell right>{c.grade || "—"}</PrintCell>
                <PrintCell>{fmtDate(c.issueDate)}</PrintCell>
                <PrintCell>{c.credentialId || "—"}</PrintCell>
              </tr>
            ))}
          </PrintTable>
        </PrintSection>
      )}

      {/* ── Footer ── */}
      <div className="mt-8 pt-3 border-t border-gray-300 flex items-center justify-between text-[9px] text-gray-500 print:break-before-avoid">
        <span>{user.fullName || user.username} — Full User Report</span>
        <span>{generatedAt}</span>
      </div>
    </div>
  );
}
