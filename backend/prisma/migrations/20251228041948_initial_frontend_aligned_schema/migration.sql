-- CreateEnum
CREATE TYPE "Role" AS ENUM ('agent', 'legal', 'risk', 'investor');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('active', 'pending', 'removed');

-- CreateEnum
CREATE TYPE "ClauseType" AS ENUM ('financial', 'covenant', 'definition', 'xref', 'general');

-- CreateEnum
CREATE TYPE "VariableType" AS ENUM ('financial', 'definition', 'covenant', 'ratio');

-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('financial', 'covenant', 'definition', 'xref');

-- CreateEnum
CREATE TYPE "DriftSeverity" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "DriftStatus" AS ENUM ('unresolved', 'overridden', 'reverted', 'approved');

-- CreateEnum
CREATE TYPE "ConfidenceLevel" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "ReconciliationDecision" AS ENUM ('pending', 'applied', 'rejected');

-- CreateEnum
CREATE TYPE "ReconciliationFileType" AS ENUM ('docx', 'pdf');

-- CreateEnum
CREATE TYPE "ConnectorStatus" AS ENUM ('READY', 'IN_REVIEW', 'DISCONNECTED');

-- CreateEnum
CREATE TYPE "ConnectorType" AS ENUM ('LoanIQ', 'Finastra', 'Allvue', 'CovenantTracker');

-- CreateEnum
CREATE TYPE "GoldenRecordStatus" AS ENUM ('READY', 'IN_REVIEW');

-- CreateEnum
CREATE TYPE "AuditEventType" AS ENUM ('LOGIN', 'LOGOUT', 'WORKSPACE_CREATE', 'INVITE_SENT', 'ROLE_CHANGED', 'MEMBER_REMOVED', 'CLAUSE_EDIT', 'VARIABLE_EDIT', 'VARIABLE_BIND', 'GRAPH_SYNC', 'DRIFT_OVERRIDE', 'DRIFT_REVERT', 'DRIFT_APPROVE', 'RECON_APPLY', 'RECON_REJECT', 'PUBLISH', 'EXPORT_JSON', 'EXPORT_AUDIT', 'GOVERNANCE_UPDATED', 'SECTION_LOCKED', 'SECTION_UNLOCKED');

-- CreateEnum
CREATE TYPE "ReasonCategory" AS ENUM ('borrower_request', 'market_conditions', 'credit_update', 'legal_requirement', 'other');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "standard" TEXT NOT NULL DEFAULT 'LMA',
    "base_pdf_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_sync_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT NOT NULL,
    "governance_rules" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'investor',
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "status" "MemberStatus" NOT NULL DEFAULT 'pending',
    "invited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joined_at" TIMESTAMP(3),

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clauses" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" "ClauseType" NOT NULL,
    "order" INTEGER NOT NULL,
    "is_sensitive" BOOLEAN NOT NULL DEFAULT false,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "locked_by" TEXT,
    "locked_at" TIMESTAMP(3),
    "last_modified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clauses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variables" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "clause_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "VariableType" NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "baseline_value" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_modified_by" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "graph_nodes" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "NodeType" NOT NULL,
    "clause_id" TEXT,
    "variable_id" TEXT,
    "value" TEXT,
    "has_drift" BOOLEAN NOT NULL DEFAULT false,
    "has_warning" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "graph_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "graph_edges" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "graph_edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "graph_state" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "integrity_score" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "last_computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "graph_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drift_items" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "clause_id" TEXT NOT NULL,
    "variable_id" TEXT,
    "title" TEXT NOT NULL,
    "type" "ClauseType" NOT NULL,
    "severity" "DriftSeverity" NOT NULL,
    "baseline_value" TEXT NOT NULL,
    "baseline_approved_at" TIMESTAMP(3) NOT NULL,
    "current_value" TEXT NOT NULL,
    "current_modified_at" TIMESTAMP(3) NOT NULL,
    "current_modified_by" TEXT NOT NULL,
    "status" "DriftStatus" NOT NULL DEFAULT 'unresolved',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "approval_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drift_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliation_sessions" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" "ReconciliationFileType" NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaded_by" TEXT NOT NULL,
    "total_items" INTEGER NOT NULL DEFAULT 0,
    "applied_count" INTEGER NOT NULL DEFAULT 0,
    "rejected_count" INTEGER NOT NULL DEFAULT 0,
    "pending_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reconciliation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliation_items" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "incoming_snippet" TEXT NOT NULL,
    "target_clause_id" TEXT NOT NULL,
    "target_variable_id" TEXT,
    "confidence" "ConfidenceLevel" NOT NULL,
    "baseline_value" TEXT NOT NULL,
    "current_value" TEXT NOT NULL,
    "proposed_value" TEXT NOT NULL,
    "decision" "ReconciliationDecision" NOT NULL DEFAULT 'pending',
    "decision_reason" TEXT,
    "decided_by" TEXT,
    "decided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reconciliation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_id" TEXT NOT NULL,
    "actor_name" TEXT NOT NULL,
    "event_type" "AuditEventType" NOT NULL,
    "target_type" TEXT,
    "target_id" TEXT,
    "before_state" TEXT,
    "after_state" TEXT,
    "reason" TEXT,
    "reason_category" "ReasonCategory",

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "golden_records" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "status" "GoldenRecordStatus" NOT NULL DEFAULT 'IN_REVIEW',
    "integrity_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unresolved_high_drift_count" INTEGER NOT NULL DEFAULT 0,
    "last_export_at" TIMESTAMP(3),
    "last_publish_at" TIMESTAMP(3),
    "schema_json" TEXT NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "golden_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "downstream_connectors" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ConnectorType" NOT NULL,
    "status" "ConnectorStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "downstream_connectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "covenants" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "test_frequency" TEXT NOT NULL,
    "threshold" TEXT NOT NULL,
    "calculation_basis" TEXT NOT NULL,
    "clause_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "covenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "workspace_members_workspace_id_idx" ON "workspace_members"("workspace_id");

-- CreateIndex
CREATE INDEX "workspace_members_user_id_idx" ON "workspace_members"("user_id");

-- CreateIndex
CREATE INDEX "workspace_members_status_idx" ON "workspace_members"("status");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_user_id_workspace_id_key" ON "workspace_members"("user_id", "workspace_id");

-- CreateIndex
CREATE INDEX "clauses_workspace_id_idx" ON "clauses"("workspace_id");

-- CreateIndex
CREATE INDEX "clauses_type_idx" ON "clauses"("type");

-- CreateIndex
CREATE INDEX "clauses_is_locked_idx" ON "clauses"("is_locked");

-- CreateIndex
CREATE UNIQUE INDEX "clauses_workspace_id_order_key" ON "clauses"("workspace_id", "order");

-- CreateIndex
CREATE INDEX "variables_workspace_id_idx" ON "variables"("workspace_id");

-- CreateIndex
CREATE INDEX "variables_clause_id_idx" ON "variables"("clause_id");

-- CreateIndex
CREATE INDEX "variables_type_idx" ON "variables"("type");

-- CreateIndex
CREATE INDEX "graph_nodes_workspace_id_idx" ON "graph_nodes"("workspace_id");

-- CreateIndex
CREATE INDEX "graph_nodes_type_idx" ON "graph_nodes"("type");

-- CreateIndex
CREATE INDEX "graph_nodes_clause_id_idx" ON "graph_nodes"("clause_id");

-- CreateIndex
CREATE INDEX "graph_nodes_variable_id_idx" ON "graph_nodes"("variable_id");

-- CreateIndex
CREATE INDEX "graph_edges_workspace_id_idx" ON "graph_edges"("workspace_id");

-- CreateIndex
CREATE INDEX "graph_edges_source_id_idx" ON "graph_edges"("source_id");

-- CreateIndex
CREATE INDEX "graph_edges_target_id_idx" ON "graph_edges"("target_id");

-- CreateIndex
CREATE UNIQUE INDEX "graph_edges_workspace_id_source_id_target_id_key" ON "graph_edges"("workspace_id", "source_id", "target_id");

-- CreateIndex
CREATE UNIQUE INDEX "graph_state_workspace_id_key" ON "graph_state"("workspace_id");

-- CreateIndex
CREATE INDEX "drift_items_workspace_id_idx" ON "drift_items"("workspace_id");

-- CreateIndex
CREATE INDEX "drift_items_clause_id_idx" ON "drift_items"("clause_id");

-- CreateIndex
CREATE INDEX "drift_items_variable_id_idx" ON "drift_items"("variable_id");

-- CreateIndex
CREATE INDEX "drift_items_severity_idx" ON "drift_items"("severity");

-- CreateIndex
CREATE INDEX "drift_items_status_idx" ON "drift_items"("status");

-- CreateIndex
CREATE INDEX "reconciliation_sessions_workspace_id_idx" ON "reconciliation_sessions"("workspace_id");

-- CreateIndex
CREATE INDEX "reconciliation_sessions_uploaded_by_idx" ON "reconciliation_sessions"("uploaded_by");

-- CreateIndex
CREATE INDEX "reconciliation_sessions_file_type_idx" ON "reconciliation_sessions"("file_type");

-- CreateIndex
CREATE INDEX "reconciliation_items_workspace_id_idx" ON "reconciliation_items"("workspace_id");

-- CreateIndex
CREATE INDEX "reconciliation_items_session_id_idx" ON "reconciliation_items"("session_id");

-- CreateIndex
CREATE INDEX "reconciliation_items_decision_idx" ON "reconciliation_items"("decision");

-- CreateIndex
CREATE INDEX "reconciliation_items_confidence_idx" ON "reconciliation_items"("confidence");

-- CreateIndex
CREATE INDEX "reconciliation_items_target_clause_id_idx" ON "reconciliation_items"("target_clause_id");

-- CreateIndex
CREATE INDEX "reconciliation_items_target_variable_id_idx" ON "reconciliation_items"("target_variable_id");

-- CreateIndex
CREATE INDEX "audit_events_workspace_id_idx" ON "audit_events"("workspace_id");

-- CreateIndex
CREATE INDEX "audit_events_actor_id_idx" ON "audit_events"("actor_id");

-- CreateIndex
CREATE INDEX "audit_events_event_type_idx" ON "audit_events"("event_type");

-- CreateIndex
CREATE INDEX "audit_events_timestamp_idx" ON "audit_events"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "golden_records_workspace_id_key" ON "golden_records"("workspace_id");

-- CreateIndex
CREATE INDEX "downstream_connectors_workspace_id_idx" ON "downstream_connectors"("workspace_id");

-- CreateIndex
CREATE INDEX "downstream_connectors_type_idx" ON "downstream_connectors"("type");

-- CreateIndex
CREATE INDEX "downstream_connectors_status_idx" ON "downstream_connectors"("status");

-- CreateIndex
CREATE INDEX "covenants_workspace_id_idx" ON "covenants"("workspace_id");

-- CreateIndex
CREATE INDEX "covenants_clause_id_idx" ON "covenants"("clause_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clauses" ADD CONSTRAINT "clauses_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clauses" ADD CONSTRAINT "clauses_locked_by_fkey" FOREIGN KEY ("locked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clauses" ADD CONSTRAINT "clauses_last_modified_by_fkey" FOREIGN KEY ("last_modified_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variables" ADD CONSTRAINT "variables_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variables" ADD CONSTRAINT "variables_clause_id_fkey" FOREIGN KEY ("clause_id") REFERENCES "clauses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variables" ADD CONSTRAINT "variables_last_modified_by_fkey" FOREIGN KEY ("last_modified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "graph_nodes" ADD CONSTRAINT "graph_nodes_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "graph_nodes" ADD CONSTRAINT "graph_nodes_clause_id_fkey" FOREIGN KEY ("clause_id") REFERENCES "clauses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "graph_nodes" ADD CONSTRAINT "graph_nodes_variable_id_fkey" FOREIGN KEY ("variable_id") REFERENCES "variables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "graph_edges" ADD CONSTRAINT "graph_edges_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "graph_edges" ADD CONSTRAINT "graph_edges_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "graph_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "graph_edges" ADD CONSTRAINT "graph_edges_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "graph_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "graph_state" ADD CONSTRAINT "graph_state_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drift_items" ADD CONSTRAINT "drift_items_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drift_items" ADD CONSTRAINT "drift_items_clause_id_fkey" FOREIGN KEY ("clause_id") REFERENCES "clauses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drift_items" ADD CONSTRAINT "drift_items_variable_id_fkey" FOREIGN KEY ("variable_id") REFERENCES "variables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drift_items" ADD CONSTRAINT "drift_items_current_modified_by_fkey" FOREIGN KEY ("current_modified_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drift_items" ADD CONSTRAINT "drift_items_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_sessions" ADD CONSTRAINT "reconciliation_sessions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_sessions" ADD CONSTRAINT "reconciliation_sessions_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "reconciliation_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_target_clause_id_fkey" FOREIGN KEY ("target_clause_id") REFERENCES "clauses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_target_variable_id_fkey" FOREIGN KEY ("target_variable_id") REFERENCES "variables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reconciliation_items" ADD CONSTRAINT "reconciliation_items_decided_by_fkey" FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "golden_records" ADD CONSTRAINT "golden_records_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "downstream_connectors" ADD CONSTRAINT "downstream_connectors_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "covenants" ADD CONSTRAINT "covenants_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "covenants" ADD CONSTRAINT "covenants_clause_id_fkey" FOREIGN KEY ("clause_id") REFERENCES "clauses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
