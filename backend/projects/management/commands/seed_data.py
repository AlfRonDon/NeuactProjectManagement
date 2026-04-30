"""Seed the database with dummy data matching frontend fixtures."""
from datetime import date
from django.core.management.base import BaseCommand
from projects.models import Project, Task, SubTask, Comment, Changelog, ChangelogEntry, Notification


class Command(BaseCommand):
    help = "Seed projects, tasks, subtasks, comments, changelogs, notifications"

    def handle(self, *args, **options):
        # Clear existing
        Notification.objects.all().delete()
        ChangelogEntry.objects.all().delete()
        Changelog.objects.all().delete()
        Comment.objects.all().delete()
        SubTask.objects.all().delete()
        Task.objects.all().delete()
        Project.objects.all().delete()
        self.stdout.write("Cleared existing data")

        # ── PROJECTS ──
        ccv5 = Project.objects.create(
            name="Command Center v5", short="CCv5", color="#3b82f6", status="active",
            description="AI-powered project management dashboard with real-time pipeline orchestration, voice-first interaction, and intelligent task scheduling.",
            start_date=date(2026, 4, 1), target_date=date(2026, 7, 31),
        )
        nrv3 = Project.objects.create(
            name="NeuactReport v3", short="NRv3", color="#8b5cf6", status="active",
            description="Automated reporting engine with NL query parsing, chart auto-generation, and PDF export.",
            start_date=date(2026, 3, 15), target_date=date(2026, 6, 1),
        )
        spot = Project.objects.create(
            name="Spot Particle", short="Spot", color="#f59e0b", status="active",
            description="WebGL particle animation engine with audio-reactive visuals and touch gesture controls.",
            start_date=date(2026, 3, 1), target_date=date(2026, 4, 30),
        )
        self.stdout.write(f"Created 3 projects")

        # ── CCv5 TASKS ──
        t1 = Task.objects.create(project=ccv5, title="Implement Phase B — Fill/RAG", description="Build the RAG pipeline using vLLM with guided JSON decoding. Takes the understood query from Phase A, fills it with relevant data from PostgreSQL via retrieval-augmented generation.", status="active", priority="high", assignee="Rohith", start_date=date(2026,4,10), due_date=date(2026,4,25), estimated_hours=16, tags=["pipeline","vLLM","RAG"])
        t2 = Task.objects.create(project=ccv5, title="Fix bento grid overflow bug", description="Grid items overflow on narrow viewports when widget count exceeds grid capacity.", status="active", priority="urgent", assignee="Rohith", start_date=date(2026,4,10), due_date=date(2026,4,11), estimated_hours=2, tags=["bug","CSS"])
        t3 = Task.objects.create(project=ccv5, title="Phase C — Grid Pack", description="Bento grid packing algorithm that arranges widgets into optimal layout.", status="blocked", priority="high", assignee="", start_date=date(2026,4,26), due_date=date(2026,5,10), estimated_hours=12, tags=["pipeline","algorithm"])
        t4 = Task.objects.create(project=ccv5, title="Widget renderer PR merge", description="Final review and merge of the widget renderer rewrite PR #87.", status="active", priority="urgent", assignee="Arjun", start_date=date(2026,4,9), due_date=date(2026,4,11), estimated_hours=1, tags=["PR"])
        t5 = Task.objects.create(project=ccv5, title="Write RAG integration tests", description="Full integration test suite covering query → retrieval → generation → validation.", status="todo", priority="medium", assignee="", start_date=date(2026,4,18), due_date=date(2026,4,22), estimated_hours=4, tags=["testing"])
        t6 = Task.objects.create(project=ccv5, title="Deploy pipeline fix on staging", description="CI job #482 timed out on integration tests. Need to fix timeout config.", status="blocked", priority="high", assignee="", start_date=date(2026,4,11), due_date=date(2026,4,13), estimated_hours=3, tags=["CI","devops"])
        t7 = Task.objects.create(project=ccv5, title="Write unit tests for Phase B", description="Unit tests for each Phase B sub-component: retriever, prompt builder, validator.", status="todo", priority="medium", assignee="", start_date=date(2026,4,18), due_date=date(2026,4,22), estimated_hours=6, tags=["testing"])
        t8 = Task.objects.create(project=ccv5, title="Widget Renderer refactor", description="Complete rewrite with React.memo optimization, reducing re-renders by 60%.", status="done", priority="high", assignee="Arjun", start_date=date(2026,4,8), due_date=date(2026,4,16), estimated_hours=8, tags=["refactor"])
        t9 = Task.objects.create(project=ccv5, title="Design pipeline architecture", description="Define the A→B→C→D pipeline flow, data contracts between phases.", status="done", priority="high", assignee="Rohith", start_date=date(2026,4,1), due_date=date(2026,4,10), estimated_hours=8, tags=["architecture"])
        t10 = Task.objects.create(project=ccv5, title="Phase A — Understand", description="NL query parsing with Qwen3.5. Extracts intent, entities, time range.", status="done", priority="high", assignee="Rohith", start_date=date(2026,4,5), due_date=date(2026,4,15), estimated_hours=12, tags=["pipeline","NLP"])

        # Dependencies
        t1.depends_on.add(t9, t10)
        t3.depends_on.add(t1)
        t5.depends_on.add(t1)
        t4.depends_on.add(t8)
        t10.depends_on.add(t9)

        # ── CCv5 Subtasks ──
        SubTask.objects.create(task=t1, title="Setup vLLM guided decoding schema", description="Define JSON schema for guided output", done=True, assignee="Rohith", priority="high", order=0)
        SubTask.objects.create(task=t1, title="Implement PostgreSQL context retriever", description="Query relevant rows from 363 equipment tables", done=True, assignee="Rohith", priority="high", order=1)
        SubTask.objects.create(task=t1, title="Build prompt template with RAG context", description="Construct the prompt with retrieved context injected", done=False, assignee="Rohith", priority="high", order=2)
        SubTask.objects.create(task=t1, title="Add structured JSON output validation", description="Validate vLLM output against expected schema", done=False, assignee="Rohith", priority="medium", order=3)
        SubTask.objects.create(task=t1, title="Write integration tests", description="End-to-end test: query → retrieval → generation → validation", done=False, assignee="", priority="medium", order=4)
        SubTask.objects.create(task=t2, title="Reproduce on 768px viewport", done=True, assignee="Rohith", priority="high", order=0)
        SubTask.objects.create(task=t2, title="Fix CSS grid-template-columns", description="Apply minmax() with auto-fill", done=False, assignee="Rohith", priority="urgent", order=1)

        # ── CCv5 Comments ──
        Comment.objects.create(task=t1, author="Rohith", text="Started on prompt template. Using Qwen3.5 native structured output — much cleaner than old regex.")
        Comment.objects.create(task=t1, author="Priya", text="@Rohith should we reuse the Phase A connection pool or create a new one? Don't want to hit connection limits.")
        Comment.objects.create(task=t1, author="Rohith", text="@Priya reuse existing pool — already configured for 20 connections. Adding a note in the code.")
        Comment.objects.create(task=t2, author="Arjun", text="Reproduced this on the test page. It's the grid-template-columns missing a minmax.")
        Comment.objects.create(task=t4, author="Arjun", text="PR is ready. Once merged, Phase B output can be tested end-to-end with the new renderer.")

        # ── NRv3 TASKS ──
        t11 = Task.objects.create(project=nrv3, title="Update API auth header handling", description="Switch to Bearer token format", status="active", priority="urgent", assignee="Rohith", start_date=date(2026,4,10), due_date=date(2026,4,12), estimated_hours=1, tags=["API"])
        t12 = Task.objects.create(project=nrv3, title="API schema approval", description="OpenAPI 3.1 schema review", status="active", priority="high", assignee="Priya", start_date=date(2026,4,9), due_date=date(2026,4,12), estimated_hours=2, tags=["API"])
        t13 = Task.objects.create(project=nrv3, title="Setup vLLM config", description="Qwen3.5-27B-FP8 configuration", status="done", priority="medium", assignee="Rohith", start_date=date(2026,4,3), due_date=date(2026,4,8), estimated_hours=3, tags=["ML"])
        t14 = Task.objects.create(project=nrv3, title="E2E test plan", description="End-to-end testing strategy", status="todo", priority="low", assignee="", start_date=date(2026,4,20), due_date=date(2026,5,1), estimated_hours=8, tags=["testing"])
        t15 = Task.objects.create(project=nrv3, title="Report template engine", description="Jinja2-based report generation", status="todo", priority="medium", assignee="", start_date=date(2026,4,25), due_date=date(2026,5,10), estimated_hours=6)
        t16 = Task.objects.create(project=nrv3, title="PDF export module", description="WeasyPrint PDF generation", status="done", priority="high", assignee="Priya", start_date=date(2026,3,28), due_date=date(2026,4,5), estimated_hours=4)

        # ── Spot TASKS ──
        t17 = Task.objects.create(project=spot, title="Spot particle spawn fix", description="Fix spawn rate calculation", status="active", priority="high", assignee="Rohith", start_date=date(2026,4,10), due_date=date(2026,4,15), estimated_hours=3, tags=["bug"])
        t18 = Task.objects.create(project=spot, title="Particle engine memory leak", description="WebGL buffer not released on unmount", status="blocked", priority="high", assignee="Rohith", start_date=date(2026,4,12), due_date=date(2026,4,20), estimated_hours=5, tags=["bug","WebGL"])
        t19 = Task.objects.create(project=spot, title="Audio reactive particles", description="Web Audio API frequency analysis", status="done", priority="medium", assignee="Rohith", start_date=date(2026,3,20), due_date=date(2026,4,1), estimated_hours=4)
        t20 = Task.objects.create(project=spot, title="WebGL renderer optimization", description="Instanced rendering for 100k+ particles", status="done", priority="high", assignee="Rohith", start_date=date(2026,3,15), due_date=date(2026,3,25), estimated_hours=6)
        t21 = Task.objects.create(project=spot, title="Color palette system", description="HSL-based dynamic palettes", status="done", priority="medium", assignee="Rohith", start_date=date(2026,3,10), due_date=date(2026,3,20), estimated_hours=3)
        t22 = Task.objects.create(project=spot, title="Touch gesture controls", description="Pinch, pan, rotate for mobile", status="todo", priority="medium", assignee="", start_date=date(2026,4,20), due_date=date(2026,4,28), estimated_hours=4)

        self.stdout.write(f"Created {Task.objects.count()} tasks, {SubTask.objects.count()} subtasks, {Comment.objects.count()} comments")

        # ── CHANGELOGS ──
        cl1 = Changelog.objects.create(project=ccv5, version="v4.2.0", title="AI Dashboard Pipeline", description="Full A-B-C-D pipeline for AI-generated dashboards.", date=date(2026,4,8), contributors=["Rohith","Priya"])
        ChangelogEntry.objects.create(changelog=cl1, type="feature", title="Phase A - Understand: NL query parsing", task_id_ref="CCv5-12")
        ChangelogEntry.objects.create(changelog=cl1, type="feature", title="Phase B - Fill/RAG: context retrieval", task_id_ref="CCv5-15")
        ChangelogEntry.objects.create(changelog=cl1, type="improvement", title="vLLM guided JSON decoding")
        ChangelogEntry.objects.create(changelog=cl1, type="fix", title="Memory leak in widget renderer", task_id_ref="CCv5-24")

        cl2 = Changelog.objects.create(project=ccv5, version="v4.1.0", title="Widget System v2", description="Complete widget rendering rewrite.", date=date(2026,3,20), contributors=["Rohith","Arjun"])
        ChangelogEntry.objects.create(changelog=cl2, type="feature", title="Gantt, Risk Radar, Dependency Graph widgets")
        ChangelogEntry.objects.create(changelog=cl2, type="breaking", title="Widget API v1 deprecated")
        ChangelogEntry.objects.create(changelog=cl2, type="fix", title="Timeline swimlanes DST misalignment")

        cl3 = Changelog.objects.create(project=nrv3, version="v3.1.0", title="PDF Export", description="PDF report generation with WeasyPrint.", date=date(2026,4,5), contributors=["Priya"])
        ChangelogEntry.objects.create(changelog=cl3, type="feature", title="PDF export with custom templates")
        ChangelogEntry.objects.create(changelog=cl3, type="improvement", title="API schema migrated to OpenAPI 3.1")

        cl4 = Changelog.objects.create(project=nrv3, version="v3.0.0", title="Initial Release", description="NeuactReport v3 with AI-powered analytics.", date=date(2026,3,15), contributors=["Rohith","Priya"])
        ChangelogEntry.objects.create(changelog=cl4, type="feature", title="Report dashboard with live metrics")
        ChangelogEntry.objects.create(changelog=cl4, type="feature", title="vLLM integration for summaries")

        cl5 = Changelog.objects.create(project=spot, version="v2.1.0", title="Audio Reactive", description="Particles respond to audio frequency.", date=date(2026,4,1), contributors=["Rohith"])
        ChangelogEntry.objects.create(changelog=cl5, type="feature", title="Web Audio API frequency analysis")
        ChangelogEntry.objects.create(changelog=cl5, type="improvement", title="Instanced rendering for 100k+ particles")

        cl6 = Changelog.objects.create(project=spot, version="v2.0.0", title="Color System", description="HSL-based dynamic palettes.", date=date(2026,3,10), contributors=["Rohith"])
        ChangelogEntry.objects.create(changelog=cl6, type="feature", title="Dynamic color palette system")
        ChangelogEntry.objects.create(changelog=cl6, type="feature", title="WebGL particle engine")

        self.stdout.write(f"Created {Changelog.objects.count()} changelogs, {ChangelogEntry.objects.count()} entries")

        # ── NOTIFICATIONS ──
        Notification.objects.create(project_short="CCv5", category="blocker", title="Phase C blocked by Phase B", description="Dependency unresolved for 3 days. Phase B still in progress — no handoff scheduled.", from_user="System", time_ago="12m", read=False, actions=["escalate","reassign"])
        Notification.objects.create(project_short="CCv5", category="blocker", title="Deploy pipeline failing on staging", description="CI job #482 timed out on integration tests. Last green run was 2 days ago.", from_user="CI Bot", time_ago="34m", read=False, actions=["escalate","snooze"])
        Notification.objects.create(project_short="CCv5", category="overdue", title="Widget Renderer overdue by 2 days", description="No status update since Apr 14. Owner: Rohith. No blockers logged.", from_user="System", time_ago="1h", read=False, actions=["reassign","snooze"])
        Notification.objects.create(project_short="CCv5", category="mention", title="@you in PR #87 review", description="Priya: 'Should we use grid-template-areas or manual placement for the bento?'", from_user="Priya", time_ago="45m", read=False, actions=["approve","snooze"])
        Notification.objects.create(project_short="CCv5", category="ai", title="Suggest: parallelize Widget + Grid", description="No hard dependency between Widget Renderer and Grid Pack. Running in parallel saves ~5 days.", from_user="AI", time_ago="5m", read=False, actions=["approve","snooze"])
        Notification.objects.create(project_short="CCv5", category="ai", title="Risk: single-contributor bottleneck", description="Rohith owns 67% of in-progress tasks. Bus factor is 1. Consider redistribution.", from_user="AI", time_ago="1h", read=True, actions=["approve","snooze"])
        Notification.objects.create(project_short="CCv5", category="overdue", title="E2E test plan not started", description="Scheduled start Apr 15. Still in backlog. Release is 11 weeks away.", from_user="System", time_ago="2h", read=True, actions=["reassign","escalate"])
        Notification.objects.create(project_short="NRv3", category="mention", title="@you tagged in sprint retro", description="Arjun: 'Action item: investigate vLLM memory spike on Phase A.'", from_user="Arjun", time_ago="3h", read=True, actions=["snooze"])

        self.stdout.write(f"Created {Notification.objects.count()} notifications")
        self.stdout.write(self.style.SUCCESS("✓ Seed complete"))
