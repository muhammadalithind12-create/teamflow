// TeamFlow Kanban — shared types (mirror the tf_* tables in
// supabase/migrations/001_teamflow.sql)

export interface TfWorkspace {
  id: string;
  name: string;
  slug: string;
}

export interface TfBoard {
  id: string;
  workspace_id: string;
  title: string;
}

export interface TfColumn {
  id: string;
  board_id: string;
  title: string;
  position: number;
}

export interface TfCard {
  id: string;
  column_id: string;
  board_id: string;
  title: string;
  description: string;
  assignee: string;
  labels: string[];
  position: number;
}
