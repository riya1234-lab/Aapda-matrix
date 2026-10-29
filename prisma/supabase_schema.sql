-- ============================================================================
-- AAPDA MATRIX — Supabase PostgreSQL Schema DDL
-- Project ID: haetofwgsrjxdjgpxjbd
-- Run this script in: https://supabase.com/dashboard/project/haetofwgsrjxdjgpxjbd/sql/new
-- ============================================================================

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable: User
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CITIZEN',
    "phoneNumber" TEXT,
    "bloodGroup" TEXT,
    "allergies" TEXT,
    "preferredLanguage" TEXT DEFAULT 'en',
    "address" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Incident
CREATE TABLE IF NOT EXISTS "Incident" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "anonymousId" TEXT,
    "emergencyCategory" TEXT NOT NULL,
    "disasterSubtype" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'HIGH',
    "originalPriority" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "locationAccuracy" DOUBLE PRECISION,
    "locationProtocol" TEXT DEFAULT 'GPS',
    "locationStatus" TEXT NOT NULL DEFAULT 'GPS_VERIFIED',
    "locationSource" TEXT DEFAULT 'GPS',
    "userProvidedAddress" TEXT,
    "batteryLevel" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "communicationMethod" TEXT NOT NULL DEFAULT 'INTERNET',
    "deliveryStatus" TEXT NOT NULL DEFAULT 'DELIVERED_SERVER',
    "acknowledgementReceived" BOOLEAN NOT NULL DEFAULT false,
    "hopCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "triageMethod" TEXT DEFAULT 'LOCAL_RULE_ENGINE_V1',
    "triageRationale" TEXT,
    "triageConfidence" DOUBLE PRECISION,
    "triageOverridden" BOOLEAN NOT NULL DEFAULT false,
    "operatorNotes" TEXT,
    "responseTeamId" TEXT,
    "dispatchedBy" TEXT,
    "dispatchedAt" TIMESTAMP(3),
    "dispatchReason" TEXT,

    CONSTRAINT "Incident_pkey" PRIMARY KEY ("id")
);

-- CreateTable: IncidentAttachment
CREATE TABLE IF NOT EXISTS "IncidentAttachment" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "attachmentType" TEXT NOT NULL DEFAULT 'AUDIO_VOICE',
    "secureStorageReference" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'audio/webm',
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "durationSeconds" INTEGER DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PersonalContact
CREATE TABLE IF NOT EXISTS "PersonalContact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relationship" TEXT NOT NULL DEFAULT 'FAMILY',
    "notifyOnSosCreated" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnSync" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnDispatch" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnLowBattery" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable: EmergencyContact
CREATE TABLE IF NOT EXISTS "EmergencyContact" (
    "id" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'National',
    "telephoneNumber" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priorityOrder" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ResponseTeam
CREATE TABLE IF NOT EXISTS "ResponseTeam" (
    "id" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL DEFAULT 'SAR',
    "availabilityStatus" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "contactNumber" TEXT,
    "baseLocation" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "city" TEXT NOT NULL DEFAULT 'National',
    "assignedIncidentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResponseTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable: IncidentHistory
CREATE TABLE IF NOT EXISTS "IncidentHistory" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "previousStatus" TEXT NOT NULL,
    "newStatus" TEXT NOT NULL,
    "changedBy" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "IncidentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable: TelemetryEvent
CREATE TABLE IF NOT EXISTS "TelemetryEvent" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "transportType" TEXT NOT NULL,
    "gatewayId" TEXT,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "result" TEXT NOT NULL DEFAULT 'SUCCESS',
    "durationMs" INTEGER,
    "errorCode" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelemetryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AuditLog
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userRole" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "details" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable: MessageRelay
CREATE TABLE IF NOT EXISTS "MessageRelay" (
    "messageId" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "originDeviceId" TEXT NOT NULL,
    "hopCount" INTEGER NOT NULL DEFAULT 0,
    "maxHops" INTEGER NOT NULL DEFAULT 5,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'QUEUED',
    "lastRelayAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageRelay_pkey" PRIMARY KEY ("messageId")
);

-- CreateTable: RelayNode
CREATE TABLE IF NOT EXISTS "RelayNode" (
    "id" TEXT NOT NULL,
    "deviceName" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "batteryLevel" INTEGER NOT NULL DEFAULT 100,
    "totalHopsRouted" INTEGER NOT NULL DEFAULT 0,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ONLINE',

    CONSTRAINT "RelayNode_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE INDEX IF NOT EXISTS "Incident_status_idx" ON "Incident"("status");
CREATE INDEX IF NOT EXISTS "Incident_priority_idx" ON "Incident"("priority");
CREATE INDEX IF NOT EXISTS "Incident_emergencyCategory_idx" ON "Incident"("emergencyCategory");
CREATE INDEX IF NOT EXISTS "Incident_createdAt_idx" ON "Incident"("createdAt");
CREATE INDEX IF NOT EXISTS "Incident_userId_idx" ON "Incident"("userId");
CREATE INDEX IF NOT EXISTS "IncidentAttachment_incidentId_idx" ON "IncidentAttachment"("incidentId");
CREATE INDEX IF NOT EXISTS "PersonalContact_userId_idx" ON "PersonalContact"("userId");
CREATE INDEX IF NOT EXISTS "EmergencyContact_category_idx" ON "EmergencyContact"("category");
CREATE INDEX IF NOT EXISTS "EmergencyContact_active_idx" ON "EmergencyContact"("active");
CREATE INDEX IF NOT EXISTS "IncidentHistory_incidentId_idx" ON "IncidentHistory"("incidentId");
CREATE INDEX IF NOT EXISTS "TelemetryEvent_incidentId_idx" ON "TelemetryEvent"("incidentId");
CREATE INDEX IF NOT EXISTS "AuditLog_resourceId_idx" ON "AuditLog"("resourceId");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "MessageRelay_incidentId_idx" ON "MessageRelay"("incidentId");
CREATE INDEX IF NOT EXISTS "RelayNode_status_idx" ON "RelayNode"("status");

-- Foreign Keys
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Incident_userId_fkey') THEN
        ALTER TABLE "Incident" ADD CONSTRAINT "Incident_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Incident_responseTeamId_fkey') THEN
        ALTER TABLE "Incident" ADD CONSTRAINT "Incident_responseTeamId_fkey" FOREIGN KEY ("responseTeamId") REFERENCES "ResponseTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'IncidentAttachment_incidentId_fkey') THEN
        ALTER TABLE "IncidentAttachment" ADD CONSTRAINT "IncidentAttachment_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PersonalContact_userId_fkey') THEN
        ALTER TABLE "PersonalContact" ADD CONSTRAINT "PersonalContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'IncidentHistory_incidentId_fkey') THEN
        ALTER TABLE "IncidentHistory" ADD CONSTRAINT "IncidentHistory_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'TelemetryEvent_incidentId_fkey') THEN
        ALTER TABLE "TelemetryEvent" ADD CONSTRAINT "TelemetryEvent_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AuditLog_userId_fkey') THEN
        ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MessageRelay_incidentId_fkey') THEN
        ALTER TABLE "MessageRelay" ADD CONSTRAINT "MessageRelay_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "Incident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- SEED DATA: Verified Emergency Contacts (National / India)
-- ============================================================================
INSERT INTO "EmergencyContact" ("id", "serviceName", "region", "telephoneNumber", "category", "verifiedAt", "active", "priorityOrder")
VALUES
    ('contact_112', 'National Emergency Helpline (Unified 112)', 'National', '112', 'GENERAL', CURRENT_TIMESTAMP, true, 1),
    ('contact_108', 'Emergency Medical Services & Ambulance (108)', 'National', '108', 'AMBULANCE', CURRENT_TIMESTAMP, true, 2),
    ('contact_100', 'Police Emergency Direct (100)', 'National', '100', 'POLICE', CURRENT_TIMESTAMP, true, 3),
    ('contact_101', 'Fire and Rescue Services (101)', 'National', '101', 'FIRE', CURRENT_TIMESTAMP, true, 4),
    ('contact_1091', 'Women Helpline (Domestic & Public Safety 1091)', 'National', '1091', 'WOMEN', CURRENT_TIMESTAMP, true, 5),
    ('contact_1070', 'National Disaster Management Authority (NDMA 1070)', 'National', '1070', 'DISASTER', CURRENT_TIMESTAMP, true, 6),
    ('contact_1077', 'District Disaster Control Room (SEOC 1077)', 'State', '1077', 'DISASTER', CURRENT_TIMESTAMP, true, 7),
    ('contact_1073', 'National Highway Emergency & Accident Response (1073)', 'National', '1073', 'ROAD_ACCIDENT', CURRENT_TIMESTAMP, true, 8),
    ('contact_1554', 'Indian Coast Guard Marine Search & Rescue (1554)', 'Coastal', '1554', 'CYCLONE', CURRENT_TIMESTAMP, true, 9),
    ('contact_1098', 'National Child Emergency Helpline (1098)', 'National', '1098', 'GENERAL', CURRENT_TIMESTAMP, true, 10)
ON CONFLICT ("id") DO UPDATE SET
    "serviceName" = EXCLUDED."serviceName",
    "region" = EXCLUDED."region",
    "telephoneNumber" = EXCLUDED."telephoneNumber",
    "category" = EXCLUDED."category",
    "active" = EXCLUDED."active",
    "priorityOrder" = EXCLUDED."priorityOrder";

-- ============================================================================
-- SEED DATA: Tactical Response Units with Real Coordinates
-- ============================================================================
INSERT INTO "ResponseTeam" ("id", "teamName", "serviceType", "availabilityStatus", "contactNumber", "baseLocation", "latitude", "longitude", "city")
VALUES
    ('team_sar_alpha', 'NDRF 8th Bn Alpha Quick Reaction SAR', 'SAR', 'AVAILABLE', '+91-11-24363260', 'Sector 19, Ghaziabad Ops Base', 28.6700, 77.4200, 'Delhi NCR'),
    ('team_med_bravo', '108 Rapid Trauma Resuscitation Unit 4', 'MEDICAL', 'AVAILABLE', '+91-9876543210', 'AIIMS Emergency Wing Staging Area', 28.5672, 77.2100, 'South Delhi'),
    ('team_fire_hazard', 'HazMat & Heavy Collapse Rescue Unit 12', 'FIRE', 'AVAILABLE', '+91-11-23412222', 'Central Fire Command HQ', 28.6300, 77.2180, 'Central Delhi'),
    ('team_police_qrf', 'Civil Defense Special Emergency Force Delta', 'CIVIL_DEFENSE', 'AVAILABLE', '+91-11-23315555', 'Regional Disaster Coordination Center', 28.6100, 77.2300, 'New Delhi'),
    ('team_sar_shimla', 'NDRF Mountain & Avalanche Rescue Unit 2', 'SAR', 'AVAILABLE', '+91-177-2808080', 'Shimla High Altitude Post', 31.1000, 77.1700, 'Shimla'),
    ('team_boat_rishikesh', 'SDRF Swift Water & Flash Flood Rescue 5', 'SAR', 'AVAILABLE', '+91-135-2430112', 'Ganga Flood Response Staging Camp', 30.0800, 78.2600, 'Rishikesh')
ON CONFLICT ("id") DO UPDATE SET
    "teamName" = EXCLUDED."teamName",
    "serviceType" = EXCLUDED."serviceType",
    "availabilityStatus" = EXCLUDED."availabilityStatus",
    "contactNumber" = EXCLUDED."contactNumber",
    "baseLocation" = EXCLUDED."baseLocation",
    "latitude" = EXCLUDED."latitude",
    "longitude" = EXCLUDED."longitude",
    "city" = EXCLUDED."city";

-- ============================================================================
-- SEED DATA: Active Relay Nodes
-- ============================================================================
INSERT INTO "RelayNode" ("id", "deviceName", "latitude", "longitude", "batteryLevel", "totalHopsRouted", "status")
VALUES
    ('NODE_RELAY_F291', 'Tactical Mast Relay Alpha (Sector 4)', 28.6150, 77.2080, 98, 142, 'ONLINE'),
    ('NODE_RELAY_C812', 'Solar Autonomous Mesh Beacon (Ridge)', 28.6250, 77.2150, 91, 89, 'ONLINE'),
    ('NODE_RELAY_M044', 'Mobile Responder Vehicle Node QRF-1', 28.5700, 77.2120, 84, 67, 'ONLINE'),
    ('NODE_RELAY_S910', 'High-Altitude Mountain Transceiver (Shimla)', 31.1020, 77.1710, 78, 215, 'ONLINE'),
    ('NODE_RELAY_R505', 'River Gorge LoRa/BLE Delay-Tolerant Node', 30.0850, 78.2650, 88, 104, 'ONLINE')
ON CONFLICT ("id") DO UPDATE SET
    "deviceName" = EXCLUDED."deviceName",
    "latitude" = EXCLUDED."latitude",
    "longitude" = EXCLUDED."longitude",
    "batteryLevel" = EXCLUDED."batteryLevel",
    "status" = EXCLUDED."status";
