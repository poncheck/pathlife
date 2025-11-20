#!/usr/bin/env python3
import sqlite3
import sys

db_path = 'pathlife.db'

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print(f"Applying GPX migrations to {db_path}...")

    # Add gpxPath column to DiaryEntry
    try:
        cursor.execute("ALTER TABLE DiaryEntry ADD COLUMN gpxPath TEXT")
        print("✓ Added gpxPath column to DiaryEntry table")
    except sqlite3.OperationalError as e:
        if 'duplicate column name' in str(e).lower():
            print("⚠ gpxPath column already exists in DiaryEntry table")
        else:
            raise

    # Add gpxPath column to Activity
    try:
        cursor.execute("ALTER TABLE Activity ADD COLUMN gpxPath TEXT")
        print("✓ Added gpxPath column to Activity table")
    except sqlite3.OperationalError as e:
        if 'duplicate column name' in str(e).lower():
            print("⚠ gpxPath column already exists in Activity table")
        else:
            raise

    conn.commit()
    print("\n✓ Migration completed successfully!")

    # Verify the changes
    cursor.execute("PRAGMA table_info(DiaryEntry)")
    diary_cols = [col[1] for col in cursor.fetchall()]
    print(f"\nDiaryEntry columns: {', '.join(diary_cols)}")

    cursor.execute("PRAGMA table_info(Activity)")
    activity_cols = [col[1] for col in cursor.fetchall()]
    print(f"Activity columns: {', '.join(activity_cols)}")

    conn.close()

except Exception as e:
    print(f"✗ Error: {e}", file=sys.stderr)
    sys.exit(1)
