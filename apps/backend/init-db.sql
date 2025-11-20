-- SQLite database initialization script
-- Creates all tables for PathLife app

CREATE TABLE IF NOT EXISTS "DiaryEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL UNIQUE,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "immichId" TEXT NOT NULL UNIQUE,
    "immichUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "takenAt" DATETIME NOT NULL,
    "selected" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT,
    "diaryEntryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("diaryEntryId") REFERENCES "DiaryEntry"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stravaId" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "distance" REAL,
    "movingTime" INTEGER,
    "elapsedTime" INTEGER,
    "totalElevation" REAL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "polyline" TEXT,
    "metadata" TEXT,
    "diaryEntryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("diaryEntryId") REFERENCES "DiaryEntry"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Location" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "traccarId" TEXT,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "address" TEXT,
    "timestamp" DATETIME NOT NULL,
    "speed" REAL,
    "altitude" REAL,
    "metadata" TEXT,
    "diaryEntryId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("diaryEntryId") REFERENCES "DiaryEntry"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "SyncLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "itemCount" INTEGER NOT NULL DEFAULT 0,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "Photo_diaryEntryId_idx" ON "Photo"("diaryEntryId");
CREATE INDEX IF NOT EXISTS "Photo_takenAt_idx" ON "Photo"("takenAt");
CREATE INDEX IF NOT EXISTS "Activity_diaryEntryId_idx" ON "Activity"("diaryEntryId");
CREATE INDEX IF NOT EXISTS "Activity_startDate_idx" ON "Activity"("startDate");
CREATE INDEX IF NOT EXISTS "Location_diaryEntryId_idx" ON "Location"("diaryEntryId");
CREATE INDEX IF NOT EXISTS "Location_timestamp_idx" ON "Location"("timestamp");
CREATE INDEX IF NOT EXISTS "SyncLog_source_timestamp_idx" ON "SyncLog"("source", "timestamp");
