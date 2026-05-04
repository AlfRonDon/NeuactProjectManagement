// Set 1
export { default as CommandCenterLayout } from "./CommandCenterLayout";
export { default as ActivityFeedLayout } from "./ActivityFeedLayout";
export { default as SplitPaneLayout } from "./SplitPaneLayout";
export { default as MissionControlLayout } from "./MissionControlLayout";
export { default as FocusModeLayout } from "./FocusModeLayout";

// Set 2
export { default as ExecutiveLayout } from "./ExecutiveLayout";
export { default as CalendarLayout } from "./CalendarLayout";
export { CalendarAgendaLayout, CalendarTimelineLayout, CalendarHeatmapLayout, CalendarDeadlineLayout, CalendarSplitLayout } from "./CalendarVariants";
export { default as WarRoomLayout } from "./WarRoomLayout";
export { default as ClientPortalLayout } from "./ClientPortalLayout";
export { default as VoiceFirstLayout } from "./VoiceFirstLayout";
export { default as RetroLayout } from "./RetroLayout";

// Set 3
export { default as NotificationHubLayout } from "./NotificationHubLayout";
export { default as KanbanSwimlaneLayout } from "./KanbanSwimlaneLayout";
export { default as OKRTrackerLayout } from "./OKRTrackerLayout";
export { default as TimeboxLayout } from "./TimeboxLayout";
export { default as ChangelogLayout } from "./ChangelogLayout";
export { default as ComparisonLayout } from "./ComparisonLayout";

// Set 4 — Project Page
export { ProjectPageVariantA, ProjectPageVariantB, ProjectPageVariantC, ProjectPageVariantD } from "./ProjectPageVariants";
export { EngineerOverviewA, EngineerOverviewB, AdminOverviewA, AdminOverviewB } from "./ProjectOverviewVariants";
export { TaskDetailVariantA, TaskDetailVariantB, TaskDetailVariantC } from "./TaskDetailVariants";
export { AdminOverviewVariantA, AdminOverviewVariantB, AdminOverviewVariantC, AdminOverviewVariantD, AdminOverviewVariantE } from "./AdminOverviewVariants";
export { ProjectSummaryVariantA, ProjectSummaryVariantB, ProjectSummaryVariantC, ProjectSummaryVariantD } from "./ProjectSummaryVariants";
export { StageMapVariantA, StageMapVariantB, StageMapVariantC, StageMapVariantD } from "./StageMapVariants";
export { BottomWidgetVariantA, PeopleVariantA, TaskWidgetVariantA, TaskWidgetVariantB, TaskWidgetVariantC, GanttChart, GanttEditView } from "./BottomWidgetVariants";
export type { GanttRow } from "./BottomWidgetVariants";

// StatusBoard — kanban-style status board with dependencies & mini timelines
export { default as StatusBoard } from "./StatusBoard";
export type { StatusBoardProps, StatusBoardTask } from "./StatusBoard";

// CalendarView — tabbed calendar with weekly/monthly/split/timeline views
export { default as CalendarView } from "./CalendarView";
export type { CalendarViewProps, CalendarTask } from "./CalendarView";
